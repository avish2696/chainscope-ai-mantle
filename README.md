# ChainScope AI — Smart Contract Auditor for Mantle

AI-powered smart contract analysis for Mantle Network. Paste any Mantle contract address and receive an instant plain-English audit — transactions decoded, gas patterns identified, and security risks ranked.

![Backend](https://img.shields.io/badge/backend-FastAPI-009688?logo=fastapi)
![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20Vite-61DAFB?logo=react)
![LLM](https://img.shields.io/badge/llm-Groq%20%7C%20Llama_3.3_70B-blue)
![Network](https://img.shields.io/badge/network-Mantle_Sepolia_Testnet-000)

---

## Deployed Contracts

**Mantle Sepolia Testnet**

| Contract | Address | Description |
|----------|---------|-------------|
| Primary | `0x6758D4228f51EAcC011Bb986fccc1816838eb338` | Main deployed contract |
| Secondary | `0xb8dB8c1Bdb202B990c70732f1aa1653Cd929978B` | Secondary contract |

## Live Endpoints

| Service | URL |
|---------|-----|
| Frontend | https://your-frontend.vercel.app |
| Backend API | https://chainscope-ai-mantle.onrender.com |

---

## Architecture

```
chainscope-ai-mantle
├── frontend/                # React + Vite frontend
│   ├── src/
│   │   ├── main.jsx        # App entry
│   │   ├── App.jsx         # Main UI with MagicBento cards
│   │   └── App.css         # Styling
│   ├── package.json
│   ├── vite.config.js      # Dev proxy to localhost:8000
│   └── .env.example        # VITE_API_URL template
│
├── backend/                 # FastAPI backend
│   ├── main.py             # App entry, / and /analyze routes
│   ├── mantle_fetch.py     # Mantle Sepolia explorer API client
│   ├── llm_analyzer.py     # Groq LLM analysis (Llama 3.3 70B)
│   └── requirements.txt    # Python deps
│
└── contracts/               # Solidity contracts (reserved)
```

### Data Flow

```
User Input (contract address)
        │
        ▼
   Frontend (React)
        │  POST /analyze
        ▼
   FastAPI Backend
        │
        ├──▶ mantle_fetch.py
        │         └──▶ Mantle Sepolia Explorer API
        │                   └──▶ Source code + ABI (if verified)
        │
        └──▶ llm_analyzer.py
                  └──▶ Groq API (Llama 3.3 70B)
                            └──▶ Structured audit (JSON)
        │
        ▼
   Response (risk score, flags, gas insights, summary)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 5 + CSS |
| Backend | FastAPI + Python 3.10+ |
| Data Source | Mantle Sepolia Explorer (Blocks) |
| LLM / Analysis | Groq API — Llama 3.3 70B Versatile |
| Deployment | Vercel (frontend) + Render (backend) |

---

## Local Setup

### 1. Backend

```bash
cd backend

# Create a virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env       # or create manually
# Required: GROQ_API_KEY=<your_groq_api_key>

# Start the server
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`. API docs available at `http://localhost:8000/docs`.

### 2. Frontend

```bash
cd frontend

npm install

cp .env.example .env.local
# Set VITE_API_URL=http://localhost:8000

npm run dev
```

Frontend runs at `http://localhost:5173` with API proxy to localhost:8000.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Yes | API key for Groq LLM inference |

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `https://chainscope-ai-mantle.onrender.com` | Backend API base URL |

---

## API Reference

### `GET /`

Health check endpoint.

**Response:**
```json
{
  "message": "ChainScope AI Backend Running"
}
```

### `POST /analyze`

Analyze a smart contract address.

**Request Body:**
```json
{
  "contract_address": "0x6758D4228f51EAcC011Bb986fccc1816838eb338"
}
```

**Response:**
```json
{
  "success": true,
  "contract_address": "0x6758D4228f51EAcC011Bb986fccc1816838eb338",
  "is_verified": true,
  "contract_name": "SampleVerifiedContract",
  "source_code": "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.20;\n...",
  "summary": {
    "contract_type": "ERC20 Token",
    "description": "A standard ERC20 token contract with minting and burning functionality."
  },
  "gas_insights": {
    "average_gas": 45000,
    "optimization_tip": "Consider using unchecked blocks for arithmetic operations in Solidity 0.8+."
  },
  "security_flags": [
    {
      "severity": "Medium",
      "issue": "Reentrancy risk in withdraw function — consider Checks-Effects-Interactions pattern."
    }
  ],
  "risk_score": 42
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Request success status |
| `contract_address` | string | Quoted contract address |
| `is_verified` | boolean | Whether source code is verified on explorer |
| `contract_name` | string | Contract name from explorer |
| `source_code` | string | Full verified source code (truncated if >5KB) |
| `summary.contract_type` | string | Category: ERC20 / ERC721 / Vault / Marketplace / Custom |
| `summary.description` | string | Plain-English description of contract purpose |
| `gas_insights.average_gas` | number | Average gas used across recent transactions |
| `gas_insights.optimization_tip` | string | Specific gas optimization suggestion |
| `security_flags` | array | List of detected security issues with severity |
| `risk_score` | integer | 0 (very safe) to 100 (very risky) |

---

## Feature Cards

- **Transaction Summary** — Every interaction decoded into plain English. Volume, frequency, patterns — laid bare without jargon.
- **Gas Intelligence** — Understand exactly where gas burns. Optimization tips grounded in your contract's actual behaviour.
- **Security Flags** — RAG-powered vulnerability detection against a curated Solidity security knowledge base. Risk, ranked.
- **On-chain Verifiability** — Audit summary anchored on Mantle Testnet. Your report, permanently verifiable on-chain.

---

## MCPs & Integrations

| Service | Purpose |
|---------|---------|
| Mantle Sepolia Explorer | Fetches verified source code, ABI, balance, transactions |
| Groq API | LLM inference for structured contract analysis |

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

## License

MIT — Built with care for the Mantle ecosystem · Hackathon 2026
