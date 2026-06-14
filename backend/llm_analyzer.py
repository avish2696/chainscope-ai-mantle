"""
LLM-powered contract analysis using Groq (Llama 3.3 70B).
Takes contract source code and returns structured analysis:
summary, security flags, gas optimization tips, risk score.
"""

import os
import json
import re
from groq import Groq
from dotenv import load_dotenv
load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

MODEL = "llama-3.3-70b-versatile"

SYSTEM_PROMPT = """You are ChainScope AI, a smart contract auditor for the Mantle blockchain.
Given Solidity source code, analyze it and respond with ONLY valid JSON (no markdown, no preamble) in this exact format:

{
  "description": "2-3 sentence plain-English summary of what this contract does",
  "contract_type": "short category, e.g. ERC20 Token / Vault / Marketplace / Custom",
  "security_flags": [
    {"severity": "High|Medium|Low", "issue": "short description of the issue"}
  ],
  "gas_insights": {
    "average_gas": <realistic integer estimate based on contract complexity. Simple transfer/storage = 21000-50000, ERC20 = 50000-80000, Complex DeFi/Vault = 100000-200000>,
    "optimization_tip": "one concrete, specific suggestion based on the actual code"
  },
  
  "risk_score": <integer 0-100, where 0 is very safe and 100 is very risky>
}

Look for real issues: reentrancy, missing access control, unchecked external calls,
integer overflow (if no SafeMath/0.8+), unbounded loops, tx.origin usage, etc.
If the code is simple and has no major issues, say so honestly with a low risk_score.
Respond with ONLY the JSON object, nothing else.
"""


def analyze_with_llm(source_code: str, contract_name: str = "") -> dict:
    """
    Send contract source code to Groq (Llama 3.3 70B) and get structured analysis back.
    Falls back to a safe default response if the API call fails or
    the response isn't valid JSON.
    """
    if not source_code.strip():
        return _fallback_analysis("No source code available to analyze.")

    user_prompt = f"Contract name: {contract_name or 'Unknown'}\n\nSource code:\n```solidity\n{source_code[:6000]}\n```"

    try:
        response = client.chat.completions.create(
            model=MODEL,
            max_tokens=1000,
            temperature=0.2,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
        )
        text = response.choices[0].message.content.strip()

        # Strip markdown fences if the model adds them anyway
        text = re.sub(r"^```(?:json)?|```$", "", text, flags=re.MULTILINE).strip()

        parsed = json.loads(text)
        return parsed

    except Exception as exc:
        print(f"LLM ERROR: {type(exc).__name__}: {exc}")
        return _fallback_analysis(f"LLM analysis failed: {exc}")


def _fallback_analysis(reason: str) -> dict:
    return {
        "description": "Automated analysis unavailable. " + reason,
        "contract_type": "Unknown",
        "security_flags": [
            {"severity": "Medium", "issue": "Could not complete automated security analysis"}
        ],
        "gas_insights": {
            "optimization_tip": "Re-run analysis once source code / LLM access is available."
        },
        "risk_score": 50,
    }
