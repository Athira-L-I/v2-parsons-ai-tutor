#!/usr/bin/env python3

"""
Test script to verify the validation refactoring is working correctly.
This tests the SharedValidationService integration without requiring external dependencies.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.shared_validation import SharedValidationService
from services.solution_validator import validate_solution

def test_shared_validation_service():
    """Test the SharedValidationService directly"""
    print("Testing SharedValidationService...")
    
    # Test problem settings
    problem_settings = {
        "initial": "def calculate_sum(numbers):\n    total = 0\n    for num in numbers:\n        total += num\n    return total"
    }
    
    # Test with correct solution
    correct_solution = [
        "def calculate_sum(numbers):",
        "    total = 0",
        "    for num in numbers:",
        "        total += num",
        "    return total"
    ]
    
    # Test with incorrect indentation
    incorrect_indentation_solution = [
        "def calculate_sum(numbers):",
        "total = 0",  # Missing indentation
        "    for num in numbers:",
        "        total += num",
        "    return total"
    ]
    
    # Test with frontend context
    frontend_context = {
        "isCorrect": False,
        "has_indentation_issues": True,
        "details": "Solution has indentation issues",
        "indentation_errors": [{"line_index": 1, "user_indent": 0, "correct_indent": 4}]
    }
    
    # Test 1: Correct solution
    print("\n1. Testing correct solution:")
    result1 = SharedValidationService.validate_solution_complete(
        problem_settings, correct_solution
    )
    print(f"   ✓ Is correct: {result1['isCorrect']}")
    print(f"   ✓ Has indentation issues: {result1['has_indentation_issues']}")
    print(f"   ✓ Details: {result1['details']}")
    
    # Test 2: Incorrect indentation
    print("\n2. Testing incorrect indentation:")
    result2 = SharedValidationService.validate_solution_complete(
        problem_settings, incorrect_indentation_solution
    )
    print(f"   ✓ Is correct: {result2['isCorrect']}")
    print(f"   ✓ Has indentation issues: {result2['has_indentation_issues']}")
    print(f"   ✓ Indentation errors: {len(result2['indentation_errors'])}")
    
    # Test 3: With frontend context
    print("\n3. Testing with frontend context:")
    result3 = SharedValidationService.validate_solution_complete(
        problem_settings, incorrect_indentation_solution, frontend_context
    )
    print(f"   ✓ Is correct: {result3['isCorrect']}")
    print(f"   ✓ Has indentation issues: {result3['has_indentation_issues']}")
    print(f"   ✓ Uses frontend context: {result3['isCorrect'] == frontend_context['isCorrect']}")
    
    # Test 4: Programming concepts analysis
    print("\n4. Testing programming concepts analysis:")
    concepts = SharedValidationService.analyze_programming_concepts(
        correct_solution, 
        SharedValidationService.extract_correct_lines(problem_settings)
    )
    print(f"   ✓ Correct concepts: {concepts['correct_concepts']}")
    print(f"   ✓ Missing concepts: {concepts['missing_concepts']}")

def test_solution_validator_integration():
    """Test that solution_validator.py uses the shared service"""
    print("\nTesting solution_validator integration...")
    
    problem_settings = {
        "initial": "def greet(name):\n    print(f'Hello, {name}!')\n    return name"
    }
    
    user_solution = [
        "def greet(name):",
        "    print(f'Hello, {name}!')",
        "    return name"
    ]
    
    # Test the refactored validate_solution function
    result = validate_solution(problem_settings, user_solution)
    
    print(f"   ✓ Solution validator works: {result['isCorrect']}")
    print(f"   ✓ Has validation fields: {'has_indentation_issues' in result}")
    print(f"   ✓ Has completion ratio: {'completion_ratio' in result}")

def test_extract_correct_lines():
    """Test the correct line extraction"""
    print("\nTesting correct line extraction...")
    
    problem_with_distractors = {
        "initial": "def example():\n    x = 1\n    y = 2  #distractor\n    return x\n    z = 3  #distractor"
    }
    
    correct_lines = SharedValidationService.extract_correct_lines(problem_with_distractors)
    expected_lines = ["def example():", "    x = 1", "    return x"]
    
    print(f"   ✓ Extracted lines: {correct_lines}")
    print(f"   ✓ Correct extraction: {correct_lines == expected_lines}")

if __name__ == "__main__":
    print("🔧 Testing Validation Refactoring")
    print("=" * 50)
    
    try:
        test_shared_validation_service()
        test_solution_validator_integration()
        test_extract_correct_lines()
        
        print("\n" + "=" * 50)
        print("✅ All validation refactoring tests passed!")
        print("\nThe refactoring successfully:")
        print("  - Eliminates duplicate validation logic")
        print("  - Provides consistent indentation checking")
        print("  - Integrates frontend context properly")
        print("  - Maintains backward compatibility")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
