# YogaSense

## Project Overview

This project is a small RAG-based yoga question–answering system focused on correctness and safety rather than answering every question confidently. While language models can generate yoga advice without context, such responses can be unreliable or unsafe in a wellness setting.

The system is intentionally designed to stay grounded in retrieved data and to respond cautiously when a query involves potential risk. In some cases, recognizing that a question cannot or should not be answered is treated as the correct outcome.

---

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: React (Vite), Lucide Icons
- **Database**: MongoDB (Mongoose), Local FAISS index (JSON)
- **AI/LLM**: OpenAI GPT-4o-mini
- **Embeddings**: Transformers.js (locally computed embeddings)
- **Styling**: Vanilla CSS (Custom properties / Variables)
- **Deployment**: Render (Backend), Vercel (Frontend)

---

## Setup Steps (Local)

### Prerequisites
- Node.js (v18 or above)
- MongoDB (Local instance or MongoDB Atlas)

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   npm install
   ```

2. Create a `.env` file in the `backend` folder and configure the following variables:
   ```env
   PORT=5001
   MONGO_URI=your_mongodb_connection_string
   OPENAI_API_KEY=your_openai_api_key
   ```

3. Build the vector index from the database:
   ```bash
   npm run build-index
   ```

4. Start the server:
   ```bash
   npm start
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

---

## RAG Pipeline (Design Explanation)

The RAG pipeline in YogaSense is designed for precision and constraint.

1. **Embedding and Retrieval**: When a query is submitted, it is converted into a vector embedding. The system then performs a similarity search against a FAISS vector database to retrieve the most relevant chunks from the yoga knowledge base.
2. **Contextual Constraints**: Only the retrieved chunks are passed to the language model. The model is explicitly instructed to rely solely on this context.
3. **Intentional "I Don't Know"**: If the retrieval step does not yield relevant high-confidence matches, the system is programmed to state that it does not know. This prevents hallucinations, which is critical in a wellness context.
4. **Focused Chunking**: Knowledge is split into small, specific chunks to ensure high retrieval accuracy and to avoid domesticating the model with unrelated information.

---

## Safety Logic (Why It Was Designed This Way)

Safety is implemented as a multi-stage hybrid system to ensure maximum reliability.

1. **Keyword-Based Filtering**: A fast, rule-based layer that identifies explicit risk signals (e.g., mentions of surgeries, acute injuries, or specific medical conditions).
2. **Semantic Safety Check**: A secondary layer that uses machine learning to compare the user's intent with a database of known unsafe scenarios. This catches implicit risks that keyword filters might miss.

This hybrid approach was chosen because it combines the predictability of rules with the flexibility of semantic understanding. When a query is flagged as unsafe:
- The system provides a conservative, high-level summary.
- The UI displays a clear safety notice.
- The user is advised to seek professional medical supervision.



---

## Data Models

### Knowledge Chunk
```json
{
  "id": "asana_shavasana_relaxation",
  "title": "Shavasana: The Foundation of Deep Relaxation",
  "category": "asana",
  "content": "Description of the pose and its physiological benefits..."
}
```

### Query Log
All interactions are logged to MongoDB for monitoring and debugging safety thresholds.
```json
{
  "query": "Is headstand safe for high blood pressure?",
  "retrievedSources": ["asana_inversions_intro"],
  "answer": "Answer including safety precautions...",
  "isUnsafe": true,
  "timestamp": "2026-01-12T10:15:00Z"
}
```



---

## Prompts Used During Development

AI tools were used during development mainly to **think through edge cases, implementation details, and trade-offs** while building the system. The goal was to move faster during execution and validate decisions.

Below is a list of prompts used during development.

---

### Dataset Bootstrapping

> I need content to start with, but I don’t want long articles or medical advice...
> Can you help me generate short yoga notes for poses, benefits, and breathing practices that I can later clean up and rewrite myself

---

### Safety Threshold

> I’m adding semantic similarity for safety checks, but I’m unsure where to draw the line.  
> What similarity score usually feels “close enough” to confidently flag something as risky without overdoing it..

---

### Hybrid Safety Reasoning

> Keyword checks work for obvious cases, but some risky intent feels indirect.  
> Can semantic similarity realistically complement keywords without making the safety system too noisy or over-sensitive?

---

### Semantic Safety Implementation

> I know I want to compare the user query against a small list of risk phrases, but I’m unsure about the cleanest way to do this.
> What’s a simple, maintainable way to compare a query embedding with risk embeddings in a Node.js backend??

---

### Performance Optimization

> I noticed embeddings were getting recomputed more than necessary during requests.  Why? and
> What’s a good way to reuse embeddings or cache them so this doesn’t become inefficient

---





#
