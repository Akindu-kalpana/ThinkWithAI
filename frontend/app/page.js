"use client";

import { useState } from "react";
import axios from "axios";
import { Send, ChevronRight } from "lucide-react";

export default function Home() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState(null); // LEARN or SOLVE
  const [overview, setOverview] = useState(null);
  const [showOverview, setShowOverview] = useState(false);
  const [concepts, setConcepts] = useState([]);
  const [currentConceptIndex, setCurrentConceptIndex] = useState(0);
  const [stage, setStage] = useState("theory"); // "theory" or "code"
  const [userAnswer, setUserAnswer] = useState("");
  const [userCode, setUserCode] = useState("");
  const [answerFeedback, setAnswerFeedback] = useState(null);
  const [codeFeedback, setCodeFeedback] = useState(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [codeSubmitted, setCodeSubmitted] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [userQuestion, setUserQuestion] = useState("");

  const handleDetectMode = async (q) => {
    try {
      const response = await axios.post("/api/detect-mode", {
        question: q,
      });
      return response.data.mode;
    } catch (error) {
      return "LEARN";
    }
  };

  const handleGenerateOverview = async (detectedMode, q) => {
    try {
      const response = await axios.post("/api/generate-overview", {
        topic: q,
        mode: detectedMode,
      });
      return response.data.overview;
    } catch (error) {
      return null;
    }
  };

  const handleGenerateConcepts = async (q) => {
    try {
      const response = await axios.post("/api/generate-problem-steps", {
        question: q,
        mode: "LEARN",
      });
      return response.data.data;
    } catch (error) {
      alert("Failed to generate concepts");
      return [];
    }
  };

  const handleValidateAnswer = async (recallQuestion, answer, conceptTitle) => {
    try {
      const response = await axios.post("/api/validate-step", {
        stepTitle: conceptTitle,
        instruction: recallQuestion,
        userAttempt: answer,
        mode: "LEARN",
      });
      return response.data;
    } catch (error) {
      return null;
    }
  };

  const handleValidateCode = async (taskDescription, code, conceptTitle) => {
    try {
      const response = await axios.post("/api/validate-step", {
        stepTitle: conceptTitle,
        instruction: taskDescription,
        userAttempt: code,
        mode: "SOLVE",
      });
      return response.data;
    } catch (error) {
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setUserQuestion(question);

    try {
      const detectedMode = await handleDetectMode(question);
      setMode(detectedMode);

      const generatedOverview = await handleGenerateOverview(detectedMode, question);
      setOverview(generatedOverview);
      setShowOverview(true);

      setConcepts([]);
      setCurrentConceptIndex(0);
      setStage("theory");
      setUserAnswer("");
      setUserCode("");
      setAnswerFeedback(null);
      setCodeFeedback(null);
      setAnswerSubmitted(false);
      setCodeSubmitted(false);
      setSessionComplete(false);
      setQuestion("");
    } catch (error) {
      alert("Failed to process question");
    } finally {
      setLoading(false);
    }
  };

  const handleStartLearning = async () => {
    setLoading(true);
    try {
      const generatedConcepts = await handleGenerateConcepts(userQuestion);
      setConcepts(generatedConcepts);
      setShowOverview(false);
      setCurrentConceptIndex(0);
      setStage("theory");
      setUserAnswer("");
      setUserCode("");
      setAnswerFeedback(null);
      setCodeFeedback(null);
      setAnswerSubmitted(false);
      setCodeSubmitted(false);
    } catch (error) {
      alert("Failed to generate learning path");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) {
      alert("Please share your thoughts");
      return;
    }

    setLoading(true);

    try {
      const currentConcept = concepts[currentConceptIndex];
      const validation = await handleValidateAnswer(
        currentConcept.recallQuestion,
        userAnswer,
        currentConcept.name
      );

      if (validation) {
        setAnswerFeedback(validation);
      }
      setAnswerSubmitted(true);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!userCode.trim()) {
      alert("Please write some code");
      return;
    }

    setLoading(true);

    try {
      const currentConcept = concepts[currentConceptIndex];
      const validation = await handleValidateCode(
        currentConcept.exercise || "Write code for this task",
        userCode,
        currentConcept.name
      );

      if (validation) {
        setCodeFeedback(validation);
      }
      setCodeSubmitted(true);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNextConcept = () => {
    if (currentConceptIndex < concepts.length - 1) {
      setCurrentConceptIndex(currentConceptIndex + 1);
      setStage("theory");
      setUserAnswer("");
      setUserCode("");
      setAnswerFeedback(null);
      setCodeFeedback(null);
      setAnswerSubmitted(false);
      setCodeSubmitted(false);
    } else {
      setSessionComplete(true);
    }
  };

  const handleNewQuestion = () => {
    setQuestion("");
    setMode(null);
    setOverview(null);
    setShowOverview(false);
    setConcepts([]);
    setCurrentConceptIndex(0);
    setStage("theory");
    setUserAnswer("");
    setUserCode("");
    setAnswerFeedback(null);
    setCodeFeedback(null);
    setAnswerSubmitted(false);
    setCodeSubmitted(false);
    setSessionComplete(false);
    setUserQuestion("");
  };

  return (
    <>
      {!mode ? (
        // Welcome Screen
        <div className="welcome-screen">
          <div className="welcome-content">
            <h1 className="welcome-title">ThinkWithAI</h1>
            <p className="welcome-subtitle">Learn by thinking and building</p>
          </div>
          <div className="search-container" style={{ position: "static", transform: "none", marginTop: "-7.5rem" }}>
            <form onSubmit={handleSubmit} className="search-form">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What do you want to learn? (e.g., Teach me JavaScript)"
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
      ) : showOverview && overview ? (
        // Overview Screen
        <div className="response-screen">
          <div className="response-content">
            <div className="response-body">
              <div style={{ paddingTop: "2rem" }}>
                <h2 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1.5rem" }}>
                  📖 Here's What You're About to Learn
                </h2>

                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <div style={{
                    backgroundColor: "#242424",
                    border: "1px solid #333",
                    borderRadius: "0.5rem",
                    padding: "1.5rem",
                  }}>
                    <h3 style={{ color: "#60a5fa", fontWeight: "600", marginBottom: "0.75rem" }}>
                      ❓ What Is {userQuestion}?
                    </h3>
                    <p style={{ color: "#ccc", lineHeight: "1.6" }}>
                      {overview.whatItIs || overview.whatYouWillDo}
                    </p>
                  </div>

                  <div style={{
                    backgroundColor: "#242424",
                    border: "1px solid #333",
                    borderRadius: "0.5rem",
                    padding: "1.5rem",
                  }}>
                    <h3 style={{ color: "#4ade80", fontWeight: "600", marginBottom: "0.75rem" }}>
                      💡 Why It Matters
                    </h3>
                    <p style={{ color: "#ccc", lineHeight: "1.6" }}>
                      {overview.whyItMatters || overview.whyThisApproach}
                    </p>
                  </div>

                  <div style={{
                    backgroundColor: "#242424",
                    border: "1px solid #333",
                    borderRadius: "0.5rem",
                    padding: "1.5rem",
                  }}>
                    <h3 style={{ color: "#fbbf24", fontWeight: "600", marginBottom: "0.75rem" }}>
                      🎯 What You'll Learn
                    </h3>
                    <p style={{ color: "#ccc", lineHeight: "1.6" }}>
                      {overview.whatYouWillLearn || overview.whatToExpect}
                    </p>
                  </div>

                  <div style={{
                    backgroundColor: "#1a3a2a",
                    border: "2px solid #4ade80",
                    borderRadius: "0.5rem",
                    padding: "1.5rem",
                    textAlign: "center",
                  }}>
                    <p style={{ color: "#4ade80", fontStyle: "italic", fontSize: "1.125rem" }}>
                      🌟 {overview.encouragement}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleStartLearning}
                  disabled={loading}
                  className="button button-purple"
                  style={{
                    fontSize: "1.125rem",
                    padding: "1rem 2rem",
                    marginTop: "2rem",
                    marginBottom: "8rem",
                    width: "100%",
                  }}
                >
                  {loading ? "Preparing..." : "Ready? Let's Start Learning! →"}
                </button>
              </div>
            </div>
          </div>

          <div className="search-container">
            <form onSubmit={handleSubmit} className="search-form">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Learn something else..."
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
      ) : sessionComplete ? (
        // Completion Screen
        <div className="response-screen">
          <div className="response-content">
            <div className="response-body">
              <div style={{ textAlign: "center", paddingTop: "2rem" }}>
                <h2 style={{ fontSize: "2.5rem", fontWeight: "bold", marginBottom: "1rem" }}>
                  🎉 Amazing Work!
                </h2>
                <p style={{ color: "#aaa", marginBottom: "0.5rem", fontSize: "1.25rem" }}>
                  You completed:
                </p>
                <p style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "2rem", color: "#60a5fa" }}>
                  {userQuestion}
                </p>

                <div style={{
                  backgroundColor: "#1a3a2a",
                  border: "2px solid #4ade80",
                  borderRadius: "0.5rem",
                  padding: "1.5rem",
                  marginBottom: "2rem",
                  textAlign: "left",
                }}>
                  <p style={{ color: "#4ade80", fontWeight: "600", marginBottom: "1rem" }}>
                    ✅ What You Learned:
                  </p>
                  <ul style={{ color: "#7ee8ba", fontSize: "0.875rem", lineHeight: "1.8", listStyle: "none" }}>
                    {concepts.map((concept, idx) => (
                      <li key={idx} style={{ marginBottom: "0.5rem" }}>
                        ✓ {concept.name}
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{
                  backgroundColor: "#1a2a3a",
                  border: "2px solid #60a5fa",
                  borderRadius: "0.5rem",
                  padding: "1.5rem",
                  marginBottom: "2rem",
                  textAlign: "left",
                }}>
                  <p style={{ color: "#60a5fa", fontWeight: "600", marginBottom: "0.5rem" }}>
                    💭 Remember:
                  </p>
                  <p style={{ color: "#ddd", fontSize: "0.875rem", lineHeight: "1.6" }}>
                    You're not just memorizing steps. You're learning the concepts. Once you understand the WHY, you can adapt this to YOUR way. Keep building! 💪
                  </p>
                </div>

                <button
                  onClick={handleNewQuestion}
                  className="button button-purple"
                  style={{
                    fontSize: "1.125rem",
                    padding: "1rem 2rem",
                    marginBottom: "8rem",
                  }}
                >
                  ← Learn Something New
                </button>
              </div>
            </div>
          </div>

          <div className="search-container">
            <form onSubmit={handleSubmit} className="search-form">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Learn something else..."
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
      ) : concepts.length > 0 && stage === "theory" ? (
        // Theory Stage - Answer Recall Question
        <div className="response-screen">
          <div className="response-content">
            <div className="response-body">
              <div style={{ paddingTop: "2rem" }}>
                <p style={{ color: "#888", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                  Concept {currentConceptIndex + 1} of {concepts.length}
                </p>
                <div style={{ width: "100%", backgroundColor: "#242424", borderRadius: "0.25rem", height: "0.5rem", overflow: "hidden", marginBottom: "1.5rem" }}>
                  <div
                    style={{
                      backgroundColor: "#3b82f6",
                      height: "100%",
                      width: `${((currentConceptIndex + 1) / concepts.length) * 100}%`,
                      transition: "width 0.3s",
                    }}
                  ></div>
                </div>

                {/* Concept Title */}
                <h2 style={{ fontSize: "1.75rem", fontWeight: "bold", marginBottom: "1.5rem", color: "#fff" }}>
                  📚 {concepts[currentConceptIndex]?.name}
                </h2>

                {/* Concept Explanation */}
                <div style={{
                  backgroundColor: "#1a2a3a",
                  border: "1px solid #333",
                  borderRadius: "0.5rem",
                  padding: "1.5rem",
                  marginBottom: "1.5rem",
                }}>
                  <p style={{ color: "#ccc", lineHeight: "1.8", fontSize: "0.95rem" }}>
                    {concepts[currentConceptIndex]?.explanation}
                  </p>
                </div>

                {/* Why It Matters */}
                <div style={{
                  backgroundColor: "#1a3a1a",
                  border: "1px solid #2d5a2d",
                  borderRadius: "0.5rem",
                  padding: "1.5rem",
                  marginBottom: "1.5rem",
                }}>
                  <h3 style={{ color: "#4ade80", fontWeight: "600", marginBottom: "0.75rem" }}>
                    💡 Why This Matters:
                  </h3>
                  <p style={{ color: "#7ee8ba", lineHeight: "1.6", fontSize: "0.95rem" }}>
                    {concepts[currentConceptIndex]?.why}
                  </p>
                </div>

                {/* Recall Question */}
                <h3 style={{ color: "#fff", fontWeight: "600", marginBottom: "1rem", fontSize: "1rem" }}>
                  ❓ Check Your Understanding:
                </h3>

                <div style={{
                  backgroundColor: "#1a2a3a",
                  border: "2px solid #60a5fa",
                  borderRadius: "0.5rem",
                  padding: "1rem",
                  marginBottom: "1rem",
                }}>
                  <p style={{ color: "#60a5fa", fontSize: "0.95rem", lineHeight: "1.6", fontStyle: "italic" }}>
                    {concepts[currentConceptIndex]?.recallQuestion}
                  </p>
                </div>

                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Your answer..."
                  rows="3"
                  className="reflection-textarea"
                  style={{ marginBottom: "1rem" }}
                />

                {/* Answer Feedback */}
                {answerFeedback && (
                  <div style={{
                    backgroundColor: "#1a3a2a",
                    border: "1px solid #4ade80",
                    borderRadius: "0.5rem",
                    padding: "1rem",
                    marginBottom: "1rem",
                    color: "#7ee8ba",
                    fontSize: "0.875rem",
                    whiteSpace: "pre-wrap",
                    lineHeight: "1.6",
                  }}>
                    {answerFeedback.feedback}
                  </div>
                )}

                {!answerSubmitted ? (
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={loading}
                    className="button button-success"
                    style={{ width: "100%", marginBottom: "8rem" }}
                  >
                    {loading ? "Checking..." : "Submit"}
                  </button>
                ) : (
                  <button
                    onClick={() => setStage("code")}
                    className="button button-purple"
                    style={{ width: "100%", marginBottom: "8rem" }}
                  >
                    Now Let's Code! →
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="search-container">
            <form onSubmit={handleSubmit} className="search-form">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Learn something else..."
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
      ) : concepts.length > 0 && stage === "code" ? (
        // Code Stage - Split Screen
        <div className="response-screen">
          <div style={{ display: "flex", height: "calc(100vh - 120px)", gap: "2px", backgroundColor: "#000" }}>
            {/* Left: Instructions */}
            <div style={{
              flex: 1,
              overflowY: "auto",
              padding: "2rem",
              backgroundColor: "#1a1a1a",
              borderRight: "1px solid #333",
            }}>
              <div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem", color: "#fff" }}>
                  ✍️ Now Let's Code
                </h2>

                <h3 style={{ color: "#60a5fa", fontWeight: "600", marginBottom: "0.75rem", fontSize: "1rem" }}>
                  {concepts[currentConceptIndex]?.exercise || "Let's practice coding"}
                </h3>

                <p style={{ color: "#aaa", lineHeight: "1.6", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
                  {concepts[currentConceptIndex]?.explanation}
                </p>

                <div style={{
                  backgroundColor: "#0f0f0f",
                  border: "1px solid #333",
                  borderRadius: "0.5rem",
                  padding: "1rem",
                  marginBottom: "1.5rem",
                }}>
                  <p style={{ color: "#888", fontSize: "0.75rem", marginBottom: "0.75rem", fontWeight: "600" }}>
                    💡 Tips:
                  </p>
                  <ul style={{ color: "#aaa", fontSize: "0.875rem", listStyle: "none" }}>
                    <li>• Start simple and build up</li>
                    <li>• Test as you go</li>
                    <li>• Don't worry about perfect code</li>
                    <li>• Focus on the logic</li>
                  </ul>
                </div>

                {/* Code Feedback */}
                {codeFeedback && (
                  <div style={{
                    backgroundColor: codeSubmitted ? "#1a3a2a" : "#2a2a1a",
                    border: codeSubmitted ? "1px solid #4ade80" : "1px solid #8b7500",
                    borderRadius: "0.5rem",
                    padding: "1rem",
                    color: codeSubmitted ? "#7ee8ba" : "#fbbf24",
                    fontSize: "0.875rem",
                    whiteSpace: "pre-wrap",
                    lineHeight: "1.6",
                  }}>
                    {codeFeedback.feedback}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Code Editor */}
            <div style={{
              flex: 1,
              overflowY: "auto",
              padding: "2rem",
              backgroundColor: "#0f0f0f",
              display: "flex",
              flexDirection: "column",
            }}>
              <p style={{ color: "#888", fontSize: "0.75rem", marginBottom: "0.5rem" }}>
                Write your code:
              </p>

              <textarea
                value={userCode}
                onChange={(e) => setUserCode(e.target.value)}
                placeholder="// Write your code here..."
                style={{
                  flex: 1,
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #333",
                  borderRadius: "0.5rem",
                  padding: "1rem",
                  color: "#4ade80",
                  fontFamily: "'Monaco', 'Courier New', monospace",
                  fontSize: "0.875rem",
                  lineHeight: "1.5",
                  resize: "none",
                  marginBottom: "1rem",
                  outline: "none",
                }}
              />

              <button
                onClick={handleSubmitCode}
                disabled={loading}
                className="button button-success"
                style={{ marginBottom: "0.5rem" }}
              >
                {loading ? "Checking..." : "Run Code"}
              </button>

              {codeSubmitted && (
                <button
                  onClick={handleNextConcept}
                  className="button button-success"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    backgroundColor: "#16a34a",
                  }}
                >
                  {currentConceptIndex < concepts.length - 1
                    ? "Next Concept"
                    : "Complete Learning"}
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}