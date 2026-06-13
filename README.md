# Chainscope AI Mantle

FastAPI backend for analyzing job contract addresses.

## Deployed Contracts

**Mantle Sepolia:**
- `0x6758D4228f51EAcC011Bb986fccc1816838eb338` (primary)
- `0xb8dB8c1Bdb202B990c70732f1aa1653Cd929978B` (secondary)

## Structure
- `/backend` - FastAPI application with `/analyze` endpoint
- `/frontend` - Frontend application (TBD)
- `/contracts` - Smart contract files (TBD)

## Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

## API
- `GET /` - Health check
- `POST /analyze` - Analyze contract address (accepts JSON with `contract_address` field)