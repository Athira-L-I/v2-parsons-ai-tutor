import React from 'react';
import { NextPage } from 'next';
import ParsonsProblemContainer from '@/components/ParsonsProblemContainer';
import { ParsonsGrader } from '@/@types/types';

const TestParsonsProblemContainerPage: NextPage = () => {
  // Sample problem for testing
  const sampleProblem = {
    initial: 
      "def calculate_average(numbers):\n" +
      "    if not numbers:\n" +
      "        return 0\n" +
      "    total = sum(numbers)\n" +
      "    return total / len(numbers)\n" +
      "# This is a distractor line #distractor\n" +
      "# Another distractor line #distractor",
    options: {
      sortableId: 'sortable',
      trashId: 'sortableTrash',
      max_wrong_lines: 2,
      can_indent: true,
      grader: ParsonsGrader.LineBased,
      exec_limit: 2500,
      show_feedback: true
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Test Parsons Problem Container</h1>
      
      <div className="bg-white p-6 border rounded-lg shadow-sm">
        <ParsonsProblemContainer 
          title="Calculate Average Function"
          description="Arrange the code blocks to create a function that calculates the average of a list of numbers. Handle the case where the list is empty by returning 0."
          initialProblem={sampleProblem}
        />
      </div>
    </div>
  );
};

export default TestParsonsProblemContainerPage;