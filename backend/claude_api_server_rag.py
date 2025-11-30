#!/usr/bin/env python3
"""
Claude Max API Server v2.1 - with ChromaDB RAG for Sergio Personality DNA

OpenAI-compatible endpoint for if.emotion frontend with full RAG retrieval.
Based on: https://idsc2025.substack.com/p/how-i-built-claude_max-to-unlock

Usage:
    python claude_api_server_rag.py [--port 3001]
"""

import os
import sys
import json
import subprocess
from pathlib import Path
from datetime import datetime
from typing import Generator
import uuid

try:
    from flask import Flask, request, Response, jsonify
    from flask_cors import CORS
except ImportError:
    print("Installing flask...")
    subprocess.run([sys.executable, "-m", "pip", "install", "flask", "flask-cors", "-q"])
    from flask import Flask, request, Response, jsonify
    from flask_cors import CORS

# ChromaDB for RAG
try:
    import chromadb
    CHROMADB_AVAILABLE = True
except ImportError:
    print("ChromaDB not available - running without RAG")
    CHROMADB_AVAILABLE = False

app = Flask(__name__)
CORS(app)

# Configuration
CLAUDE_CLI = Path.home() / ".local/bin/claude"
CREDENTIALS_FILE = Path.home() / ".claude/.credentials.json"
CHROMADB_PATH = "/root/sergio_chatbot/chromadb"

# Collection names (all 4 populated)
COLLECTIONS = {
    "personality": "sergio_personality",  # 20 docs - frameworks, values, constraints
    "rhetorical": "sergio_rhetorical",    # 5 docs - rhetorical devices
    "humor": "sergio_humor",              # 28 docs - humor patterns
    "corpus": "sergio_corpus"             # 70 docs - conversation examples
}

# Initialize ChromaDB
chroma_client = None
chroma_collections = {}

if CHROMADB_AVAILABLE:
    try:
        chroma_client = chromadb.PersistentClient(path=CHROMADB_PATH)
        for key, name in COLLECTIONS.items():
            try:
                chroma_collections[key] = chroma_client.get_collection(name)
                print(f"Loaded {name}: {chroma_collections[key].count()} docs")
            except Exception as e:
                print(f"Warning: Could not load {name}: {e}")
    except Exception as e:
        print(f"ChromaDB initialization failed: {e}")

# Sergio System Prompt (base)
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

