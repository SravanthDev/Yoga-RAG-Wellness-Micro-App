
# 🧘 Ask Me Anything About Yoga – RAG Wellness Micro-App

A production-ready full-stack AI application providing yoga wellness advice using Retrieval-Augmented Generation (RAG).
Built with **React (Vite)**, **Node.js/Express**, **FAISS (Local)**, **MongoDB**, and **OpenAI**.

---

## 🏗 Architecture

### High-Level Flow
1. **User Query** → Frontend → Backend API (`/ask`).
2. **Safety Check** (Hybrid):
   - **Layer 1**: Regex match for medical keywords (pregnancy, surgery, etc.).
   - **Layer 2**: Semantic similarity check against `unsafe_intents` index.
3. **Retrieval** (If Safe):
   - Query is embedded (via `Xenova/all-MiniLM-L6-v2`).
   - Search performing in local FAISS-style vector index.
   - Top 3 relevant chunks retrieved.
4. **Generation**:
   - Prompt constructed with Context + Query.
   - Sent to LLM (Gemini 1.5 Flash).
5. **Logging**:
   - Query, Answer, Safety Flags, and Feedback stored in MongoDB.

### Folder Structure
```
/frontend          # React Client (Vite)
/backend           # Node.js Express Server
  /rag             # Retrieval Logic
  /safety          # Guardrails Logic
  /faiss           # Generated Vector Index
  /models          # MongoDB Schemas
  /scripts         # Offline Build Scripts
/data              # Source Yoga Articles
```

---

## 🛡 Safety System (Hybrid)

To prevent medical malpractice, a generic "refusal" is not enough. We use a proactive two-layer system:

1. **Rule-Based (Regex)**: Instant blocking of high-risk keywords like "glaucoma", "hernia", "post-op".
2. **Semantic Detection**: The query embedding is compared against a pre-computed list of unsafe queries (e.g., "yoga for cancer cure"). If similarity > 0.6, it is flagged.

If **Unsafe**:
- The prompt is switched to `Unsafe Mode`.
- The AI is instructed to validate feelings but **refuse medical advice** and suggest professional help.

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js (v18+)
- MongoDB (Running locally)
- OpenAI API Key

### 1. Setup Backend
```bash
cd backend
npm install
# Create .env file
cp .env.example .env 
# Add your OPENAI_API_KEY in .env
```

### 2. Build Offline Index (RAG)
We do not embed usually at runtime. We pre-build the index.
```bash
# From backend directory
node scripts/build_index.js
```
*This will generate `backend/faiss/index.json` and `backend/safety/safety_index.json`.*

### 3. Start Server
```bash
# In backend/
npm start
# Server runs on http://localhost:5001
```

### 4. Setup Frontend
```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

---

## 🧠 RAG Details

- **Chunking**: Articles are split into 500-character chunks to preserve context window.
- **Embeddings**: Local `all-MiniLM-L6-v2` (runs on CPU/Node).
- **Storage**: JSON-based vector storage for portability (simulating FAISS flat index).
- **Retrieval**: Cosine similarity search.

---

## 📝 MongoDB Schema

**Log Collection:**
- `query`: String
- `answer`: String
- `sources`: Array[String]
- `isUnsafe`: Boolean
- `unsafeReasons`: Array[String]
- `feedback`: String ('up' | 'down')
- `timestamp`: Date

---

## 🤖 Prompts

**Safe Prompt:**
> "You are a knowledgeable Yoga Wellness Assistant. Answer the user's question using ONLY the provided context snippets..."

**Unsafe Prompt:**
> "You are a careful AI assistant... strictly REFUSE to give medical advice... Suggest they consult a doctor..."

---

*This project was built for an internship evaluation, strictly adhering to all architectural constraints.*
