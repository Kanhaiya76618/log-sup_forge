"""Optional Groq LLM bridge. OWNER: P3/P4.
One strict-JSON chat call against Groq's OpenAI-compatible endpoint. The key
comes ONLY from the GROQ_API_KEY env var — never hardcode it. Every caller
must keep a deterministic fallback: this returns None when the key is missing,
the call fails, or the response isn't a JSON object, and the engine keeps
running offline exactly as before."""
from __future__ import annotations
import json
import os
import urllib.request

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"


def groq_json(system: str, user: str, timeout: float = 8.0) -> dict | None:
    key = os.environ.get("GROQ_API_KEY")
    if not key:
        return None
    body = {
        "model": GROQ_MODEL,
        "messages": [{"role": "system", "content": system},
                     {"role": "user", "content": user}],
        "temperature": 0.0,
        "max_tokens": 300,
        "response_format": {"type": "json_object"},
    }
    req = urllib.request.Request(
        GROQ_URL,
        data=json.dumps(body).encode(),
        headers={"Authorization": f"Bearer {key}",
                 "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            data = json.loads(r.read().decode())
        parsed = json.loads(data["choices"][0]["message"]["content"])
        return parsed if isinstance(parsed, dict) else None
    except Exception:
        return None