{personality_context}"""


def retrieve_context(user_message: str) -> str:
    """Query all ChromaDB collections for relevant Sergio context"""
    if not chroma_client:
        return ""

    context_parts = []

    try:
        # Query corpus for similar conversation examples (most important)
        if "corpus" in chroma_collections:
            corpus_results = chroma_collections["corpus"].query(
                query_texts=[user_message],
                n_results=3
            )
            if corpus_results and corpus_results['documents'] and corpus_results['documents'][0]:
                context_parts.append("CONVERSATION EXAMPLES FROM SERGIO:")
                for doc in corpus_results['documents'][0]:
                    context_parts.append(doc[:500])  # Truncate long examples

        # Query personality for frameworks
        if "personality" in chroma_collections:
            personality_results = chroma_collections["personality"].query(
                query_texts=[user_message],
                n_results=2
            )
            if personality_results and personality_results['documents'] and personality_results['documents'][0]:
                context_parts.append("\nPERSONALITY FRAMEWORKS:")
                for doc in personality_results['documents'][0]:
                    context_parts.append(doc[:300])

        # Query rhetorical devices
        if "rhetorical" in chroma_collections:
            rhetorical_results = chroma_collections["rhetorical"].query(
                query_texts=[user_message],
                n_results=1
            )
            if rhetorical_results and rhetorical_results['documents'] and rhetorical_results['documents'][0]:
                context_parts.append("\nRHETORICAL DEVICE TO USE:")
                context_parts.append(rhetorical_results['documents'][0][0][:200])

        # Query humor patterns (if topic seems appropriate)
        humor_keywords = ['absurd', 'ridicul', 'spirit', 'vibra', 'energ', 'manifest', 'univers']
        if any(kw in user_message.lower() for kw in humor_keywords):
            if "humor" in chroma_collections:
                humor_results = chroma_collections["humor"].query(
                    query_texts=[user_message],
                    n_results=2
                )
                if humor_results and humor_results['documents'] and humor_results['documents'][0]:
                    context_parts.append("\nHUMOR PATTERNS TO DEPLOY:")
                    for doc in humor_results['documents'][0]:
                        context_parts.append(doc[:200])

    except Exception as e:
        print(f"RAG retrieval error: {e}")

    return "\n".join(context_parts) if context_parts else ""


def load_credentials():
    """Load Claude Max credentials"""
    if CREDENTIALS_FILE.exists():
        with open(CREDENTIALS_FILE) as f:
            return json.load(f)
    return None


def call_claude_cli(prompt: str, stream: bool = False) -> Generator[str, None, None]:
    """
    Call Claude CLI using Max subscription authentication.
    """
    env = os.environ.copy()

    # Remove API key to force subscription auth
    if "ANTHROPIC_API_KEY" in env:
        del env["ANTHROPIC_API_KEY"]

    env["CLAUDE_USE_SUBSCRIPTION"] = "true"

    try:
        if stream:
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
    """Health check endpoint with RAG status"""
    creds = load_credentials()

    # Get collection counts
    collection_counts = {}
    for key, coll in chroma_collections.items():
        try:
            collection_counts[key] = coll.count()
        except:
            collection_counts[key] = 0

    return jsonify({
        "status": "healthy",
        "service": "claude-max-api",
        "version": "2.1.0-rag",
        "subscription_type": creds.get("claudeAiOauth", {}).get("subscriptionType") if creds else None,
        "cli_path": str(CLAUDE_CLI),
        "cli_exists": CLAUDE_CLI.exists(),
        "chromadb_available": CHROMADB_AVAILABLE,
        "chromadb_path": CHROMADB_PATH,
        "collections": collection_counts
    })


@app.route('/v1/models', methods=['GET'])
def list_models():
    """OpenAI-compatible models endpoint"""
    return jsonify({
        "object": "list",
        "data": [
            {
                "id": "sergio-rag",
                "object": "model",
                "created": int(datetime.now().timestamp()),
                "owned_by": "infrafabric",
                "permission": [],
                "root": "sergio-rag",
                "parent": None
            },
            {
                "id": "claude-max",
                "object": "model",
                "created": int(datetime.now().timestamp()),
                "owned_by": "anthropic"
            }
        ]
    })


@app.route('/v1/chat/completions', methods=['POST'])
def chat_completions():
    """OpenAI-compatible chat completions with Sergio personality + RAG"""
    data = request.json
    messages = data.get('messages', [])
    stream = data.get('stream', False)
    model = data.get('model', 'sergio-rag')

    # Get the latest user message for RAG retrieval
    user_message = ""
    for msg in reversed(messages):
        if msg.get('role') == 'user':
            user_message = msg.get('content', '')
            break

    # Retrieve personality DNA context from ChromaDB
    personality_context = retrieve_context(user_message) if user_message else ""

    # Build system prompt with RAG context
    system_prompt = SERGIO_SYSTEM_PROMPT.format(
        personality_context=personality_context if personality_context else "No additional context retrieved."
    )

    # Build prompt
    prompt_parts = [f"System: {system_prompt}"]

    for msg in messages:
        role = msg.get('role', 'user')
        content = msg.get('content', '')
        if role == 'system':
            prompt_parts.append(f"System: {content}")
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

    # Show RAG status
    rag_status = "ENABLED" if chroma_collections else "DISABLED"
    total_docs = sum(c.count() for c in chroma_collections.values()) if chroma_collections else 0

    print(f"""
╔═══════════════════════════════════════════════════════════════╗
║  Claude Max API Server v2.1 (with RAG)                        ║
║  Backend for if.emotion with Sergio Personality DNA           ║
╠═══════════════════════════════════════════════════════════════╣
║  Endpoint: http://{args.host}:{args.port}/v1/chat/completions          ║
║  Health:   http://{args.host}:{args.port}/health                       ║
║  Models:   http://{args.host}:{args.port}/v1/models                    ║
╠═══════════════════════════════════════════════════════════════╣
║  RAG Status: {rag_status:8}                                        ║
║  Total Docs: {total_docs:3} documents across 4 collections            ║
╚═══════════════════════════════════════════════════════════════╝
    """)

    app.run(host=args.host, port=args.port, debug=True, threaded=True)
