const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertificateRegistry", function () {
  let CertificateRegistry;
  let registry;
  let owner, issuer, user;

  const certId = "CERT-001";
  const fileHash = ethers.keccak256(
    ethers.toUtf8Bytes("original-certificate")
  );
  const tamperedHash = ethers.keccak256(
    ethers.toUtf8Bytes("tampered-certificate")
  );
  const ipfsCid = "QmTestCID123";

  beforeEach(async function () {
    [owner, issuer, user] = await ethers.getSigners();

    CertificateRegistry = await ethers.getContractFactory(
      "CertificateRegistry"
    );
    registry = await CertificateRegistry.deploy();
    await registry.waitForDeployment();
  });

  it("Should set deployer as owner", async function () {
    expect(await registry.owner()).to.equal(owner.address);
  });

  it("Owner should be able to add an issuer", async function () {
    await registry.addIssuer(issuer.address);
    expect(await registry.authorizedIssuers(issuer.address)).to.equal(true);
  });

  it("Unauthorized user should NOT issue certificate", async function () {
    await expect(
      registry
        .connect(user)
        .registerCertificate(certId, fileHash, ipfsCid)
    ).to.be.revertedWith("Not authorized issuer");
  });

  it("Authorized issuer should issue certificate", async function () {
    await registry.addIssuer(issuer.address);

    await registry
      .connect(issuer)
      .registerCertificate(certId, fileHash, ipfsCid);

    const result = await registry.verifyCertificate(certId, fileHash);
    expect(result).to.equal(3); // VALID
  });

  it("Should detect tampered certificate", async function () {
    await registry.addIssuer(issuer.address);

    await registry
      .connect(issuer)
      .registerCertificate(certId, fileHash, ipfsCid);

    const result = await registry.verifyCertificate(certId, tamperedHash);
    expect(result).to.equal(2); // TAMPERED
  });

  it("Should detect revoked certificate", async function () {
    await registry.addIssuer(issuer.address);

    await registry
      .connect(issuer)
      .registerCertificate(certId, fileHash, ipfsCid);

    await registry.connect(issuer).revokeCertificate(certId);

    const result = await registry.verifyCertificate(certId, fileHash);
    expect(result).to.equal(1); // REVOKED
  });

  it("Should return NOT_FOUND for unknown certificate", async function () {
    const result = await registry.verifyCertificate(
      "UNKNOWN",
      fileHash
    );
    expect(result).to.equal(0); // NOT_FOUND
  });
});
