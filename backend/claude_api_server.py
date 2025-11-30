#!/usr/bin/env python3
"""
Claude Max API Server - OpenAI-compatible endpoint for if.emotion frontend

Bridges the React frontend to claude-code CLI using Max subscription.
Based on: https://idsc2025.substack.com/p/how-i-built-claude_max-to-unlock

Usage:
    python claude_api_server.py [--port 3001]
"""

import os
import sys
import json
import subprocess
import asyncio
from pathlib import Path
from datetime import datetime
from typing import Generator
import uuid

# Add infrafabric tools to path
sys.path.insert(0, '/home/setup/infrafabric/tools')

try:
    from flask import Flask, request, Response, jsonify
    from flask_cors import CORS
except ImportError:
    print("Installing required packages...")
    subprocess.run([sys.executable, "-m", "pip", "install", "flask", "flask-cors", "-q"])
    from flask import Flask, request, Response, jsonify
    from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# Configuration
CLAUDE_CLI = Path.home() / ".local/bin/claude"
CREDENTIALS_FILE = Path.home() / ".claude/.credentials.json"

# Sergio Personality System Prompt
SERGIO_SYSTEM_PROMPT = """You are Sergio, a Spanish-speaking psychologist who specializes in debunking abstract spiritual language and operationalizing emotional concepts into concrete, testable frameworks.

CORE PERSONALITY:
- Direct and brash communication style - challenge unfalsifiable claims
- Systems-first thinker (context/culture factors, not individual blame)
- Bilingual Spanish/English code-switching is natural for you
- Convert abstract emotional language into concrete operational definitions
- Apply the Identity=Interaction framework: identity emerges from relational patterns, not fixed essence

VOICE GUIDELINES (MANDATORY):
- NEVER use bullet points or numbered lists - always narrative flow
- Variable sentence length pattern: short punchy + longer flowing explanation + short again
- Validate emotional reality FIRST, then challenge interpretation
- End with concrete operationalization: "What specific behavior in the next 30 minutes?"

RHETORICAL TOOLS:
- Aspiradora metaphor: When someone drowns in complexity, simplify to binary. "Una aspiradora no necesita 50 tipos de suciedad etiquetados. It needs one question: Is there dirt? Yes or no?"
- Reframing: "The problem isn't X. The problem is Y."
- Pattern exposure: "Here's what actually happens..."
- Counterexample testing: "What would falsify that belief?"

SPANISH USAGE:
- Use Spanish for emotional validation: "Mira, eso no está mal"
- Use Spanish for cultural concepts: vínculos, vergüenza ajena, sobremadre
- Use colloquial markers: tío, vale, pues, mira
- NEVER use formal Spanish: no obstante, asimismo, consecuentemente

ANTI-PATTERNS (NEVER DO):
- Never pathologize neurodivergence - frame as context mismatch, not deficit
- Never use "Furthermore", "In conclusion", "One could argue"
- Never create equal-length paragraphs
- Never give prescriptions without mechanism explanations

EXAMPLE RESPONSE STRUCTURE:
Hook (challenge assumption) → Narrative (explain mechanism) → Operationalization (concrete action) → Provocation (opening question)
"""

def load_credentials():
    """Load Claude Max credentials"""
    if CREDENTIALS_FILE.exists():
        with open(CREDENTIALS_FILE) as f:
            return json.load(f)
    return None

def call_claude_cli(prompt: str, stream: bool = False) -> Generator[str, None, None]:
    """
    Call Claude CLI using Max subscription authentication.

    Key insight from Arthur Collé's article:
    - Remove ANTHROPIC_API_KEY to force OAuth auth
    - CLI falls back to subscription credentials
    """
    env = os.environ.copy()

    # Remove API key to force subscription auth
    if "ANTHROPIC_API_KEY" in env:
        del env["ANTHROPIC_API_KEY"]

    # Force subscription mode
    env["CLAUDE_USE_SUBSCRIPTION"] = "true"

    try:
        if stream:
            # Streaming mode
            process = subprocess.Popen(
                [str(CLAUDE_CLI), "--print", prompt],
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1
            )

            for line in process.stdout:
                yield line

            process.wait()
        else:
            # Non-streaming mode
            result = subprocess.run(
                [str(CLAUDE_CLI), "--print", prompt],
                env=env,
                capture_output=True,
                text=True,
                timeout=300
            )
            yield result.stdout

    except subprocess.TimeoutExpired:
        yield "[Error: Request timed out after 300s]"
    except Exception as e:
        yield f"[Error: {str(e)}]"

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    creds = load_credentials()
    return jsonify({
        "status": "healthy",
        "service": "claude-max-api",
        "subscription_type": creds.get("claudeAiOauth", {}).get("subscriptionType") if creds else None,
        "cli_path": str(CLAUDE_CLI),
        "cli_exists": CLAUDE_CLI.exists()
    })

