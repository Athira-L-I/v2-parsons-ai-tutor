import React from 'react';
import Layout from '@/components/Layout';
import ParsonsProblemContainer from '@/components/ParsonsProblemContainer';
import { ParsonsSettings } from '@/@types/types';

const TestProblemWithChatPage: React.FC = () => {
  // Sample problem for testing
  const sampleProblem: ParsonsSettings = {
    initial:
      "def calculate_sum(numbers):\n    total = 0\n    for num in numbers:\n        total = total + num\n    return total\nprint('done') #distractor\nprint('hello') #distractor",
    options: {
      sortableId: 'sortable',
      trashId: 'sortableTrash',
      max_wrong_lines: 2,
      can_indent: true,
      grader: 'ParsonsWidget._graders.LineBasedGrader',
      exec_limit: 2500,
      show_feedback: true,
      x_indent: 50,
    },
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">
          Problem Container with Chat Test
        </h1>

        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">
            Test Instructions:
          </h3>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Arrange the code blocks in the sortable area</li>
            <li>Check your solution to see traditional feedback</li>
            <li>Use the chat interface to ask questions about the problem</li>
            <li>
              Verify that both chat and traditional feedback work together
            </li>
            <li>Test the adaptive features if available</li>
          </ol>
        </div>

        <ParsonsProblemContainer
          initialProblem={sampleProblem}
          title="Calculate Sum Function"
          description="Arrange the code blocks to create a function that calculates the sum of numbers in a list."
          showUploader={false}
        />
      </div>
    </Layout>
  );
};

export default TestProblemWithChatPage;
