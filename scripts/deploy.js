const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying CertificateRegistry...");

  // Ensure contract is compiled
  await hre.run("compile");

  const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");
  const registry = await CertificateRegistry.deploy();

  // Wait for deployment (Hardhat v6 style)
  await registry.waitForDeployment();

  const contractAddress = await registry.getAddress();
  console.log("✅ CertificateRegistry deployed to:", contractAddress);

  // ================= STEP-1: AUTHORIZE BACKEND WALLET =================
  // 🔐 This wallet is used by your Express backend
  const BACKEND_WALLET = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  const tx = await registry.addIssuer(BACKEND_WALLET);
  await tx.wait();

  console.log("✅ Backend wallet authorized as issuer");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
