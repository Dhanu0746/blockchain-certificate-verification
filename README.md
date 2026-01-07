🧾 Blockchain Certificate Verification System

A full-stack blockchain application to issue, verify, detect tampering, and revoke certificates using Solidity, IPFS, Node.js, and React.

This system ensures certificate authenticity by storing cryptographic hashes on the blockchain and verifying uploaded certificates against on-chain data.

🚀 Features

✅ Certificate Issuance by authorized issuers
🔍 Certificate Verification using cryptographic hash comparison
🛑 Tamper Detection for modified certificates
❌ Certificate Revocation by authorized issuers
📦 IPFS Integration for decentralized file storage
🔐 On-chain Access Control for issuers
🌐 User-friendly React frontend

🧠 How It Works

Issuance
Certificate file is uploaded
A SHA-256 hash of the certificate file is generated at the application layer, while Ethereum internally uses Keccak-256 for blockchain operations.
File is stored on IPFS
Hash + IPFS CID are stored on blockchain

Verification
User uploads certificate
Hash is recomputed
Compared with on-chain hash

Verification result returned:
VALID
TAMPERED
REVOKED
NOT_FOUND

Revocation
Authorized issuer revokes certificate
Revocation status stored on-chain
Revoked certificates remain permanently invalid

🛠️ Tech Stack
Blockchain
Solidity
Hardhat
Ethers.js

Backend
Node.js
Express.js
IPFS (Pinata)
Multer (file uploads)

Frontend
React
React Router
Tailwind CSS
Axios

📁 Project Structure

blockchain/
│
├── contracts/              # Solidity smart contracts
│   └── CertificateRegistry.sol
│
├── scripts/                # Deployment scripts
│   └── deploy.js
│
├── backend/                # Express backend
│   └── server.js
│
├── cert-frontend/          # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Issue.jsx
│   │   │   ├── Verify.jsx
│   │   │   └── Revoke.jsx
│   │   └── api.js
│
└── README.md


▶️ How to Run Locally
1️⃣ Start Local Blockchain
npx hardhat node

2️⃣ Deploy Smart Contract
npx hardhat run scripts/deploy.js --network localhost

Copy the deployed contract address.

3️⃣ Setup Backend
Create .env inside backend/:

RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=YOUR_DEPLOYED_ADDRESS
PRIVATE_KEY=YOUR_BACKEND_WALLET_PRIVATE_KEY
PINATA_JWT=YOUR_PINATA_JWT

Start backend:
cd backend
node server.js

4️⃣ Start Frontend
cd cert-frontend
npm start

🧪 Demo Flow

Issue a certificate
Verify → VALID
Modify file → TAMPERED
Revoke certificate
Verify again → REVOKED
Random certificate ID → NOT_FOUND

🔐 Security Design
Only authorized issuers can issue or revoke certificates
Issuer roles are assigned during deployment
Blockchain ensures immutability and transparency
Revocation overrides hash verification

📌 Key Learnings

ABI and contract synchronization in Web3
On-chain access control mechanisms
Hash-based integrity verification
IPFS + blockchain integration
Debugging real blockchain backend issues

🧠 Future Enhancements

Public testnet deployment
QR code based verification
Multi-organization issuer support
Certificate expiry support

👤 Author

Dhanu Shree
Blockchain & Full-Stack Developer

