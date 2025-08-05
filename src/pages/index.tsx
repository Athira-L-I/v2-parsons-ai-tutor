import React, { useState } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import ParsonsProblemContainer from '@/components/ParsonsProblemContainer';
import { ParsonsGrader, ParsonsSettings } from '@/@types/types';
import { useParsonsContext } from '@/contexts/useParsonsContext';
import { useServices } from '@/contexts/ServiceContext';
import { DataModelConverter } from '@/types/legacy';

/**
 * Sample initial problem for demo purposes as a fallback
 */
const sampleProblem = {
  initial:
    'start = 1\nend = 10\nfor i in range(start, end + 1):\n    if i % 2 == 0:\n        print(i)',
  options: {
    sortableId: 'sortable',
    trashId: 'sortableTrash',
    max_wrong_lines: 3,
    can_indent: true,
    grader: ParsonsGrader.LineBased,
    exec_limit: 2500,
    show_feedback: true,
  },
};

const HomePage: NextPage = () => {
  const [showDemo, setShowDemo] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Define proper type for demo problem
  interface DemoProblemData {
    id: string;
    title: string;
    description: string;
    parsonsSettings: ParsonsSettings; // Using the proper type
  }
  
  const [demoProblem, setDemoProblem] = useState<DemoProblemData | null>(null);

  // Get the resetContext function from context
  const { setCurrentProblem, resetContext } = useParsonsContext();
  // Access repository services
  const { problemRepository } = useServices();

  const handleTryDemo = async () => {
    // Reset context before loading a new problem
    resetContext();

    setIsLoading(true);
    setShowDemo(true);
    setShowCreate(false);

    try {
      // Fetch the demo problem with a fixed ID using repository
      const problem = await problemRepository.findById('demo-problem-1');
      
      if (problem) {
        // Convert domain model to legacy format
        const legacySettings = DataModelConverter.problemToLegacySettings(problem);
        
        // Create compatible data structure
        const demoProblemData = {
          id: problem.id,
          title: problem.title,
          description: problem.description,
          parsonsSettings: legacySettings
        };
        
        setDemoProblem(demoProblemData);
        setCurrentProblem(legacySettings);
      } else {
        throw new Error('Demo problem not found');
      }
    } catch (error) {
      console.error('Failed to load demo problem:', error);
      // Fallback to the sample problem if the API call fails
      setDemoProblem({
        id: 'demo-problem-local',
        title: 'Local Demo: Print Even Numbers in a Range',
        description:
          'Write code that prints all even numbers from a given start to end value using a for loop and conditional check.',
        parsonsSettings: sampleProblem,
      });
      setCurrentProblem(sampleProblem);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProblem = () => {
    // Reset context before showing the create problem view
    resetContext();

    setShowCreate(true);
    setShowDemo(false);
  };

  return (
    <div className="space-y-8">
      {/* Hero section */}
      <section className="text-center py-10">
        <h1 className="text-4xl font-bold mb-4">Parsons Problem Tutor</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Learn programming through code reordering challenges with AI-powered
          Socratic feedback
        </p>
        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={handleTryDemo}
            disabled={isLoading}
            className={`px-6 py-3 ${
              isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
            } text-white rounded-md font-medium`}
          >
            {isLoading ? 'Loading Demo...' : 'Try Demo'}
          </button>
          <button
            onClick={handleCreateProblem}
            className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
          >
            Create Problem
          </button>
        </div>
      </section>

      {/* Demo or Create section */}
      {(showDemo || showCreate) && (
        <section className="bg-white border rounded-lg shadow-sm p-6 max-w-5xl mx-auto">
          {showDemo && demoProblem && (
            <ParsonsProblemContainer
              problemId={demoProblem.id}
              title={demoProblem.title}
              description={demoProblem.description}
              initialProblem={demoProblem.parsonsSettings}
            />
          )}

          {showDemo && isLoading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}

          {showCreate && (
            <ParsonsProblemContainer
              title="Create Your Own Parsons Problem"
              description="Upload or paste your Python code to generate a Parsons problem."
              showUploader={true}
            />
          )}
        </section>
      )}

      {/* Features section */}
      {!showDemo && !showCreate && (
        <>
          <section className="grid md:grid-cols-3 gap-8 py-10">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold mb-3">
                Interactive Learning
              </h2>
              <p className="text-gray-600">
                Solve programming challenges by rearranging jumbled code blocks
                into the correct order.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold mb-3">
                AI-Powered Feedback
              </h2>
              <p className="text-gray-600">
                Receive Socratic feedback that guides you toward solutions
                without giving away answers.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold mb-3">
                Create Your Own Problems
              </h2>
              <p className="text-gray-600">
                Upload Python code to automatically generate custom Parsons
                problems.
              </p>
            </div>
          </section>

          <section className="bg-blue-50 -mx-4 px-4 py-10">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-6 text-center">
                How It Works
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                    1
                  </div>
                  <h3 className="text-lg font-medium mb-2">Select a Problem</h3>
                  <p className="text-gray-600">
                    Choose from our problem library or create your own from
                    Python code.
                  </p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                    2
                  </div>
                  <h3 className="text-lg font-medium mb-2">
                    Arrange the Blocks
                  </h3>
                  <p className="text-gray-600">
                    Drag and drop code blocks to create a working solution.
                  </p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                    3
                  </div>
                  <h3 className="text-lg font-medium mb-2">
                    Learn from Feedback
                  </h3>
                  <p className="text-gray-600">
                    Get AI-powered hints that help you understand concepts
                    deeply.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default HomePage;
