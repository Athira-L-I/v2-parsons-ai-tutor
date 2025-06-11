# Test script to verify indentation detection and backend communication 
# for the specific example provided by the user.

import json

# User's solution code (incorrect - missing indentation)
user_solution = [
    "def print_coordinates(rows, cols):",
    "for i in range(rows):",
    "for j in range(cols):",
    "print(f\"({i}, {j})\")"
]

# Current problem (correct indentation)
correct_solution = [
    "def print_coordinates(rows, cols):",
    "    for i in range(rows):",
    "        for j in range(cols):",
    "            print(f\"({i}, {j})\")"
]

def get_indent_level(line):
    """Get indentation level (number of leading spaces / 4)"""
    leading_spaces = len(line) - len(line.lstrip())
    return leading_spaces // 4

def generate_indentation_hints(student_solution, correct_solution):
    """
    Simulate the frontend generateIndentationHints function
    """
    hints = []
    
    # Create a map of correct content to expected indentation
    correct_indent_map = {}
    for line in correct_solution:
        content = line.strip()
        if content and not content.startswith('#'):
            correct_indent_map[content] = get_indent_level(line)
    
    # Analyze student solution line by line
    for index, student_line in enumerate(student_solution):
        student_content = student_line.strip()
        student_indent = get_indent_level(student_line)
        
        if not student_content:
            continue  # Skip empty lines
            
        expected_indent = correct_indent_map.get(student_content)
        
        if expected_indent is not None and student_indent != expected_indent:
            indent_diff = expected_indent - student_indent
            
            if indent_diff > 0:
                hint = f'Line {index + 1} "{student_content}" should be indented {indent_diff} more level{"s" if indent_diff > 1 else ""}.'
            else:
                hint = f'Line {index + 1} "{student_content}" should be indented {abs(indent_diff)} fewer level{"s" if abs(indent_diff) > 1 else ""}.'
            
            # Add context-specific hints
            if student_content.endswith(':'):
                hint += ' Lines ending with ":" introduce new code blocks.'
            elif student_content.startswith('for ') or student_content.startswith('while '):
                hint += ' Code inside this loop should be indented relative to this line.'
            elif student_content.startswith('print('):
                hint += ' Print statements are usually inside functions or loops.'
            
            hints.append({
                'lineIndex': index,
                'currentIndent': student_indent,
                'expectedIndent': expected_indent,
                'hint': hint
            })
    
    return hints

def create_solution_context(is_correct, indentation_hints):
    """
    Simulate the frontend solution context creation
    """
    return {
        'isCorrect': is_correct,
        'indentationHints': indentation_hints,
        'solutionStatus': 'indentation-issues' if len(indentation_hints) > 0 else ('correct' if is_correct else 'incorrect'),
        'has_indentation_issues': len(indentation_hints) > 0,
        'indentation_hint_count': len(indentation_hints)
    }

def main():
    print("Testing Indentation Detection for User's Example")
    print("=" * 60)    
    print("\nUser's Solution (Incorrect):")
    for i, line in enumerate(user_solution, 1):
        print(f"  {i}: '{line}' (indent: {get_indent_level(line)})")    
    print("\nCorrect Solution:")
    for i, line in enumerate(correct_solution, 1):
        print(f"  {i}: '{line}' (indent: {get_indent_level(line)})")    
    print("\nRunning Indentation Detection...")
    
    # Generate indentation hints
    hints = generate_indentation_hints(user_solution, correct_solution)    
    print(f"\nDetection Results:")
    print(f"  Found {len(hints)} indentation issues")
    
    for hint in hints:
        print(f"  - Line {hint['lineIndex'] + 1}: Current={hint['currentIndent']}, Expected={hint['expectedIndent']}")
        print(f"    Hint: {hint['hint']}")
    
    # Create solution context
    solution_context = create_solution_context(False, hints)    
    print(f"\nSolution Context for Backend:")
    print(json.dumps(solution_context, indent=2))
    
    # Verify expected results    
    print(f"\nVerification:")
    expected_issues = 3  # Lines 2, 3, 4 should have indentation issues
    if len(hints) == expected_issues:        print(f"  [OK] Correctly detected {expected_issues} indentation issues")
    else:
        print(f"  [ERROR] Expected {expected_issues} issues, but found {len(hints)}")
    
    # Check specific lines
    expected_indents = [0, 1, 2, 3]  # def, for, for, print
    for i, expected in enumerate(expected_indents):
        actual = get_indent_level(user_solution[i])
        if actual != expected:            print(f"  [OK] Line {i+1} correctly identified: actual={actual}, expected={expected}")
        else:
            print(f"  [ERROR] Line {i+1} should be wrong but appears correct")
    
    # Verify solution context flags
    if solution_context['has_indentation_issues']:        print(f"  [OK] Solution context correctly flags indentation issues")
    else:
        print(f"  [ERROR] Solution context should flag indentation issues")
    
    if solution_context['solutionStatus'] == 'indentation-issues':
        print(f"  [OK] Solution status correctly set to 'indentation-issues'")
    else:
        print(f"  [ERROR] Solution status should be 'indentation-issues', got '{solution_context['solutionStatus']}'")
    
    print(f"\nExpected Backend Behavior:")
    print(f"  - SharedValidationService should receive solutionContext with:")
    print(f"    - has_indentation_issues: True")
    print(f"    - indentation_hint_count: {len(hints)}")
    print(f"    - solutionStatus: 'indentation-issues'")
    print(f"  - Backend should provide contextual feedback about indentation")
    print(f"  - All validation components should use this shared context")

if __name__ == "__main__":
    main()
