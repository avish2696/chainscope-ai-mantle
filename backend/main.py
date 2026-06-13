from fastapi import FastAPI
from pydantic import BaseModel
from mantle_fetch import fetch_contract_source
from llm_analyzer import analyze_with_llm
from dotenv import load_dotenv
load_dotenv()


app = FastAPI(
    title="ChainScope AI API",
    description="Smart Contract Analysis API for Mantle",
    version="1.0.0"
)


class AnalyzeRequest(BaseModel):
    contract_address: str


@app.get("/")
def home():
    return {
        "message": "ChainScope AI Backend Running"
    }


@app.post("/analyze")
async def analyze_contract(data: AnalyzeRequest):
    contract_address = data.contract_address
    explorer_data = await fetch_contract_source(contract_address)

    source_code = explorer_data.get("source_code") or ""
    is_verified = bool(explorer_data.get("is_verified"))
    contract_name = explorer_data.get("name")

    llm_result = analyze_with_llm(source_code, contract_name)

    return {
        "success": True,
        "contract_address": contract_address,
        "is_verified": is_verified,
        "contract_name": contract_name,
        "source_code": source_code,
        "summary": {
            "contract_type": llm_result.get("contract_type", "Unknown"),
            "description": llm_result.get("description", "")
        },
        "gas_insights": llm_result.get("gas_insights", {}),
        "security_flags": llm_result.get("security_flags", []),
        "risk_score": llm_result.get("risk_score", 50)
    }