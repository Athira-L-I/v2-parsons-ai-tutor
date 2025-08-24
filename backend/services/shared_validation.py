from typing import Dict, List, Any, Optional
from datetime import datetime
from .validation_engine import validation_engine

class SharedValidationService:
    """
    Centralized validation service that provides consistent validation logic
    across solution validation and feedback generation services.
    
    This version delegates to the unified validation engine for consistency
    between frontend and backend.
    """
    
    @staticmethod
    def extract_correct_lines(problem_settings: Dict[str, Any]) -> List[str]:
        """
        Extract correct solution lines from problem settings.
        
        Args:
            problem_settings: The ParsonsSettings of the problem
            
        Returns:
            List of correct solution lines with preserved indentation
        """
        # Handle both dictionary and object access
        initial_code = problem_settings.get("initial") if isinstance(problem_settings, dict) else problem_settings.initial
        correct_lines = []
        
        # Process each line in the initial code
        for line in initial_code.split('\n'):
            # Skip empty lines
            if not line.strip():
                continue
            
            # Skip distractor lines (marked with #distractor)
            if '#distractor' in line:
                continue
            
            # Add this line to the correct solution (PRESERVE INDENTATION)
            correct_lines.append(line)  # Don't strip here
        
        return correct_lines
    
    @staticmethod
    def clean_user_solution(user_solution: List[str]) -> List[str]:
        """
        Clean user solution by removing empty lines while preserving indentation.
        
        Args:
            user_solution: Raw user solution lines
            
        Returns:
            Cleaned user solution lines with preserved indentation
        """
        return [line for line in user_solution if line.strip()]
    
    @staticmethod
    def check_indentation_consistency(correct_lines: List[str], user_solution: List[str]) -> Dict[str, Any]:
        """
        Check indentation consistency between correct and user solutions.
        
        Args:
            correct_lines: List of correct solution lines
            user_solution: List of user solution lines
            
        Returns:
            Dictionary containing indentation analysis results
        """
        indentation_result = {
            "has_indentation_issues": False,
            "indentation_errors": [],
            "specific_issues": []
        }
        
        try:
            # Only check if we have solutions to compare
            if not user_solution or not correct_lines:
                return indentation_result
            
            min_length = min(len(user_solution), len(correct_lines))
            
            for i in range(min_length):
                user_line = user_solution[i]
                correct_line = correct_lines[i]
                
                # Skip if content doesn't match (handle content vs indentation separately)
                if user_line.strip() != correct_line.strip():
                    continue
                
                # Check indentation
                user_indent = len(user_line) - len(user_line.lstrip())
                correct_indent = len(correct_line) - len(correct_line.lstrip())
                
                if user_indent != correct_indent:
                    indentation_result["has_indentation_issues"] = True
                    indentation_result["indentation_errors"].append({
                        "line_index": i,
                        "user_indent": user_indent,
                        "correct_indent": correct_indent,
                        "line_content": user_line.strip()
                    })
                    indentation_result["specific_issues"].append(
                        f"Line {i + 1}: Expected {correct_indent} spaces, got {user_indent} spaces"
                    )
        
        except Exception as e:
            # Log error but don't fail the validation
            print(f"Indentation check error: {e}")
            indentation_result["has_indentation_issues"] = False
        
        return indentation_result
    
    @staticmethod
    def validate_solution_complete(
        problem_settings: Dict[str, Any],
        user_solution: List[str],
        solution_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Complete solution validation using unified engine
        """
        try:
            # Use the unified validation engine
            result = validation_engine.validate_solution(
                problem_settings,
                user_solution,
                solution_context
            )
            
            # Ensure these fields are always present to avoid the 'solution_length' and 'has_indentation_issues' errors
            correct_lines = SharedValidationService.extract_correct_lines(problem_settings)
            user_lines = SharedValidationService.clean_user_solution(user_solution)
            
            # Add solution length fields if missing
            if 'solution_length' not in result:
                # Add required fields
                result['solution_length'] = len(user_lines)
                result['expected_length'] = len(correct_lines)
                result['completion_ratio'] = (
                    result['solution_length'] / result['expected_length'] 
                    if result['expected_length'] > 0 else 0
                )
                print("Added missing solution_length fields to validation result")
            
            # Add indentation fields if missing
            if 'has_indentation_issues' not in result:
                # Check indentation
                indentation_check = SharedValidationService.check_indentation_consistency(
                    correct_lines, user_solution
                )
                result['has_indentation_issues'] = indentation_check['has_indentation_issues']
                result['indentation_errors'] = indentation_check.get('indentation_errors', [])
                result['specific_issues'] = result.get('specific_issues', []) + indentation_check.get('specific_issues', [])
                result['indentation_hint_count'] = len(indentation_check.get('indentation_errors', []))
                print("Added missing indentation fields to validation result")
            
            return result
            
        except Exception as e:
            print(f"Error in unified validation: {e}")
            # Fallback to basic validation
            result = SharedValidationService._basic_validation(
                problem_settings, 
                user_solution
            )
            
            # Double check that these fields are present
            if 'solution_length' not in result:
                correct_lines = SharedValidationService.extract_correct_lines(problem_settings)
                user_lines = SharedValidationService.clean_user_solution(user_solution)
                
                result['solution_length'] = len(user_lines)
                result['expected_length'] = len(correct_lines)
                result['completion_ratio'] = (
                    result['solution_length'] / result['expected_length'] 
                    if result['expected_length'] > 0 else 0
                )
                
                print("Added missing solution_length fields to fallback validation result")
                
            return result
    
    @staticmethod
    def _basic_validation(problem_settings: Dict[str, Any], user_solution: List[str]) -> Dict[str, Any]:
        """
        Basic validation fallback
        """
        # Extract correct lines
        correct_lines = []
        # Get initial code, handling both dictionary and object access
        initial_code = (
            problem_settings.get("initial") if isinstance(problem_settings, dict)
            else getattr(problem_settings, "initial", "")
        )
        
        for line in initial_code.split('\n'):
            if line.strip() and '#distractor' not in line:
                correct_lines.append(line.strip())
        
        # Compare with user solution
        user_lines = [line.strip() for line in user_solution if line.strip()]
        is_correct = correct_lines == user_lines
        
        # Check for indentation issues
        indentation_analysis = SharedValidationService.check_indentation_consistency(
            correct_lines, user_solution
        )
        
        # Calculate completion ratio
        solution_length = len(user_lines)
        expected_length = len(correct_lines)
        completion_ratio = solution_length / expected_length if expected_length > 0 else 0
        
        return {
            "isCorrect": is_correct,
            "score": 100 if is_correct else 50,
            "errors": [],
            "warnings": [],
            "solution_length": solution_length,
            "expected_length": expected_length,
            "completion_ratio": completion_ratio,
            "has_indentation_issues": indentation_analysis["has_indentation_issues"],
            "indentation_errors": indentation_analysis["indentation_errors"],
            "specific_issues": indentation_analysis["specific_issues"],
            "feedback": {
                "type": "success" if is_correct else "incorrect",
                "summary": "Correct!" if is_correct else "Not quite right.",
                "details": [],
                "nextSteps": []
            },
            "metadata": {
                "validatedAt": datetime.now().isoformat(),
                "validationDuration": 0,
                "rulesApplied": ["basic"],
                "confidence": 0.5,
                "version": "fallback"
            }
        }
    
    @staticmethod
    def analyze_programming_concepts(user_solution: List[str], correct_lines: List[str]) -> Dict[str, Any]:
        """
        Analyze programming concepts present in solutions.
        
        Args:
            user_solution: User's solution lines
            correct_lines: Correct solution lines
            
        Returns:
            Analysis of programming concepts
        """
        solution_text = ' '.join(user_solution).lower()
        correct_text = ' '.join(correct_lines).lower()
        
        concepts = {
            "functions": {"keywords": ["def ", "return"], "description": "function definition"},
            "loops": {"keywords": ["for ", "while "], "description": "iteration/loops"},
            "conditionals": {"keywords": ["if ", "else", "elif"], "description": "conditional logic"},
            "variables": {"keywords": ["="], "description": "variable assignment"},
            "output": {"keywords": ["print("], "description": "output/printing"},
            "input": {"keywords": ["input("], "description": "user input"},
            "lists": {"keywords": ["[", "]", ".append", ".extend"], "description": "list operations"},
            "strings": {"keywords": ["'", '"', ".format", "f'"], "description": "string handling"}
        }
        
        missing_concepts = []
        correct_concepts = []
        
        for concept, details in concepts.items():
            has_in_correct = any(keyword in correct_text for keyword in details["keywords"])
            has_in_user = any(keyword in solution_text for keyword in details["keywords"])
            
            if has_in_correct:
                if has_in_user:
                    correct_concepts.append(concept)
                else:
                    missing_concepts.append(concept)
        
        return {
            "missing_concepts": missing_concepts,
            "correct_concepts": correct_concepts
        }
    
    @staticmethod
    def compare_solutions_detailed(user_solution: List[str], correct_solution: List[str]) -> Dict[str, Any]:
        """
        Provide detailed comparison between user and correct solutions.
        
        Args:
            user_solution: User's solution lines
            correct_solution: Correct solution lines
            
        Returns:
            Detailed comparison analysis
        """
        comparison = {
            "matching_lines": [],
            "misplaced_lines": [],
            "missing_lines": [],
            "extra_lines": [],
            "order_issues": [],
            "first_error_position": None
        }
        
        # Find matching lines
        for i, user_line in enumerate(user_solution):
            user_content = user_line.strip()
            for j, correct_line in enumerate(correct_solution):
                if user_content == correct_line.strip():
                    comparison["matching_lines"].append({
                        "user_pos": i,
                        "correct_pos": j,
                        "content": user_content
                    })
                    break
        
        # Find missing lines
        user_lines_set = set(line.strip() for line in user_solution)
        correct_lines_set = set(line.strip() for line in correct_solution)
        
        comparison["missing_lines"] = list(correct_lines_set - user_lines_set)
        comparison["extra_lines"] = list(user_lines_set - correct_lines_set)
        
        # Analyze order issues
        matching_positions = [(match["user_pos"], match["correct_pos"]) for match in comparison["matching_lines"]]
        matching_positions.sort()
        
        for i in range(1, len(matching_positions)):
            if matching_positions[i][1] < matching_positions[i-1][1]:
                comparison["order_issues"].append({
                    "user_pos": matching_positions[i][0],
                    "expected_pos": matching_positions[i][1],
                    "description": "Line appears before it should"
                })
        
        # Find first error position
        for i, (user_line, correct_line) in enumerate(zip(user_solution, correct_solution)):
            if user_line.strip() != correct_line.strip():
                comparison["first_error_position"] = i
                break
        
        return comparison
