"use client";

import { useState } from "react";
import axios from "axios";

export default function Home() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("coding");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [reflections, setReflections] = useState({});
  const [submittingReflection, setSubmittingReflection] = useState(null);
  const [feedback, setFeedback] = useState({});
  const [learningSummary, setLearningSummary] = useState(null);
  const [showChallenge, setShowChallenge] = useState(false);
  const [userAttempt, setUserAttempt] = useState("");
  const [challengeFeedback, setChallengeFeedback] = useState(null);
  const [submittingChallenge, setSubmittingChallenge] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post("/api/generate-solution", {
        title,
        description,
        domain,
      });

      setResult(response.data.solution);
      setReflections({});
      setFeedback({});
      setLearningSummary(null);
      setShowChallenge(false);
      setUserAttempt("");
      setChallengeFeedback(null);
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

    setSubmittingReflection(promptIndex);

    try {
      const response = await axios.post("/api/reflection-feedback", {
        solutionId: result.id,
        prompt: result.reflectionPrompts[promptIndex],
        userAnswer: userAnswer,
      });

      setFeedback({ ...feedback, [promptIndex]: response.data.feedback });
      setReflections({ ...reflections, [promptIndex]: "" });
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to get feedback");
    } finally {
      setSubmittingReflection(null);
    }
  };

  const handleGenerateSummary = async () => {
    if (!result || !result.reflectionPrompts) {
      alert("Please complete some reflections first");
      return;
    }

    const reflectionAnswers = result.reflectionPrompts.map(
      (_, idx) => reflections[idx] || "Not answered"
    );

    try {
      const response = await axios.post("/api/learning-summary", {
        problemId: result.problemId,
        explanation: result.explanation,
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

    setSubmittingChallenge(true);

    try {
      const response = await axios.post("/api/challenge-feedback", {
        solutionId: result.id,
        originalCode: result.code,
        userAttempt: userAttempt,
      });

      setChallengeFeedback(response.data.feedback);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to get challenge feedback");
    } finally {
      setSubmittingChallenge(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8" style={{ color: "#000000" }}>
          ThinkWithAI - Learn Actively
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-lg p-8 mb-8"
        >
          <div className="mb-6">
            <label className="block font-semibold mb-2" style={{ color: "#000000" }}>
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Build a To-Do List App"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block font-semibold mb-2" style={{ color: "#000000" }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you want to learn or build..."
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block font-semibold mb-2" style={{ color: "#000000" }}>
              Domain
            </label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="coding">Coding</option>
              <option value="writing">Writing</option>
              <option value="research">Research</option>
              <option value="problem-solving">Problem Solving</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {loading ? "Generating..." : "Generate Solution"}
          </button>
        </form>

        {result && (
          <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
            <h2 className="text-2xl font-bold" style={{ color: "#000000" }}>
              Solution
            </h2>

            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: "#000000" }}>
                Code:
              </h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto text-sm">
                {result.code}
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: "#000000" }}>
                Explanation:
              </h3>
              <p className="text-gray-600 whitespace-pre-wrap">
                {result.explanation}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: "#000000" }}>
                Assumptions:
              </h3>
              <p className="text-gray-600">{result.assumptions}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: "#000000" }}>
                Trade-offs:
              </h3>
              <p className="text-gray-600">{result.tradeOffs}</p>
            </div>

            <div className="border-t pt-8">
              <h3 className="text-lg font-semibold mb-6" style={{ color: "#000000" }}>
                📝 Reflection Prompts
              </h3>
              <div className="space-y-6">
                {result.reflectionPrompts.map((prompt, idx) => (
                  <div key={idx} className="bg-blue-50 p-6 rounded-lg">
                    <p className="font-semibold mb-4" style={{ color: "#000000" }}>
                      {idx + 1}. {prompt}
                    </p>
                    <textarea
                      value={reflections[idx] || ""}
                      onChange={(e) =>
                        setReflections({
                          ...reflections,
                          [idx]: e.target.value,
                        })
                      }
                      placeholder="Your answer..."
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                    />
                    <button
                      onClick={() => handleReflectionSubmit(idx)}
                      disabled={submittingReflection === idx}
                      className="bg-green-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition"
                    >
                      {submittingReflection === idx
                        ? "Getting Feedback..."
                        : "Get Feedback"}
                    </button>
                    {feedback[idx] && (
                      <div className="mt-4 p-4 bg-green-100 border-l-4 border-green-600 rounded">
                        <p className="font-semibold" style={{ color: "#000000" }}>
                          💡 AI Feedback:
                        </p>
                        <p className="text-gray-700 mt-2">{feedback[idx]}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-8">
              <button
                onClick={handleGenerateSummary}
                className="w-full bg-purple-600 text-white font-semibold py-3 rounded-lg hover:bg-purple-700 transition mb-6"
              >
                📊 Generate Learning Summary
              </button>

              {learningSummary && (
                <div className="bg-purple-50 p-8 rounded-lg">
                  <h3 className="text-xl font-bold mb-6" style={{ color: "#000000" }}>
                    📚 Your Learning Summary
                  </h3>

                  <div className="mb-6">
                    <h4 className="font-semibold mb-3" style={{ color: "#000000" }}>
                      Key Lessons:
                    </h4>
                    <ul className="list-disc list-inside space-y-2">
                      {learningSummary.keyLessons.map((lesson, idx) => (
                        <li key={idx} className="text-gray-700">
                          {lesson}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold mb-3" style={{ color: "#000000" }}>
                      Concepts Learned:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {learningSummary.conceptsLearned.map((concept, idx) => (
                        <span
                          key={idx}
                          className="bg-blue-200 text-blue-900 px-3 py-1 rounded-full text-sm"
                        >
                          {concept}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold mb-3" style={{ color: "#000000" }}>
                      Next Steps:
                    </h4>
                    <p className="text-gray-700">{learningSummary.nextSteps}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3" style={{ color: "#000000" }}>
                      Progress Score:
                    </h4>
                    <div className="w-full bg-gray-300 rounded-full h-4">
                      <div
                        className="bg-green-500 h-4 rounded-full"
                        style={{ width: `${learningSummary.progressScore}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-700 mt-2">
                      {learningSummary.progressScore}% Complete
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-8">
              <button
                onClick={() => setShowChallenge(!showChallenge)}
                className="w-full bg-orange-600 text-white font-semibold py-3 rounded-lg hover:bg-orange-700 transition mb-6"
              >
                {showChallenge ? "❌ Hide Challenge" : "🎯 Try Challenge Mode"}
              </button>

              {showChallenge && (
                <div className="bg-orange-50 p-8 rounded-lg">
                  <h3 className="text-xl font-bold mb-4" style={{ color: "#000000" }}>
                    🎯 Challenge: Code It Yourself!
                  </h3>
                  <p className="text-gray-700 mb-6">
                    Try to write the solution from scratch WITHOUT looking at the code above. 
                    Then submit and get feedback on how close you got!
                  </p>

                  <textarea
                    value={userAttempt}
                    onChange={(e) => setUserAttempt(e.target.value)}
                    placeholder="Write your solution here..."
                    rows="10"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4 font-mono"
                  />

                  <button
                    onClick={handleSubmitChallenge}
                    disabled={submittingChallenge}
                    className="w-full bg-orange-600 text-white font-semibold py-2 rounded-lg hover:bg-orange-700 disabled:bg-gray-400 transition mb-6"
                  >
                    {submittingChallenge ? "Checking..." : "Submit & Get Feedback"}
                  </button>

                  {challengeFeedback && (
                    <div className="bg-white border-2 border-orange-400 p-6 rounded-lg">
                      <h4 className="text-lg font-bold mb-4" style={{ color: "#000000" }}>
                        📊 Your Challenge Results
                      </h4>

                      <div className="mb-6">
                        <h5 className="font-semibold mb-3" style={{ color: "#000000" }}>
                          Success Score:
                        </h5>
                        <div className="w-full bg-gray-300 rounded-full h-6">
                          <div
                            className="bg-orange-500 h-6 rounded-full flex items-center justify-center text-white font-bold text-sm"
                            style={{ width: `${challengeFeedback.successScore}%` }}
                          >
                            {challengeFeedback.successScore}%
                          </div>
                        </div>
                      </div>

                      <div className="mb-6">
                        <h5 className="font-semibold mb-3" style={{ color: "#000000" }}>
                          ✅ What You Did Well:
                        </h5>
                        <ul className="list-disc list-inside space-y-2">
                          {challengeFeedback.strengths.map((strength, idx) => (
                            <li key={idx} className="text-gray-700">
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mb-6">
                        <h5 className="font-semibold mb-3" style={{ color: "#000000" }}>
                          💡 Areas to Improve:
                        </h5>
                        <ul className="list-disc list-inside space-y-2">
                          {challengeFeedback.improvements.map((improvement, idx) => (
                            <li key={idx} className="text-gray-700">
                              {improvement}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mb-6">
                        <h5 className="font-semibold mb-3" style={{ color: "#000000" }}>
                          📝 Comparison:
                        </h5>
                        <p className="text-gray-700">{challengeFeedback.comparison}</p>
                      </div>

                      <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-600">
                        <p className="text-gray-800">
                          <span className="font-bold" style={{ color: "#000000" }}>
                            🌟 {challengeFeedback.encouragement}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}