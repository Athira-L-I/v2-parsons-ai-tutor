import type { NextApiRequest, NextApiResponse } from 'next';
import { ParsonsSettings } from '@/@types/types';

type ValidationRequest = {
  settings: ParsonsSettings;
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
    const { settings, solution } = req.body as ValidationRequest;

    if (!settings || !solution) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

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