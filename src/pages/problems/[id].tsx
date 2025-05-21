import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { NextPage } from 'next';
import { fetchProblemById, checkSolution, generateFeedback } from '@/lib/api';
import { useParsonsContext } from '@/contexts/ParsonsContext';
import ParsonsProblemContainer from '@/components/ParsonsProblemContainer'; 

const ProblemPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { 
    currentProblem, 
    setCurrentProblem, 
    userSolution, 
    setFeedback, 
    setIsCorrect, 
    isCorrect, 
    isLoading, 
    setIsLoading,
    resetContext
  } = useParsonsContext();
  
  const [title, setTitle] = useState('Loading problem...');
  const [description, setDescription] = useState('');
  
  // Track the current problem ID to detect changes
  const [currentProblemId, setCurrentProblemId] = useState<string | null>(null);
  
  useEffect(() => {
    // Only fetch if we have an ID and it's different from the current one
    if (id && typeof id === 'string' && id !== currentProblemId) {
      const loadProblem = async () => {
        // Reset context when loading a new problem
        resetContext();
        setCurrentProblemId(id);
        
        try {
          const data = await fetchProblemById(id);
          setCurrentProblem(data.parsonsSettings);
          setTitle(data.title);
          setDescription(data.description);
        } catch (error) {
          console.error('Failed to fetch problem:', error);
          
          // If the API call fails, load a sample problem as fallback
          const sampleProblem = {
            id: id,
            title: `Sample Problem ${id}`,
            description: 'This is a sample problem for demonstration purposes.',
            parsonsSettings: {
              initial: "def calculate_sum(numbers):\n    if not numbers:\n        return 0\n    total = 0\n    for num in numbers:\n        total += num\n    return total",
              options: {
                sortableId: 'sortable',
                trashId: 'sortableTrash',
                max_wrong_lines: 3,
                can_indent: true,
                grader: 'ParsonsWidget._graders.LineBasedGrader',
                exec_limit: 2500,
                show_feedback: true
              }
            }
          };
          
          setCurrentProblem(sampleProblem.parsonsSettings);
          setTitle(sampleProblem.title);
          setDescription(sampleProblem.description);
        }
      };
      
      loadProblem();
    }
  }, [id, setCurrentProblem, resetContext, currentProblemId]);
  
  const handleCheckSolution = async () => {
    if (!id || !userSolution.length) return;
    
    setIsLoading(true);
    
    try {
      // First check if the solution is correct
      const checkResult = await checkSolution(id.toString(), userSolution);
      setIsCorrect(checkResult.isCorrect);
      
      // If not correct, get AI feedback
      if (!checkResult.isCorrect) {
        const feedbackText = await generateFeedback(id.toString(), userSolution);
        setFeedback(feedbackText);
      } else {
        setFeedback("Great job! Your solution is correct.");
      }
    } catch (error) {
      console.error('Error checking solution:', error);
      setFeedback("There was an error checking your solution. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">{title}</h1>
      
      {description && (
        <div className="mb-6 p-4 bg-white rounded-md border">
          <h2 className="text-lg font-medium mb-2">Problem Description</h2>
          <p className="text-gray-700">{description}</p>
        </div>
      )}
      
      {currentProblem ? (
        <>
        <div className="mb-6 p-4 bg-white rounded-md border">
          <ParsonsProblemContainer 
            problemId={typeof id === 'string' ? id : undefined}
          />
        </div>  
          <div className="mt-6 flex gap-4">
            <button
              onClick={() => router.back()}
              className="px-6 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
            >
              Back to Problems
            </button>
          </div>
        </>
      ) : (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};

export default ProblemPage;