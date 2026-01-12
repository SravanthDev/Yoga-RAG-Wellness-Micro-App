
const fs = require('fs');
const path = require('path');

const SAFETY_INDEX_FILE = path.join(__dirname, 'safety_index.json');
let safetyIndex = [];

// Layer 1: Keywords that are instant red flags
const RULES = {
    pregnancy: /pregnan|maternity|trimester|birth/i,
    surgery: /surgery|operation|post-op|incision/i,
    blood_pressure: /blood pressure|hypertension|high bp/i,
    glaucoma: /glaucoma|eye pressure/i,
    hernia: /hernia|rupture/i,
    medical_advice: /cure|diagnosis|prescription|treat/i
};

function loadSafetyIndex() {
    if (fs.existsSync(SAFETY_INDEX_FILE)) {
        const data = fs.readFileSync(SAFETY_INDEX_FILE, 'utf-8');
        safetyIndex = JSON.parse(data);
        console.log(`[Safety] Loaded ${safetyIndex.length} safety intents.`);
    } else {
        console.warn('[Safety] No safety index found.');
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

// Check function
function checkSafety(text, embedding) {
    const reasons = [];
    let isUnsafe = false;

    // Layer 1: Simple keyword check (fast and strict)
    for (const [category, regex] of Object.entries(RULES)) {
        if (regex.test(text)) {
            isUnsafe = true;
            reasons.push(`Matched safety rule: ${category}`);
        }
    }

    // Layer 2: Checking for "vibes" (semantic meaning) using vectors
    // If embedding is provided, compare with safetyIndex
    if (embedding && safetyIndex.length > 0) {
        for (const unsafeItem of safetyIndex) {
            const score = cosineSimilarity(embedding, unsafeItem.embedding);
            console.log(`[Safety] "${unsafeItem.text}" similarity: ${score.toFixed(3)}`);
            if (score > 0.75) { // Threshold increased to avoid false positives for generic queries
                isUnsafe = true;
                reasons.push(`Semantic match with unsafe intent: "${unsafeItem.text}" (Score: ${score.toFixed(2)})`);
                break; // One match is enough
            }
        }
    }

    return { isUnsafe, reasons };
}

module.exports = { loadSafetyIndex, checkSafety };
