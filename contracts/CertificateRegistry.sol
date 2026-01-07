// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CertificateRegistry {

    enum VerificationStatus {
        NOT_FOUND,
        REVOKED,
        TAMPERED,
        VALID
    }

    struct Certificate {
        address issuer;
        bytes32 fileHash;
        string ipfsCid;
        uint256 issuedAt;
    }

    address public owner;

    mapping(string => Certificate) private _certificates;
    mapping(string => bool) public revokedCertificates;
    mapping(address => bool) public authorizedIssuers;

    event CertificateRegistered(
        string indexed certId,
        address indexed issuer,
        bytes32 fileHash,
        string ipfsCid,
        uint256 issuedAt
    );

    event CertificateRevoked(
        string indexed certId,
        address indexed revokedBy,
        uint256 revokedAt
    );

    event IssuerAdded(address indexed issuer);
    event IssuerRemoved(address indexed issuer);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not contract owner");
        _;
    }

    modifier onlyIssuer() {
        require(authorizedIssuers[msg.sender], "Not authorized issuer");
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedIssuers[msg.sender] = true;
    }

    function addIssuer(address issuer) external onlyOwner {
        require(issuer != address(0), "Invalid address");
        authorizedIssuers[issuer] = true;
        emit IssuerAdded(issuer);
    }

    function removeIssuer(address issuer) external onlyOwner {
        authorizedIssuers[issuer] = false;
        emit IssuerRemoved(issuer);
    }

    function registerCertificate(
        string calldata certId,
        bytes32 fileHash,
        string calldata ipfsCid
    ) external onlyIssuer {
        require(_certificates[certId].issuedAt == 0, "Certificate already registered");

        _certificates[certId] = Certificate({
            issuer: msg.sender,
            fileHash: fileHash,
            ipfsCid: ipfsCid,
            issuedAt: block.timestamp
        });

        emit CertificateRegistered(
            certId,
            msg.sender,
            fileHash,
            ipfsCid,
            block.timestamp
        );
    }

    function revokeCertificate(string calldata certId) external onlyIssuer {
        Certificate storage cert = _certificates[certId];
        require(cert.issuedAt != 0, "Certificate not found");
        require(!revokedCertificates[certId], "Already revoked");

        revokedCertificates[certId] = true;

        emit CertificateRevoked(certId, msg.sender, block.timestamp);
    }

    function getCertificate(string calldata certId)
        external
        view
        returns (
            address issuer,
            bytes32 fileHash,
            string memory ipfsCid,
            uint256 issuedAt,
            bool revoked
        )
    {
        Certificate storage cert = _certificates[certId];
        require(cert.issuedAt != 0, "Certificate not found");

        return (
            cert.issuer,
            cert.fileHash,
            cert.ipfsCid,
            cert.issuedAt,
            revokedCertificates[certId]
        );
    }

    function verifyCertificate(
        string calldata certId,
        bytes32 fileHash
    ) external view returns (VerificationStatus) {
        Certificate storage cert = _certificates[certId];

        if (cert.issuedAt == 0) {
            return VerificationStatus.NOT_FOUND;
        }

        if (revokedCertificates[certId]) {
            return VerificationStatus.REVOKED;
        }

        if (cert.fileHash != fileHash) {
            return VerificationStatus.TAMPERED;
        }

        return VerificationStatus.VALID;
    }
}
