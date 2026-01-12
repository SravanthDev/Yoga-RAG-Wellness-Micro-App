
const fs = require('fs');
const path = require('path');

const INDEX_FILE = path.join(__dirname, '../faiss/index.json');
let index = [];

function loadIndex() {
    if (fs.existsSync(INDEX_FILE)) {
        const data = fs.readFileSync(INDEX_FILE, 'utf-8');
        index = JSON.parse(data);
        console.log(`[RAG] Loaded ${index.length} chunks from index.`);
    } else {
        console.error('[RAG] Index file not found. Please run build_index.js');
    }
}

function cosineSimilarity(vecA, vecB) {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dot += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function search(queryEmbedding, topK = 3) {
    if (index.length === 0) return [];

    const scores = index.map(chunk => ({
        ...chunk,
        score: cosineSimilarity(queryEmbedding, chunk.embedding)
    }));

    // Sort descending
    scores.sort((a, b) => b.score - a.score);

    return scores.slice(0, topK).map(item => ({
        id: item.id,
        text: item.text,
        source: item.source,
        score: item.score
    }));
}

module.exports = { loadIndex, search };
