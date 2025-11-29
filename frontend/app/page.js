"use client";

import { useState } from "react";
import axios from "axios";
import { Send, ChevronRight, Lightbulb } from "lucide-react";

export default function Home() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState(null); // LEARN or SOLVE
  const [overview, setOverview] = useState(null); // Overview content
  const [showOverview, setShowOverview] = useState(false); // Show overview screen
  const [steps, setSteps] = useState([]); // or concepts
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [userAttempts, setUserAttempts] = useState({});
  const [validations, setValidations] = useState({});
  const [showConceptualGuide, setShowConceptualGuide] = useState({});
  const [sessionComplete, setSessionComplete] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [userQuestion, setUserQuestion] = useState("");

  const handleDetectMode = async (q) => {
    try {
      const response = await axios.post("/api/detect-mode", {
        question: q,
      });
      return response.data.mode;
    } catch (error) {
      console.error("Error:", error);
      return "SOLVE";
    }
  };

  const handleGenerateSteps = async (detectedMode, q) => {
    try {
      const response = await axios.post("/api/generate-problem-steps", {
        question: q,
        mode: detectedMode,
      });
      return response.data.data;
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to generate steps");
      return [];
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
      console.error("Error:", error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setUserQuestion(question);

    try {
      // Step 1: Detect mode
      const detectedMode = await handleDetectMode(question);
      setMode(detectedMode);

      // Step 2: Generate overview
      const generatedOverview = await handleGenerateOverview(detectedMode, question);
      setOverview(generatedOverview);
      setShowOverview(true);

      // Reset other states
      setSteps([]);
      setCurrentStepIndex(0);
      setUserAttempts({});
      setValidations({});
      setShowConceptualGuide({});
      setSessionComplete(false);
      setSuggestions([]);
      setQuestion("");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to process question");
    } finally {
      setLoading(false);
    }
  };

  const handleStartLearning = async () => {
    setLoading(true);
    try {
      // Generate steps/concepts
      const generatedSteps = await handleGenerateSteps(mode, userQuestion);
      setSteps(generatedSteps);
      setShowOverview(false); // Hide overview, show concepts
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to generate learning path");
    } finally {
      setLoading(false);
    }
  };

  const handleStepSubmit = async (e) => {
    e.preventDefault();
    if (!steps || steps.length === 0) return;
    
    const currentStep = steps[currentStepIndex];
    if (!currentStep) return;
    
    const userAttempt = userAttempts[currentStepIndex];

    if (!userAttempt || userAttempt.trim() === "") {
      alert("Please provide an answer");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post("/api/validate-step", {
        stepTitle: currentStep.title || "",
        instruction: mode === "SOLVE" 
          ? (currentStep.instruction || "") 
          : (currentStep.recallQuestion || ""),
        userAttempt: userAttempt,
        mode: mode,
      });

      setValidations({
        ...validations,
        [currentStepIndex]: response.data,
      });
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to validate");
    } finally {
      setLoading(false);
    }
  };

  const handleShowConceptualGuide = async () => {
    const currentStep = steps[currentStepIndex];
    if (!currentStep) return;

    if (showConceptualGuide[currentStepIndex]) {
      setShowConceptualGuide({
        ...showConceptualGuide,
        [currentStepIndex]: null,
      });
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post("/api/generate-conceptual-guide", {
        stepOrConcept: currentStep.title || "",
        explanation: mode === "SOLVE" 
          ? (currentStep.why || "") 
          : (currentStep.explanation || ""),
        mode: mode,
      });

      setShowConceptualGuide({
        ...showConceptualGuide,
        [currentStepIndex]: response.data.guide,
      });
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = async () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      // Session complete - get expansion suggestions
      setLoading(true);
      try {
        const response = await axios.post("/api/suggest-expansion", {
          topic: userQuestion,
          mode: mode,
        });
        setSuggestions(response.data.suggestions);
        setSessionComplete(true);
      } catch (error) {
        console.error("Error:", error);
        setSessionComplete(true);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleNewQuestion = () => {
    setQuestion("");
    setMode(null);
    setSteps([]);
    setCurrentStepIndex(0);
    setUserAttempts({});
    setValidations({});
    setShowConceptualGuide({});
    setSessionComplete(false);
    setSuggestions([]);
    setUserQuestion("");
  };

  return (
    <>
      {!mode ? (
        // Welcome Screen
        <div className="welcome-screen">
          <div className="welcome-content">
            <h1 className="welcome-title">ThinkWithAI</h1>
            <p className="welcome-subtitle">Learn by thinking, not copying</p>
          </div>
          <div className="search-container" style={{ position: "static", transform: "none", marginTop: "-7.5rem" }}>
            <form onSubmit={handleSubmit} className="search-form">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask me to teach or help solve something..."
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
                  {/* What it is */}
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

                  {/* Why it matters */}
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

                  {/* What you'll learn */}
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

                  {/* Encouragement */}
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

                {/* Start Button */}
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
                  {loading ? "Preparing learning path..." : "Ready? Let's Start Learning! →"}
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Search Bar */}
          <div className="search-container">
            <form onSubmit={handleSubmit} className="search-form">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask me something else..."
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
                <h2 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }}>
                  🎉 Great Job!
                </h2>
                <p style={{ color: "#aaa", marginBottom: "0.5rem", fontSize: "1.125rem" }}>
                  You just {mode === "LEARN" ? "learned" : "solved"}:
                </p>
                <p style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "2rem", color: "#ddd" }}>
                  {userQuestion}
                </p>

                {/* Remember this note */}
                <div style={{
                  backgroundColor: "#1a3a2a",
                  border: "1px solid #2d5a3d",
                  borderRadius: "0.5rem",
                  padding: "1.5rem",
                  marginBottom: "2rem",
                  textAlign: "left",
                }}>
                  <p style={{ color: "#4ade80", fontWeight: "600", marginBottom: "0.5rem" }}>
                    💭 Keep in Mind:
                  </p>
                  <p style={{ color: "#7ee8ba", fontSize: "0.875rem", lineHeight: "1.6" }}>
                    You're not just memorizing steps. You're learning the concept. Once you understand the WHY, 
                    you can adapt this to YOUR way. Different people solve problems differently - this is one solid approach. 
                    Trust your thinking!
                  </p>
                </div>

                {/* Expansion Suggestions */}
                {suggestions.length > 0 && (
                  <div style={{ marginBottom: "2rem", textAlign: "left" }}>
                    <h3 className="section-title">
                      {mode === "LEARN" ? "🚀 Build Your Confidence:" : "📚 Learn More:"}
                    </h3>
                    <p style={{ color: "#888", fontSize: "0.875rem", marginBottom: "1rem" }}>
                      {mode === "LEARN" 
                        ? "Ready for the next step? Start EASY to build confidence, then progress to harder challenges."
                        : "Related topics that will deepen your understanding. Start with EASY."}
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {suggestions.map((suggestion, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: "1rem",
                            backgroundColor: "#242424",
                            borderRadius: "0.5rem",
                            border: "1px solid #333",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.5rem" }}>
                            <p style={{ fontWeight: "600" }}>
                              {suggestion.name || suggestion.topic}
                            </p>
                            <span style={{
                              backgroundColor: suggestion.difficulty === "EASY" ? "#1a4d2e" : "#4d3a1a",
                              color: suggestion.difficulty === "EASY" ? "#4ade80" : "#fbbf24",
                              padding: "0.25rem 0.75rem",
                              borderRadius: "0.25rem",
                              fontSize: "0.75rem",
                              fontWeight: "600",
                            }}>
                              {suggestion.difficulty}
                            </span>
                          </div>
                          <p style={{ color: "#aaa", fontSize: "0.875rem" }}>
                            {suggestion.description || suggestion.why}
                          </p>
                          {suggestion.timeEstimate && (
                            <p style={{ color: "#666", fontSize: "0.75rem", marginTop: "0.5rem" }}>
                              ⏱️ {suggestion.timeEstimate}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleNewQuestion}
                  className="button button-purple"
                  style={{ fontSize: "1rem", padding: "0.75rem 2rem", marginBottom: "8rem" }}
                >
                  ← Learn Something New
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Search Bar */}
          <div className="search-container">
            <form onSubmit={handleSubmit} className="search-form">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask me something else..."
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
        // Step-by-Step Learning/Problem Solving
        <div className="response-screen">
          <div className="response-content">
            <div className="response-body">
              {steps && steps.length > 0 && (
                <>
                  {/* Progress Bar */}
                  <div style={{ marginBottom: "2rem" }}>
                    <p style={{ color: "#888", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                      {mode === "LEARN" ? "Concept" : "Step"} {currentStepIndex + 1} of {steps.length}
                    </p>
                    <div style={{ width: "100%", backgroundColor: "#242424", borderRadius: "0.25rem", height: "0.5rem", overflow: "hidden" }}>
                      <div
                        style={{
                          backgroundColor: "#3b82f6",
                          height: "100%",
                          width: `${((currentStepIndex + 1) / steps.length) * 100}%`,
                          transition: "width 0.3s",
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Current Step/Concept */}
                  <div style={{ marginBottom: "2rem" }}>
                    <h2 className="section-title">
                      {mode === "LEARN" ? "📚" : "📋"} {steps[currentStepIndex]?.title || ""}
                    </h2>
                    <p className="section-content" style={{ marginBottom: "1rem" }}>
                      {mode === "LEARN" 
                        ? steps[currentStepIndex]?.explanation 
                        : steps[currentStepIndex]?.instruction}
                    </p>

                    {/* Example/Why section */}
                    {mode === "SOLVE" && steps[currentStepIndex]?.example && (
                      <div style={{
                        backgroundColor: "#1a2a3a",
                        border: "1px solid #2d3d4d",
                        borderRadius: "0.5rem",
                        padding: "1rem",
                        marginBottom: "1rem",
                      }}>
                        <p style={{ color: "#60a5fa", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                          ✅ Example output:
                        </p>
                        <pre style={{
                          backgroundColor: "#0f0f0f",
                          padding: "0.75rem",
                          borderRadius: "0.375rem",
                          color: "#4ade80",
                          fontSize: "0.75rem",
                          overflow: "auto",
                        }}>
                          {steps[currentStepIndex]?.example}
                        </pre>
                      </div>
                    )}

                    {mode === "LEARN" && steps[currentStepIndex]?.why && (
                      <div style={{
                        backgroundColor: "#1a3a2a",
                        border: "1px solid #2d5a3d",
                        borderRadius: "0.5rem",
                        padding: "1rem",
                        marginBottom: "1rem",
                      }}>
                        <p style={{ color: "#4ade80", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                          💡 Why this matters:
                        </p>
                        <p style={{ color: "#7ee8ba", fontSize: "0.875rem" }}>
                          {steps[currentStepIndex]?.why}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Question/Exercise */}
                  <div style={{ marginBottom: "1.5rem" }}>
                    <h3 className="section-title">
                      {mode === "LEARN" ? "❓ Check Your Understanding:" : "✍️ Your Turn:"}
                    </h3>

                    {mode === "LEARN" && steps[currentStepIndex]?.recallQuestion && (
                      <div style={{
                        backgroundColor: "#1a2a3a",
                        border: "1px solid #60a5fa",
                        borderRadius: "0.5rem",
                        padding: "1rem",
                        marginBottom: "1rem",
                      }}>
                        <p style={{ color: "#60a5fa", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                          Question:
                        </p>
                        <p style={{ color: "#ddd", fontSize: "1rem", lineHeight: "1.6" }}>
                          {steps[currentStepIndex].recallQuestion}
                        </p>
                      </div>
                    )}

                    <form onSubmit={handleStepSubmit}>
                      <textarea
                        value={userAttempts[currentStepIndex] || ""}
                        onChange={(e) =>
                          setUserAttempts({
                            ...userAttempts,
                            [currentStepIndex]: e.target.value,
                          })
                        }
                        placeholder={mode === "LEARN" ? "Type your answer here..." : "Describe what you'll do..."}
                        rows={mode === "LEARN" ? "3" : "4"}
                        className="reflection-textarea"
                      />
                      <button
                        type="submit"
                        disabled={loading}
                        className="button button-success"
                        style={{ marginBottom: "1rem" }}
                      >
                        {loading ? "Checking..." : "Submit"}
                      </button>
                    </form>

                    {/* Validation Feedback */}
                    {validations[currentStepIndex] && (
                      <div style={{ marginBottom: "1.5rem" }}>
                        <div className="feedback-box">
                          {validations[currentStepIndex].feedback}
                        </div>

                        {validations[currentStepIndex].suggestion && (
                          <div style={{
                            backgroundColor: "#1a2a3a",
                            border: "1px solid #2d3d4d",
                            borderRadius: "0.5rem",
                            padding: "1rem",
                            marginTop: "1rem",
                          }}>
                            <p style={{ color: "#60a5fa", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                              💭 Next:
                            </p>
                            <p style={{ color: "#ddd", fontSize: "0.875rem" }}>
                              {validations[currentStepIndex].suggestion}
                            </p>
                          </div>
                        )}

                        {validations[currentStepIndex].conceptNote && (
                          <div style={{
                            backgroundColor: "#1a3a2a",
                            border: "1px solid #2d5a3d",
                            borderRadius: "0.5rem",
                            padding: "1rem",
                            marginTop: "1rem",
                          }}>
                            <p style={{ color: "#4ade80", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                              🧠 Why this works:
                            </p>
                            <p style={{ color: "#7ee8ba", fontSize: "0.875rem" }}>
                              {validations[currentStepIndex].conceptNote}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Conceptual Guide Button */}
                  {validations[currentStepIndex] && (
                    <button
                      onClick={handleShowConceptualGuide}
                      className="button"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        marginBottom: "1rem",
                        backgroundColor: "#7c3aed",
                      }}
                    >
                      <Lightbulb size={16} />
                      {showConceptualGuide[currentStepIndex] ? "Hide" : "Show"} Deep Concept
                    </button>
                  )}

                  {/* Conceptual Guide Content */}
                  {showConceptualGuide[currentStepIndex] && (
                    <div style={{
                      backgroundColor: "#1a2a3a",
                      border: "2px solid #7c3aed",
                      borderRadius: "0.5rem",
                      padding: "1.5rem",
                      marginBottom: "1.5rem",
                    }}>
                      <h4 style={{ color: "#a78bfa", fontWeight: "600", marginBottom: "1rem" }}>
                        🎓 Deep Dive - Understand the Concept:
                      </h4>

                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {showConceptualGuide[currentStepIndex]?.coreIdea && (
                          <div>
                            <p style={{ color: "#a78bfa", fontSize: "0.875rem", fontWeight: "600" }}>Core Idea:</p>
                            <p style={{ color: "#ddd", fontSize: "0.875rem" }}>
                              {showConceptualGuide[currentStepIndex]?.coreIdea}
                            </p>
                          </div>
                        )}

                        {showConceptualGuide[currentStepIndex]?.whyItMatters && (
                          <div>
                            <p style={{ color: "#a78bfa", fontSize: "0.875rem", fontWeight: "600" }}>Why It Matters:</p>
                            <p style={{ color: "#ddd", fontSize: "0.875rem" }}>
                              {showConceptualGuide[currentStepIndex]?.whyItMatters}
                            </p>
                          </div>
                        )}

                        {showConceptualGuide[currentStepIndex]?.alternativeApproach && (
                          <div>
                            <p style={{ color: "#a78bfa", fontSize: "0.875rem", fontWeight: "600" }}>Alternative Way:</p>
                            <p style={{ color: "#ddd", fontSize: "0.875rem" }}>
                              {showConceptualGuide[currentStepIndex]?.alternativeApproach}
                            </p>
                          </div>
                        )}

                        {showConceptualGuide[currentStepIndex]?.keyTakeaway && (
                          <div>
                            <p style={{ color: "#a78bfa", fontSize: "0.875rem", fontWeight: "600" }}>Key Takeaway:</p>
                            <p style={{ color: "#ddd", fontSize: "0.875rem" }}>
                              {showConceptualGuide[currentStepIndex]?.keyTakeaway}
                            </p>
                          </div>
                        )}

                        {showConceptualGuide[currentStepIndex]?.thinkAboutThis && (
                          <div style={{
                            backgroundColor: "#2a1a3a",
                            padding: "0.75rem",
                            borderRadius: "0.375rem",
                            borderLeft: "3px solid #a78bfa",
                          }}>
                            <p style={{ color: "#a78bfa", fontSize: "0.875rem", fontWeight: "600" }}>💭 Think About:</p>
                            <p style={{ color: "#ddd", fontSize: "0.875rem", fontStyle: "italic" }}>
                              {showConceptualGuide[currentStepIndex]?.thinkAboutThis}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Next Button */}
                  {validations[currentStepIndex] && (
                    <button
                      onClick={handleNextStep}
                      className="button button-success"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        marginBottom: "8rem",
                      }}
                    >
                      {currentStepIndex < steps.length - 1
                        ? `Next ${mode === "LEARN" ? "Concept" : "Step"}`
                        : "Complete"}
                      <ChevronRight size={16} />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Bottom Search Bar */}
          <div className="search-container">
            <form onSubmit={handleSubmit} className="search-form">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask me something else..."
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
            <button
              onClick={handleNewQuestion}
              className="new-question-btn"
            >
              ← New Topic
            </button>
          </div>
        </div>
      )}
    </>
  );
}