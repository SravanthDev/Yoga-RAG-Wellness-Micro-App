
import { useState } from 'react';
import { Send, AlertTriangle, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { askQuestion, sendFeedback } from './api';

function App() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [feedbackState, setFeedbackState] = useState(null); // 'up' | 'down' | null

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResult(null);
    setFeedbackState(null);

    try {
      const data = await askQuestion(query);
      setResult(data);
    } catch (error) {
      console.error(error);
      setResult({
        answer: "Sorry, I encountered an error connecting to the wellness server. Please try again.",
        isUnsafe: false,
        sources: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (type) => {
    if (!result?.queryId || feedbackState) return;
    try {
      await sendFeedback(result.queryId, type);
      setFeedbackState(type);
    } catch (e) {
      console.error("Feedback failed", e);
    }
  };

  return (
    <div className="app-container">
      <div className="glass-panel">
        <div className="header">
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
            <Sparkles color="#2F8F83" size={32} />
            <h1>Yoga RAG Wellness</h1>
          </div>
          <p>Ask anything about yoga practice, philosophy, and safety.</p>
        </div>

        <form onSubmit={handleAsk} className="input-group">
          <input
            type="text"
            className="query-input"
            placeholder="e.g. Is Headstand safe for beginners?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="ask-btn" disabled={loading || !query.trim()}>
            {loading ? <div className="loading-spinner" /> : <Send size={20} />}
          </button>
        </form>

        {result && (
          <div className="response-area">
            {result.isUnsafe && (
              <div className="unsafe-banner">
                <AlertTriangle size={24} />
                <div>
                  <strong>Safety Notice:</strong> This query relates to a medical or sensitive topic.
                  <br />
                  <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                    {result.unsafeReasons.join(', ')}
                  </span>
                </div>
              </div>
            )}

            <div className="answer-card">
              <ReactMarkdown>{result.answer}</ReactMarkdown>
            </div>

            {!result.isUnsafe && result.sources && result.sources.length > 0 && (
              <div className="sources-section">
                <div className="sources-title">Sources Used</div>
                {result.sources.map((s, i) => (
                  <span key={i} className="source-tag">{s}</span>
                ))}
              </div>
            )}

            <div className="feedback-section">
              <button
                className={`feedback-btn ${feedbackState === 'up' ? 'active' : ''}`}
                onClick={() => handleFeedback('up')}
                disabled={!!feedbackState}
              >
                <ThumbsUp size={16} /> Helpful
              </button>
              <button
                className={`feedback-btn ${feedbackState === 'down' ? 'active' : ''}`}
                onClick={() => handleFeedback('down')}
                disabled={!!feedbackState}
              >
                <ThumbsDown size={16} /> Not Helpful
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
