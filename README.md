# Web3 Based Document Ledger

A decentralized file management system built on Solana blockchain that allows users to securely upload, retrieve, share, and manage their files using IPFS and cryptography.

## Features

- Secure file upload and storage
- File sharing capabilities
- Access control and revocation
- Integration with Solana blockchain
- User authentication system
- Interactive dashboard

## Prerequisites

- Node.js and npm installed
- Solana CLI tools
- Anchor framework
- A Solana-compatible wallet (like Phantom)
- PostgreSQL database

## Project Setup

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd my-app
npm install
```

2. Create a `.env` file in the frontend directory:

```bash
NEXT_PUBLIC_SOLANA_API_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SERVER_API_URL=http://13.127.155.114:5000
```

3. Start the frontend:

```bash
npm run dev
```

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
npm install
```

2. Create a `.env` file in the backend directory:

```bash
DATABASE_URL="postgresql://myuser:mypassword@localhost:5432/mydatabase?schema=public"
JWT_SECRET="your_jwt_secret"
PINATA_API_KEY="your_pinata_api_key"
PINATA_API_SECRET="your_pinata_api_secret"
```

3. Start the backend:

```bash
npm run dev
```

### Database Setup

1. Install PostgreSQL if not already installed
2. Create a new database and user
3. Update the DATABASE_URL in backend `.env` with your database credentials

### Solana Program Setup

The program is currently deployed on Solana devnet. For local testing:

1. Set up the Solana CLI and Anchor framework
2. Configure your local environment:
   ```bash
   solana config set --url devnet
   ```
3. Airdrop SOL tokens (if needed):
   ```bash
   solana airdrop 2 <YOUR_WALLET_ADDRESS>
   ```
4. Build and deploy (for local development):
   ```bash
   anchor build
   anchor deploy
   ```

## Usage Guide

1. Connect your Solana-supported wallet to the application
2. Configure your wallet to use the Solana devnet
3. Ensure you have sufficient SOL tokens in your wallet
   - Get tokens from [Solana Faucet](https://solfaucet.com)
4. Register/Login to access the dashboard
5. Use the dashboard to manage your files:
   - Upload files
   - Retrieve files
   - Share files with other users
   - Revoke access to shared files
   - Delete files

## API Configuration

### Pinata IPFS

- Sign up for a Pinata account at https://app.pinata.cloud
- Generate API keys from your dashboard
- Add the API credentials to your backend `.env` file

### Solana

- The application uses Solana devnet by default
- Make sure your wallet is configured to use devnet
- Get test tokens from the Solana Faucet for testing

## Development Status

This project is currently in development phase and deployed on Solana devnet.

## Security Notice

- Keep your `.env` files secure and never commit them to version control
- Protect your API keys and JWT secrets
- Regularly rotate your credentials for security
