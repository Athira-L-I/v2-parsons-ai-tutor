from typing import Dict, List, Any, Optional
from .shared_validation import SharedValidationService

def validate_solution(
    problem_settings: Dict[str, Any], 
    user_solution: List[str],
    solution_context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Validates if the user's solution matches the expected correct solution.
    Now uses the shared validation service for consistent validation logic.
    
    Args:
        problem_settings: The ParsonsSettings of the problem
        user_solution: The user's submitted solution as a list of code lines
        solution_context: Optional frontend validation context
    
    Returns:
        A SolutionValidation object with isCorrect flag and optional details
    """
    # Use the shared validation service for consistent validation
    return SharedValidationService.validate_solution_complete(
        problem_settings=problem_settings,
        user_solution=user_solution,
        solution_context=solution_context
    )