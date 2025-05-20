import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { applyPositionFeedback, applyIndentationFeedback } from '@/lib/parsonsFeedback';

const TestFeedbackPage: NextPage = () => {
  const [studentCode, setStudentCode] = useState<string>(
    "def factorial(n):\n    if n == 0:\n        return 1\n    else:\n        return n * factorial(n-1)"
  );
  
  const [modelSolution, setModelSolution] = useState<string>(
    "def factorial(n):\n    if n == 0:\n        return 1\n    else:\n        return n * factorial(n-1)"
  );

  const [positionFeedback, setPositionFeedback] = useState<any[]>([]);
  const [indentationFeedback, setIndentationFeedback] = useState<any[]>([]);
  
  const applyFeedback = () => {
    const studentLines = studentCode.split('\n');
    const modelLines = modelSolution.split('\n');
    
    const position = applyPositionFeedback(studentLines, modelLines);
    const indentation = applyIndentationFeedback(studentLines, modelLines);
    
    setPositionFeedback(position);
    setIndentationFeedback(indentation);
  };
  
  const introducePositionError = () => {
    // Swap two lines to create a position error
    const lines = studentCode.split('\n');
    if (lines.length >= 4) {
      [lines[2], lines[3]] = [lines[3], lines[2]]; // Swap return 1 and else lines
      setStudentCode(lines.join('\n'));
    }
  };
  
  const introduceIndentationError = () => {
    // Add extra indentation to a line
    const lines = studentCode.split('\n');
    if (lines.length >= 3) {
      lines[2] = '            ' + lines[2].trim(); // Over-indent the "return 1" line
      setStudentCode(lines.join('\n'));
    }
  };
  
  const resetCode = () => {
    setStudentCode(modelSolution);
    setPositionFeedback([]);
    setIndentationFeedback([]);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>ParsonsFeedback Test Page</title>
      </Head>
      
      <h1 className="text-2xl font-bold mb-4">ParsonsFeedback Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Student Code</h2>
          <textarea
            className="w-full h-64 p-4 font-mono text-sm border rounded"
            value={studentCode}
            onChange={(e) => setStudentCode(e.target.value)}
          />
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-2">Model Solution</h2>
          <textarea
            className="w-full h-64 p-4 font-mono text-sm border rounded"
            value={modelSolution}
            onChange={(e) => setModelSolution(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex flex-wrap gap-3 my-6">
        <button
          onClick={applyFeedback}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Apply Feedback
        </button>
        
        <button
          onClick={introducePositionError}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Introduce Position Error
        </button>
        
        <button
          onClick={introduceIndentationError}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
        >
          Introduce Indentation Error
        </button>
        
        <button
          onClick={resetCode}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Reset Code
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Position Feedback</h2>
          <pre className="w-full p-4 bg-gray-100 border rounded overflow-auto">
            {JSON.stringify(positionFeedback, null, 2)}
          </pre>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-2">Indentation Feedback</h2>
          <pre className="w-full p-4 bg-gray-100 border rounded overflow-auto">
            {JSON.stringify(indentationFeedback, null, 2)}
          </pre>
        </div>
      </div>
      
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Feedback Visualization</h2>
        {studentCode.split('\n').map((line, index) => (
          <div 
            key={index}
            className={`font-mono p-2 border-b ${
              positionFeedback[index]?.isIncorrect ? 'bg-red-100' : 
              positionFeedback[index]?.isCorrect ? 'bg-green-100' : ''
            } ${
              indentationFeedback[index]?.isIncorrectIndent ? 'border-l-4 border-l-red-500' :
              indentationFeedback[index]?.isCorrectIndent ? 'border-l-4 border-l-green-500' : ''
            }`}
          >
            <code>{line}</code>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestFeedbackPage;