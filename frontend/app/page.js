"use client";

import { useState } from "react";
import axios from "axios";
import { Send } from "lucide-react";

export default function Home() {
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reflections, setReflections] = useState({});
  const [feedback, setFeedback] = useState({});
  const [learningSummary, setLearningSummary] = useState(null);
  const [showChallenge, setShowChallenge] = useState(false);
  const [userAttempt, setUserAttempt] = useState("");
  const [challengeFeedback, setChallengeFeedback] = useState(null);

  const handleDetectDomain = async (q) => {
    try {
      const response = await axios.post("/api/detect-domain", {
        question: q,
      });
      return response.data.domain;
    } catch (error) {
      console.error("Error:", error);
      return "problem-solving";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);

    try {
      const domain = await handleDetectDomain(question);
      const response = await axios.post("/api/generate-solution", {
        question: question,
        domain: domain,
      });

      setConversation({
        question: question,
        domain: domain,
        solution: response.data.solution,
      });
      setReflections({});
      setFeedback({});
      setLearningSummary(null);
      setShowChallenge(false);
      setUserAttempt("");
      setChallengeFeedback(null);
      setQuestion("");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to generate solution");
    } finally {
      setLoading(false);
    }
  };

  const handleReflectionSubmit = async (promptIndex) => {
    const userAnswer = reflections[promptIndex];

    if (!userAnswer || userAnswer.trim() === "") {
      alert("Please provide an answer");
      return;
    }

    try {
      const response = await axios.post("/api/reflection-feedback", {
        solutionId: conversation.solution.id,
        prompt: conversation.solution.reflectionPrompts[promptIndex],
        userAnswer: userAnswer,
      });

      setFeedback({
        ...feedback,
        [promptIndex]: response.data.feedback,
      });
      setReflections({
        ...reflections,
        [promptIndex]: "",
      });
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to get feedback");
    }
  };

  const handleGenerateSummary = async () => {
    try {
      const reflectionAnswers = conversation.solution.reflectionPrompts.map(
        (_, idx) => reflections[idx] || "Not answered"
      );

      const response = await axios.post("/api/learning-summary", {
        problemId: conversation.solution.problemId,
        explanation: conversation.solution.explanation,
        reflectionAnswers: reflectionAnswers,
      });

      setLearningSummary(response.data.summary);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to generate summary");
    }
  };

  const handleSubmitChallenge = async () => {
    if (!userAttempt || userAttempt.trim() === "") {
      alert("Please write your attempt");
      return;
    }

    try {
      const response = await axios.post("/api/challenge-feedback", {
        solutionId: conversation.solution.id,
        originalCode: conversation.solution.code,
        userAttempt: userAttempt,
      });

      setChallengeFeedback(response.data.feedback);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to get challenge feedback");
    }
  };

  return (
    <>
      {!conversation ? (
        // Welcome Screen
        <div className="welcome-screen">
          <div className="welcome-content">
            <h1 className="welcome-title">ThinkWithAI</h1>
            <p className="welcome-subtitle">Learn actively with AI guidance</p>
          </div>
          {/* Search Bar in Welcome */}
          <div className="search-container" style={{ position: "static", transform: "none", marginTop: "-7.5rem" }}>
            <form onSubmit={handleSubmit} className="search-form">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask me anything..."
                className="search-input"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="search-button"
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        </div>
      ) : (
        // Response Screen
        <div className="response-screen">
          <div className="response-content">
            <div className="response-body">
              {/* Question */}
              <div style={{ marginBottom: "2rem" }}>
                <p style={{ color: "#888", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                  You asked:
                </p>
                <p style={{ fontSize: "1.5rem", fontWeight: "600" }}>
                  {conversation.question}
                </p>
              </div>

              {/* Solution */}
              {conversation.solution && (
                <>
                  {/* Code */}
                  <div>
                    <h3 className="section-title">💻 Code</h3>
                    <pre className="code-block">{conversation.solution.code}</pre>
                  </div>

                  {/* Explanation */}
                  <div>
                    <h3 className="section-title">📖 Explanation</h3>
                    <p className="section-content" style={{ whiteSpace: "pre-wrap" }}>
                      {conversation.solution.explanation}
                    </p>
                  </div>

                  {/* Assumptions */}
                  <div>
                    <h3 className="section-title">📋 Assumptions</h3>
                    <p className="section-content">{conversation.solution.assumptions}</p>
                  </div>

                  {/* Trade-offs */}
                  <div>
                    <h3 className="section-title">⚖️ Trade-offs</h3>
                    <p className="section-content">{conversation.solution.tradeOffs}</p>
                  </div>

                  {/* Reflections */}
                  <div style={{ borderTop: "1px solid #333", paddingTop: "1.5rem" }}>
                    <h3 className="section-title">📝 Reflection Prompts</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {conversation.solution.reflectionPrompts.map((prompt, idx) => (
                        <div key={idx} className="reflection-box">
                          <p style={{ fontSize: "0.875rem", marginBottom: "0.75rem" }}>
                            {idx + 1}. {prompt}
                          </p>
                          <textarea
                            value={reflections[idx] || ""}
                            onChange={(e) =>
                              setReflections({ ...reflections, [idx]: e.target.value })
                            }
                            placeholder="Your answer..."
                            rows="2"
                            className="reflection-textarea"
                          />
                          <button
                            onClick={() => handleReflectionSubmit(idx)}
                            className="button button-success"
                          >
                            Get Feedback
                          </button>
                          {feedback[idx] && (
                            <div className="feedback-box">💡 {feedback[idx]}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Learning Summary */}
                  <div style={{ borderTop: "1px solid #333", paddingTop: "1.5rem" }}>
                    <button
                      onClick={handleGenerateSummary}
                      className="button button-purple"
                    >
                      📊 Generate Learning Summary
                    </button>

                    {learningSummary && (
                      <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "#242424", borderRadius: "0.5rem", border: "1px solid #333" }}>
                        <h4 style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "1rem" }}>
                          📚 Your Learning Summary
                        </h4>

                        <div style={{ marginBottom: "1rem" }}>
                          <p style={{ fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                            Key Lessons:
                          </p>
                          <ul style={{ listStyle: "disc", marginLeft: "1.5rem" }}>
                            {learningSummary.keyLessons.map((lesson, idx) => (
                              <li key={idx} style={{ color: "#ccc", fontSize: "0.875rem" }}>
                                {lesson}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div style={{ marginBottom: "1rem" }}>
                          <p style={{ fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                            Concepts:
                          </p>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                            {learningSummary.conceptsLearned.map((concept, idx) => (
                              <span
                                key={idx}
                                style={{
                                  backgroundColor: "#1a3a52",
                                  color: "#60a5fa",
                                  padding: "0.25rem 0.5rem",
                                  borderRadius: "0.25rem",
                                  fontSize: "0.75rem",
                                }}
                              >
                                {concept}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div style={{ marginBottom: "1rem" }}>
                          <p style={{ fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                            Next Steps:
                          </p>
                          <p style={{ color: "#ccc", fontSize: "0.875rem" }}>
                            {learningSummary.nextSteps}
                          </p>
                        </div>

                        <div>
                          <p style={{ fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                            Progress:
                          </p>
                          <div style={{ width: "100%", backgroundColor: "#1a1a1a", borderRadius: "0.25rem", height: "0.5rem", overflow: "hidden" }}>
                            <div
                              style={{
                                backgroundColor: "#4ade80",
                                height: "100%",
                                width: `${learningSummary.progressScore}%`,
                                transition: "width 0.3s",
                              }}
                            ></div>
                          </div>
                          <p style={{ fontSize: "0.75rem", color: "#666", marginTop: "0.25rem" }}>
                            {learningSummary.progressScore}% Complete
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Challenge Mode */}
                  <div style={{ borderTop: "1px solid #333", paddingTop: "1.5rem", marginBottom: "10rem" }}>
                    <button
                      onClick={() => setShowChallenge(!showChallenge)}
                      className="button button-orange"
                    >
                      {showChallenge ? "❌ Hide Challenge" : "🎯 Try Challenge Mode"}
                    </button>

                    {showChallenge && (
                      <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "#242424", borderRadius: "0.5rem", border: "1px solid #333" }}>
                        <p style={{ color: "#ccc", fontSize: "0.875rem", marginBottom: "1rem" }}>
                          Try to solve this without looking at the solution above!
                        </p>
                        <textarea
                          value={userAttempt}
                          onChange={(e) => setUserAttempt(e.target.value)}
                          placeholder="Write your solution..."
                          rows="8"
                          className="reflection-textarea"
                          style={{ fontFamily: "'Monaco', 'Courier New', monospace" }}
                        />
                        <button
                          onClick={handleSubmitChallenge}
                          className="button button-orange"
                          style={{ width: "100%", marginTop: "0.5rem" }}
                        >
                          Submit & Get Feedback
                        </button>

                        {challengeFeedback && (
                          <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "#1a2a2a", borderRadius: "0.5rem", border: "1px solid #444" }}>
                            <p style={{ fontWeight: "600", marginBottom: "0.75rem" }}>
                              📊 Results: {challengeFeedback.successScore}%
                            </p>
                            <p style={{ color: "#4ade80", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                              ✅ Strengths: {challengeFeedback.strengths.join(", ")}
                            </p>
                            <p style={{ color: "#fbbf24", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                              💡 Improve: {challengeFeedback.improvements.join(", ")}
                            </p>
                            <p style={{ color: "#60a5fa", fontSize: "0.875rem" }}>
                              📝 Feedback: {challengeFeedback.encouragement}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search Bar - Fixed at Bottom (only when viewing response) */}
      {conversation && (
        <div className="search-container">
          <form onSubmit={handleSubmit} className="search-form">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask me anything..."
              className="search-input"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="search-button"
            >
              <Send size={20} />
            </button>
          </form>
          {conversation && (
            <button
              onClick={() => setConversation(null)}
              className="new-question-btn"
            >
              ← New Question
            </button>
          )}
        </div>
      )}
    </>
  );
}