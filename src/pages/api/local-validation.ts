import type { NextApiRequest, NextApiResponse } from 'next';
import { ParsonsSettings } from '@/@types/types';

type ValidationRequest = {
  problemId?: string;
  settings?: ParsonsSettings;
  solution: string[];
};

type ValidationResponse = {
  isCorrect: boolean;
  details: string;
};

/**
 * API route for local validation of Parsons problem solutions
 * This is useful for development or when the backend is not available
 */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ValidationResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { problemId, settings, solution } = req.body as ValidationRequest;

    if (!solution || !Array.isArray(solution)) {
      return res.status(400).json({ error: 'Solution must be provided as an array' });
    }

    // If settings are provided directly, use them
    if (settings) {
      return validateWithSettings(settings, solution, res);
    }

    // If only problemId is provided, try to find the problem
    if (problemId) {
      // In a real implementation, you would fetch the problem by ID
      // For now, we'll return a generic response
      return res.status(200).json({
        isCorrect: false,
        details: `Local validation attempted for problem ${problemId}. Server validation recommended for accurate results.`
      });
    }

    return res.status(400).json({ error: 'Either problemId or settings must be provided' });
  } catch (error) {
    console.error('Error in local validation:', error);
    return res.status(500).json({ error: 'Internal server error during validation' });
  }
}

function validateWithSettings(
  settings: ParsonsSettings, 
  solution: string[], 
  res: NextApiResponse<ValidationResponse | { error: string }>
) {
  try {
    // Extract the correct solution lines from the problem settings
    const initialCode = settings.initial;
    const correctLines: { text: string; indent: number }[] = [];
    
    // Process each line in the initial code
    for (const line of initialCode.split('\n')) {
      // Skip empty lines
      if (!line.trim()) continue;
      
      // Skip distractor lines (marked with #distractor)
      if (line.includes('#distractor')) continue;
      
      // Add this line to the correct solution with its indentation
      const leadingSpaces = line.length - line.trimStart().length;
      const indentLevel = Math.floor(leadingSpaces / 4); // Assuming 4 spaces per indent level
      
      correctLines.push({
        text: line.trim(),
        indent: indentLevel
      });
    }
    
    // Process user solution lines with indentation
    const processedUserSolution = solution.map(line => {
      const leadingSpaces = line.length - line.trimStart().length;
      const indentLevel = Math.floor(leadingSpaces / 4);
      
      return {
        text: line.trim(),
        indent: indentLevel
      };
    }).filter(line => line.text); // Remove empty lines
    
    // Check if the solution has the right number of lines
    if (processedUserSolution.length !== correctLines.length) {
      return res.status(200).json({
        isCorrect: false,
        details: `Your solution has ${processedUserSolution.length} lines, but the correct solution has ${correctLines.length} lines.`
      });
    }
    
    // Compare each line for text content and indentation
    for (let i = 0; i < correctLines.length; i++) {
      // Check text content
      if (processedUserSolution[i].text !== correctLines[i].text) {
        return res.status(200).json({
          isCorrect: false,
          details: `Line ${i + 1} doesn't match the expected solution.`
        });
      }
      
      // Check indentation 
      if (processedUserSolution[i].indent !== correctLines[i].indent) {
        return res.status(200).json({
          isCorrect: false,
          details: `Line ${i + 1} has incorrect indentation. Expected ${correctLines[i].indent} levels but got ${processedUserSolution[i].indent}.`
        });
      }
    }
    
    return res.status(200).json({
      isCorrect: true,
      details: 'Your solution is correct!'
    });
  } catch (error) {
    console.error('Error in local validation:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}