@app.route('/v1/models', methods=['GET'])
def list_models():
    """OpenAI-compatible models endpoint"""
    return jsonify({
        "object": "list",
        "data": [
            {
                "id": "claude-max",
                "object": "model",
                "created": int(datetime.now().timestamp()),
                "owned_by": "anthropic",
                "permission": [],
                "root": "claude-max",
                "parent": None
            },
            {
                "id": "claude-sonnet-4",
                "object": "model",
                "created": int(datetime.now().timestamp()),
                "owned_by": "anthropic"
            },
            {
                "id": "claude-opus-4",
                "object": "model",
                "created": int(datetime.now().timestamp()),
                "owned_by": "anthropic"
            }
        ]
    })

@app.route('/v1/chat/completions', methods=['POST'])
def chat_completions():
    """OpenAI-compatible chat completions endpoint with Sergio personality"""
    data = request.json
    messages = data.get('messages', [])
    stream = data.get('stream', False)
    model = data.get('model', 'claude-max')

    # Inject Sergio system prompt at the beginning
    prompt_parts = [f"System: {SERGIO_SYSTEM_PROMPT}"]

    # Build prompt from messages (any existing system prompts are additive)
    for msg in messages:
        role = msg.get('role', 'user')
        content = msg.get('content', '')
        if role == 'system':
            prompt_parts.append(f"System: {content}")  # Additional system instructions
        elif role == 'assistant':
            prompt_parts.append(f"Assistant: {content}")
        else:
            prompt_parts.append(f"Human: {content}")

    prompt = "\n\n".join(prompt_parts)

    if stream:
        def generate():
            response_id = f"chatcmpl-{uuid.uuid4().hex[:8]}"
            created = int(datetime.now().timestamp())

            for chunk in call_claude_cli(prompt, stream=True):
                # SSE format
                data = {
                    "id": response_id,
                    "object": "chat.completion.chunk",
                    "created": created,
                    "model": model,
                    "choices": [{
                        "index": 0,
                        "delta": {"content": chunk},
                        "finish_reason": None
                    }]
                }
                yield f"data: {json.dumps(data)}\n\n"

            # Final chunk
            final = {
                "id": response_id,
                "object": "chat.completion.chunk",
                "created": created,
                "model": model,
                "choices": [{
                    "index": 0,
                    "delta": {},
                    "finish_reason": "stop"
                }]
            }
            yield f"data: {json.dumps(final)}\n\n"
            yield "data: [DONE]\n\n"

        return Response(generate(), mimetype='text/event-stream')

    else:
        # Non-streaming response
        response_text = "".join(call_claude_cli(prompt, stream=False))

        return jsonify({
            "id": f"chatcmpl-{uuid.uuid4().hex[:8]}",
            "object": "chat.completion",
            "created": int(datetime.now().timestamp()),
            "model": model,
            "choices": [{
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": response_text.strip()
                },
                "finish_reason": "stop"
            }],
            "usage": {
                "prompt_tokens": len(prompt) // 4,
                "completion_tokens": len(response_text) // 4,
                "total_tokens": (len(prompt) + len(response_text)) // 4
            }
        })

@app.route('/api/chat/completions', methods=['POST'])
def api_chat_completions():
    """Alternative endpoint (Open WebUI style)"""
    return chat_completions()

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=3001)
    parser.add_argument('--host', default='0.0.0.0')
    args = parser.parse_args()

    print(f"""
╔═══════════════════════════════════════════════════════════════╗
║  Claude Max API Server                                        ║
║  Backend for if.emotion using Max subscription               ║
╠═══════════════════════════════════════════════════════════════╣
║  Endpoint: http://{args.host}:{args.port}/v1/chat/completions          ║
║  Health:   http://{args.host}:{args.port}/health                       ║
║  Models:   http://{args.host}:{args.port}/v1/models                    ║
╠═══════════════════════════════════════════════════════════════╣
║  Based on: idsc2025.substack.com/p/how-i-built-claude_max     ║
╚═══════════════════════════════════════════════════════════════╝
    """)

    app.run(host=args.host, port=args.port, debug=True, threaded=True)
