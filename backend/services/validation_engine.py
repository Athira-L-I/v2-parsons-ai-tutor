"""
Python bridge to the unified validation engine
This calls the TypeScript validation engine for consistency
"""

import json
import subprocess
import tempfile
import os
import time
from datetime import datetime
from typing import Dict, Any, List
import sys
# Add the parent directory to path to allow absolute imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from models import ParsonsSettings

class ValidationEngineBridge:
    def __init__(self):
        self.validation_script_path = self._get_validation_script_path()
    
    def validate_solution(
        self, 
        problem_settings: ParsonsSettings, 
        user_solution: List[str],
        context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Validate solution using the unified TypeScript validation engine
        
        Args:
            problem_settings: Can be a ParsonsSettings object or a dict representation
            user_solution: The user's submitted solution as a list of code lines
            context: Additional context for validation
        """
        # Prepare input for validation engine
        validation_input = {
            "problem": self._convert_settings_to_normalized(problem_settings),
            "solution": self._convert_solution_to_normalized(user_solution),
            "context": context or {
                "problemId": "unknown",
                "attemptNumber": 1,
                "timeSpent": 0,
                "previousAttempts": []
            }
        }
        
        try:
            # Call Node.js validation engine
            result = self._call_validation_engine(validation_input)
            return result
        except Exception as e:
            print(f"Error calling validation engine: {e}")
            # Fallback to basic validation
            return self._fallback_validation(problem_settings, user_solution)
    
    def _call_validation_engine(self, validation_input: Dict[str, Any]) -> Dict[str, Any]:
        """
        Call the Node.js validation engine via subprocess
        """
        # Write input to temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as temp_file:
            json.dump(validation_input, temp_file)
            temp_file_path = temp_file.name
        
        try:
            # Call Node.js script
            result = subprocess.run([
                'node',
                self.validation_script_path,
                temp_file_path
            ], capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                return json.loads(result.stdout)
            else:
                raise Exception(f"Validation script error: {result.stderr}")
        
        finally:
            # Clean up temporary file
            os.unlink(temp_file_path)
    
    def _convert_settings_to_normalized(self, settings: ParsonsSettings) -> Dict[str, Any]:
        """
        Convert ParsonsSettings to normalized problem format
        """
        # Handle both object and dictionary access patterns
        initial_code = settings.initial if hasattr(settings, 'initial') else settings.get('initial', '')
        lines = initial_code.split('\n')
        correct_solution = []
        distractors = []
        
        for i, line in enumerate(lines):
            if not line.strip():
                continue
                
            is_distractor = '#distractor' in line
            clean_content = line.replace('#distractor', '').replace('#paired', '').strip()
            indent_level = (len(line) - len(line.lstrip())) // 4
            
            block = {
                "id": f"block-{i}",
                "content": clean_content,
                "correctPosition": i,
                "correctIndentation": indent_level,
                "dependencies": [],
                "metadata": {
                    "isOptional": False,
                    "alternatives": [],
                    "strictOrder": True,
                    "validIndentations": [indent_level],
                    "concepts": []
                }
            }
            
            if is_distractor:
                distractors.append(block)
            else:
                correct_solution.append(block)
        
        return {
            "id": "problem",
            "correctSolution": correct_solution,
            "distractors": distractors,
            "options": {
                "strictOrder": True,
                "allowIndentationErrors": not (
                    settings.options.can_indent if hasattr(settings, 'options') and hasattr(settings.options, 'can_indent') 
                    else settings.get('options', {}).get('can_indent', True)
                ),
                "allowExtraSpaces": True,
                "caseSensitive": False,
                "validateSyntax": False,
                "maxScore": 100,
                "partialCredit": True
            },
            "metadata": {
                "language": "python",
                "difficulty": 1,
                "estimatedTime": 15,
                "concepts": []
            }
        }
    
    def _convert_solution_to_normalized(self, solution: List[str]) -> Dict[str, Any]:
        """
        Convert user solution to normalized format
        """
        blocks = []
        for i, line in enumerate(solution):
            if line.strip():
                blocks.append({
                    "id": f"user-block-{i}",
                    "content": line.strip(),
                    "position": i,
                    "indentationLevel": (len(line) - len(line.lstrip())) // 4,
                    "isInSolution": True
                })
        
        return {
            "blocks": blocks,
            "timestamp": int(time.time() * 1000)
        }
    
    def _fallback_validation(self, settings: ParsonsSettings, solution: List[str]) -> Dict[str, Any]:
        """
        Fallback validation when the main engine is not available
        """
        # Get the correct solution
        # Handle both object and dictionary access patterns
        initial_code = settings.initial if hasattr(settings, 'initial') else settings.get('initial', '')
        correct_lines = [line for line in initial_code.split('\n') if line.strip() and '#distractor' not in line]
        user_lines = [line.strip() for line in solution if line.strip()]
        
        # Simple validation
        is_correct = len(correct_lines) == len(user_lines)
        if is_correct:
            # Check content (ignoring indentation)
            for i, (correct, user) in enumerate(zip(correct_lines, user_lines)):
                if correct.strip() != user.strip():
                    is_correct = False
                    break
        
        # Check for indentation issues
        has_indentation_issues = False
        indentation_errors = []
        specific_issues = []
        
        # If we have both correct lines and user solution, perform basic indentation check
        if correct_lines and solution:
            min_length = min(len(correct_lines), len(solution))
            for i in range(min_length):
                # Skip if content doesn't match or if line is empty
                if not solution[i].strip() or not correct_lines[i].strip():
                    continue
                if solution[i].strip() != correct_lines[i].strip():
                    continue
                    
                # Check indentation
                user_indent = len(solution[i]) - len(solution[i].lstrip())
                correct_indent = len(correct_lines[i]) - len(correct_lines[i].lstrip())
                
                if user_indent != correct_indent:
                    has_indentation_issues = True
                    indentation_errors.append({
                        "lineIndex": i,
                        "currentIndent": user_indent // 4,
                        "expectedIndent": correct_indent // 4,
                        "line": solution[i].strip()
                    })
                    specific_issues.append(
                        f"Line {i+1}: Indentation should be {correct_indent // 4} level(s), not {user_indent // 4} level(s)"
                    )
        
        # Enhanced response with solution_length and indentation info
        return {
            "isCorrect": is_correct,
            "score": 100 if is_correct else 50,
            "errors": [],
            "warnings": [],
            "solution_length": len(user_lines),
            "expected_length": len(correct_lines),
            "completion_ratio": len(user_lines) / len(correct_lines) if len(correct_lines) > 0 else 0,
            "has_indentation_issues": has_indentation_issues,
            "indentation_errors": indentation_errors,
            "specific_issues": specific_issues,
            "indentation_hint_count": len(indentation_errors),
            "feedback": {
                "type": "success" if is_correct else "incorrect",
                "summary": "Correct solution!" if is_correct else "Not quite right yet.",
                "details": specific_issues,
                "nextSteps": []
            },
            "metadata": {
                "validatedAt": datetime.now().isoformat(),
                "validationDuration": 0,
                "rulesApplied": ["fallback"],
                "confidence": 0.1,
                "version": "fallback-1.0.0"
            }
        }
    
    def _get_validation_script_path(self) -> str:
        """
        Get path to the Node.js validation script
        """
        # This would point to a Node.js script that uses the validation engine
        return os.path.join(
            os.path.dirname(__file__),
            '../../scripts/validate_solution.js'
        )

# Singleton instance
validation_engine = ValidationEngineBridge()
