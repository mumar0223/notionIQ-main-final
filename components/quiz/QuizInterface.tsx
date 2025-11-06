"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, X } from "lucide-react";

export function QuizInterface({ quizId, userId }: { quizId: string; userId: string }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [showResults, setShowResults] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { data: quiz, isLoading } = useQuery({
    queryKey: ["quiz", quizId],
    queryFn: async () => {
      const res = await fetch(`/api/quiz/${quizId}`);
      if (!res.ok) throw new Error("Failed to fetch quiz");
      return res.json();
    },
  });

  if (isLoading) {
    return <div className="p-8">Loading quiz...</div>;
  }

  if (!quiz) {
    return <div className="p-8">Quiz not found</div>;
  }

  const handleAnswerChange = (answer: string | string[]) => {
    setAnswers({ ...answers, [currentQuestion]: answer });
  };

  const handleCheckboxChange = (option: string) => {
    const current = answers[currentQuestion] as string[] | undefined || [];
    const updated = current.includes(option)
      ? current.filter((o) => o !== option)
      : [...current, option];
    setAnswers({ ...answers, [currentQuestion]: updated });
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setShowResults(true);
  };

  const calculateScore = () => {
    let correct = 0;
    quiz.questions.forEach((q: any, index: number) => {
      const userAnswer = answers[index];
      const correctAnswer = q.correctAnswer;
      
      if (q.type === "checkbox") {
        const userArr = Array.isArray(userAnswer) ? userAnswer.sort() : [];
        const correctArr = Array.isArray(correctAnswer) ? correctAnswer.sort() : [correctAnswer];
        if (JSON.stringify(userArr) === JSON.stringify(correctArr)) {
          correct++;
        }
      } else {
        if (userAnswer === correctAnswer) {
          correct++;
        }
      }
    });
    return {
      correct,
      total: quiz.questions.length,
      percentage: Math.round((correct / quiz.questions.length) * 100),
    };
  };

  const currentQ = quiz.questions[currentQuestion];
  const isAnswered = answers[currentQuestion] !== undefined && 
    (Array.isArray(answers[currentQuestion]) ? answers[currentQuestion].length > 0 : true);
  
  const checkCorrect = () => {
    if (!submitted) return false;
    const userAnswer = answers[currentQuestion];
    const correctAnswer = currentQ.correctAnswer;
    
    if (currentQ.type === "checkbox") {
      const userArr = Array.isArray(userAnswer) ? userAnswer.sort() : [];
      const correctArr = Array.isArray(correctAnswer) ? correctAnswer.sort() : [correctAnswer];
      return JSON.stringify(userArr) === JSON.stringify(correctArr);
    }
    return userAnswer === correctAnswer;
  };
  
  const isCorrect = checkCorrect();

  if (showResults) {
    const score = calculateScore();
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6 text-center">{quiz.title}</h1>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Quiz Complete!</h2>
            <p className="text-4xl font-bold text-blue-600 mb-2">{score.percentage}%</p>
            <p className="text-gray-700">
              You got {score.correct} out of {score.total} questions correct
            </p>
          </div>

          <div className="space-y-6">
            {quiz.questions.map((q: any, index: number) => {
              const userAnswer = answers[index];
              let correct = false;
              
              if (q.type === "checkbox") {
                const userArr = Array.isArray(userAnswer) ? userAnswer.sort() : [];
                const correctArr = Array.isArray(q.correctAnswer) ? q.correctAnswer.sort() : [q.correctAnswer];
                correct = JSON.stringify(userArr) === JSON.stringify(correctArr);
              } else {
                correct = userAnswer === q.correctAnswer;
              }
              
              return (
                <div
                  key={index}
                  className={`border rounded-lg p-6 ${
                    correct ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-start gap-3 mb-4">
                    {correct ? (
                      <Check className="text-green-600 flex-shrink-0 mt-1" size={24} />
                    ) : (
                      <X className="text-red-600 flex-shrink-0 mt-1" size={24} />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">
                        Question {index + 1}: {q.question}
                      </h3>
                      
                      <p className="text-sm mb-2">
                        <span className="font-medium">Your answer:</span>{" "}
                        <span className={correct ? "text-green-700" : "text-red-700"}>
                          {Array.isArray(userAnswer) ? userAnswer.join(", ") : (userAnswer || "Not answered")}
                        </span>
                      </p>
                      
                      {!correct && (
                        <p className="text-sm mb-2">
                          <span className="font-medium">Correct answer:</span>{" "}
                          <span className="text-green-700">
                            {Array.isArray(q.correctAnswer) ? q.correctAnswer.join(", ") : q.correctAnswer}
                          </span>
                        </p>
                      )}
                      
                      <p className="text-sm text-gray-700 mt-3 bg-white/50 p-3 rounded">
                        <span className="font-medium">Explanation:</span> {q.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => window.location.href = "/folders"}
            className="mt-8 w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Folders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-6">{quiz.title}</h1>
        
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Question {currentQuestion + 1} of {quiz.questions.length}</span>
            <span>{Object.keys(answers).length} answered</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{
                width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-6">{currentQ.question}</h2>
          
          <div className="space-y-3">
            {currentQ.type === "multiple-choice" &&
              currentQ.options.map((option: string, index: number) => (
                <label
                  key={index}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    answers[currentQuestion] === option
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion}`}
                    value={option}
                    checked={answers[currentQuestion] === option}
                    onChange={() => handleAnswerChange(option)}
                    className="mr-3"
                  />
                  <span>{option}</span>
                </label>
              ))}
            
            {currentQ.type === "checkbox" &&
              currentQ.options.map((option: string, index: number) => {
                const selected = (answers[currentQuestion] as string[] || []).includes(option);
                return (
                  <label
                    key={index}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selected
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      value={option}
                      checked={selected}
                      onChange={() => handleCheckboxChange(option)}
                      className="mr-3"
                    />
                    <span>{option}</span>
                  </label>
                );
              })}
            
            {currentQ.type === "dropdown" && (
              <select
                value={(answers[currentQuestion] as string) || ""}
                onChange={(e) => handleAnswerChange(e.target.value)}
                className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none"
              >
                <option value="">Select an answer...</option>
                {currentQ.options.map((option: string, index: number) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
          >
            Previous
          </button>
          
          {currentQuestion < quiz.questions.length - 1 ? (
            <button
              onClick={() => setCurrentQuestion(currentQuestion + 1)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Submit Quiz
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
