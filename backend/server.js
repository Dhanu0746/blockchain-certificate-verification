require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const crypto = require("crypto");
const { ethers } = require("ethers");
const pinataSDK = require("@pinata/sdk");
const stream = require("stream");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer();

// ================= Blockchain Setup ===================

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY.trim(), provider);

// ✅ ABI MATCHES DEPLOYED CONTRACT
const abi = [
  "function registerCertificate(string certId, bytes32 fileHash, string ipfsCid) external",
  "function revokeCertificate(string certId) external",
  "function getCertificate(string certId) external view returns (address, bytes32, string memory, uint256, bool)",
  "function verifyCertificate(string certId, bytes32 fileHash) external view returns (uint8)"
];


const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  abi,
  signer
);

// ================= Pinata Setup ===================

const pinata = new pinataSDK({
  pinataJWTKey: process.env.PINATA_JWT,
});

async function uploadToIPFS(buffer, filename) {
  const readable = new stream.PassThrough();
  readable.end(buffer);

  const result = await pinata.pinFileToIPFS(readable, {
    pinataMetadata: { name: filename },
  });

  return result.IpfsHash;
}

// ====================== ISSUE CERTIFICATE ======================

app.post("/issue", upload.single("file"), async (req, res) => {
  try {
    // ✅ TRIM certId (CRITICAL FIX)
    const certId = req.body.certId?.trim();
    if (!certId || !req.file) {
      return res.status(400).json({ error: "Missing certId or file" });
    }

    const hashHex = crypto
      .createHash("sha256")
      .update(req.file.buffer)
      .digest("hex");

    const hashBytes32 = ethers.zeroPadValue("0x" + hashHex, 32);

    const ipfsCid = await uploadToIPFS(
      req.file.buffer,
      req.file.originalname
    );

    const tx = await contract.registerCertificate(
      certId,
      hashBytes32,
      ipfsCid
    );
    await tx.wait();

    return res.json({
      success: true,
      certId,
      ipfsCid,
      txHash: tx.hash,
    });

  } catch (err) {
    console.error("Issue Error:", err);
    return res.status(500).json({ error: "Issue failed" });
  }
});

// ====================== VERIFY CERTIFICATE ======================

app.post("/verify", upload.single("file"), async (req, res) => {
  try {
    // ✅ TRIM certId (CRITICAL FIX)
    const certId = req.body.certId?.trim();
    if (!certId || !req.file) {
      return res.status(400).json({ error: "Missing certId or file" });
    }

    const computedHash =
      "0x" +
      crypto.createHash("sha256")
        .update(req.file.buffer)
        .digest("hex");

    let cert;
    try {
      cert = await contract.getCertificate(certId);
    } catch {
      // ✅ Certificate ID not found on blockchain
      return res.json({ status: "NOT_FOUND" });
    }

    const [issuer, storedHash, ipfsCid, issuedAt, revoked] = cert;

    if (revoked) {
      return res.json({ status: "REVOKED", certificate: { issuer, ipfsCid, issuedAt: issuedAt.toString() } });
    }

    if (storedHash.toLowerCase() !== computedHash.toLowerCase()) {
      return res.json({ status: "TAMPERED", certificate: { issuer, ipfsCid, issuedAt: issuedAt.toString() } });
    }

    return res.json({ status: "VALID", certificate: { issuer, ipfsCid, issuedAt: issuedAt.toString() } });

  } catch (err) {
    console.error("Verify Error:", err);
    return res.status(500).json({ error: "Verification failed" });
  }
});

app.post("/revoke", async (req, res) => {
  try {
    const certId = req.body.certId?.trim();
    if (!certId) {
      return res.status(400).json({ error: "Missing certId" });
    }

    const tx = await contract.revokeCertificate(certId);
    await tx.wait();

    return res.json({
      success: true,
      certId,
      txHash: tx.hash,
    });
  } catch (err) {
    console.error("Revoke Error:", err.reason || err.message);
    return res.status(500).json({
      error: err.reason || err.message,
    });
  }

});


// ====================== START SERVER ======================

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
