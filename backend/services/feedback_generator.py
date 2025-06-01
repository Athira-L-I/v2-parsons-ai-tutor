import os
import openai
from dotenv import load_dotenv
from pathlib import Path
from typing import Dict, List, Any, Optional
import json
import re

# Get the current file's directory
current_dir = Path(__file__).parent

# Construct the relative path to .env.local
dotenv_path = current_dir.parent.parent / ".env.local"

# Load the .env.local file
load_dotenv(dotenv_path=dotenv_path)

# Configure OpenAI API
openai.api_key = os.getenv("OPENROUTER_API_KEY")

def generate_feedback(problem_settings: Dict[str, Any], user_solution: List[str]) -> str:
    """
    Generates Socratic feedback for a student's solution attempt using AI.
    This is the ORIGINAL function - preserved for backwards compatibility.
    
    Args:
        problem_settings: The ParsonsSettings of the problem
        user_solution: The user's submitted solution as a list of code lines
    
    Returns:
        A string containing Socratic-style feedback
    """
    # Extract the correct solution and user solution
    initial_code = problem_settings["initial"]
    correct_lines = [line for line in initial_code.split('\n') if line.strip() and '#distractor' not in line]
    correct_lines_str = "\n".join(correct_lines)

    # Clean user solution lines
    cleaned_user_solution = [line for line in user_solution if line.strip()]
    cleaned_user_solution_str = "\n".join(cleaned_user_solution)
       
    # If no OpenAI API key is available, use a fallback method
    if not openai.api_key:
        return generate_fallback_feedback(correct_lines, cleaned_user_solution)
    
    try:
        # Create a prompt for the AI
        prompt = f"""
        I'm helping a student learn programming through Parsons problems (code reordering exercises).
        
        The correct solution is:
        ```python
        {correct_lines_str}
        ```
        
        The student's current attempt is:
        ```python
        {cleaned_user_solution_str}
        ```
        
        Please provide Socratic-style feedback - guide the student with questions rather than giving away the answer.
        Focus on conceptual understanding and logical flow. Help them discover where their solution might be incorrect.
        
        Important:
        - Don't directly tell them the correct order
        - Ask thought-provoking questions that lead them to discover errors
        - Focus on one or two key issues, not everything at once
        - Be encouraging and positive
        - Keep your response brief and targeted (2-3 sentences, with 1-2 questions)
        """
        
        feedback = get_openai_response(
            [
                {"role": "system", "content": "You are a helpful programming tutor using the Socratic method."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=200,
            temperature=0.7,
        )
        return feedback
    except Exception as e:
        print(f"OpenAI API error: {str(e)}")
        return generate_fallback_feedback(correct_lines, cleaned_user_solution)

def generate_chat_response(
    problem_settings: Dict[str, Any], 
    user_solution: List[str],
    chat_history: List[Dict[str, Any]],
    current_message: str,
    solution_context=None
) -> str:
    """
    Generates a conversational, context-aware response for chat-based tutoring.
    Enhanced with deeper problem analysis and conversation progression.
    Now accepts solution_context from frontend for consistency.
    """
    # If no OpenAI API key is available, use fallback
    if not openai.api_key:
        return generate_chat_fallback_enhanced(current_message, user_solution, problem_settings, chat_history)
    
    try:
        # Enhanced analysis of the current state
        solution_analysis = analyze_solution_state_enhanced(
            problem_settings, 
            user_solution,
            solution_context
        )
        print(f"Solution analysis: {json.dumps(solution_analysis, indent=2)}")
        
        # Build conversation context with progression tracking
        conversation_context = build_conversation_context_enhanced(chat_history)
        
        # Analyze the student's current message for intent and topic
        message_analysis = analyze_student_message(current_message, solution_analysis)
        
        # Create a sophisticated prompt for chat response
        prompt = create_chat_prompt_enhanced(
            problem_settings, 
            user_solution, 
            current_message, 
            conversation_context,
            solution_analysis,
            message_analysis
        )
        
        ai_response = get_openai_response(
            [
                {
                    "role": "system",
                    "content": """You are an expert programming tutor specializing in Python and Parsons problems. Your teaching philosophy:

TEACHING APPROACH:
- Socratic Method: Guide discovery through strategic questions
- Diagnostic → Analytical → Guidance progression
- Build on previous conversation naturally
- Address specific code issues with concrete examples
- Encourage metacognitive thinking about programming

CONVERSATION STYLE:
- Reference student's specific solution attempts
- Build on what they've already discussed
- Use their own words and examples when possible
- Progress from general concepts to specific implementation
- Celebrate insights and progress

TECHNICAL EXPERTISE:
- Deep understanding of Python syntax and semantics
- Expert in code structure, indentation, and logical flow
- Skilled at identifying common programming misconceptions
- Able to provide step-by-step reasoning for code organization"""
                },
                {"role": "user", "content": prompt}
            ],
            max_tokens=350,
            temperature=0.75,
            presence_penalty=0.2,
            frequency_penalty=0.1
        )
        
        # Post-process for conversation quality
        processed_response = post_process_chat_response_enhanced(
            ai_response, 
            current_message, 
            conversation_context,
            solution_analysis
        )
        
        return processed_response
        
    except Exception as e:
        print(f"Chat API error: {str(e)}")
        return generate_chat_fallback_enhanced(
            current_message, 
            user_solution, 
            problem_settings, 
            chat_history
        )

# TODO: use front end solutionStatus instead of checking everything again here
def analyze_solution_state_enhanced(problem_settings: Dict[str, Any], user_solution: List[str], solution_context=None) -> Dict[str, Any]:
    """
    Enhanced analysis of the current state of the student's solution with detailed problem context.
    Now accepts optional solution_context from frontend to ensure consistency.
    """
    initial_code = problem_settings["initial"]
    correct_lines = [line for line in initial_code.split('\n') if line.strip() and '#distractor' not in line]
    
    # Clean user solution
    cleaned_user_solution = [line for line in user_solution if line.strip()]
    
    # Use frontend validation if provided
    if solution_context:
        # Override our analysis with frontend data
        has_indentation_issues = solution_context.get('solutionStatus') == 'indentation-issues'
        is_correct = solution_context.get('isCorrect', None)
    else:
        # Continue with backend analysis
        has_indentation_issues = False
        is_correct = None
        
        # Check indentation using the same logic as the frontend
        correct_indent_map = {}
        for line in correct_lines:
            content = line.strip()
            if content:
                indent_level = (len(line) - len(line.lstrip())) // 4
                correct_indent_map[content] = indent_level
        
        # Compare with user solution
        for user_line in user_solution:
            content = user_line.strip()
            if not content:
                continue
                
            expected_indent = correct_indent_map.get(content)
            if expected_indent is not None:
                user_indent = (len(user_line) - len(user_line.lstrip())) // 4
                if user_indent != expected_indent:
                    has_indentation_issues = True
                    break
    
    # Basic analysis
    analysis = {
        "has_solution": len(cleaned_user_solution) > 0,
        "solution_length": len(cleaned_user_solution),
        "expected_length": len(correct_lines),
        "is_complete": len(cleaned_user_solution) >= len(correct_lines),
        "completion_ratio": len(cleaned_user_solution) / max(len(correct_lines), 1),
        "has_indentation_issues": has_indentation_issues,
        "missing_concepts": [],
        "correct_concepts": [],
        "error_types": [],
        "specific_issues": [],
        "code_structure_analysis": {},
        "comparison_with_correct": {}
    }
    
    # Detailed indentation analysis
    analysis["has_indentation_issues"] = False  # Default to no issues
    
    # Check indentation using the same logic as the frontend
    initial_code = problem_settings["initial"]
    correct_lines = [line for line in initial_code.split('\n') if line.strip() and '#distractor' not in line]
    
    # Create map of correct indentation for each line
    correct_indent_map = {}
    for line in correct_lines:
        content = line.strip()
        if content:
            indent_level = (len(line) - len(line.lstrip())) // 4
            correct_indent_map[content] = indent_level
    
    # Compare with user solution
    for user_line in user_solution:
        content = user_line.strip()
        if not content:
            continue
            
        expected_indent = correct_indent_map.get(content)
        if expected_indent is not None:
            user_indent = (len(user_line) - len(user_line.lstrip())) // 4
            if user_indent != expected_indent:
                analysis["has_indentation_issues"] = True
                break
    
    # Programming concept analysis
    solution_text = ' '.join(cleaned_user_solution).lower()
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
    
    for concept, details in concepts.items():
        has_in_solution = any(keyword in solution_text for keyword in details["keywords"])
        has_in_correct = any(keyword in correct_text for keyword in details["keywords"])
        
        if has_in_solution and has_in_correct:
            analysis["correct_concepts"].append(concept)
        elif has_in_correct and not has_in_solution:
            analysis["missing_concepts"].append(concept)
    
    # Detailed comparison with correct solution
    if len(cleaned_user_solution) > 0 and len(correct_lines) > 0:
        analysis["comparison_with_correct"] = compare_solutions_detailed(
            cleaned_user_solution, 
            correct_lines
        )
    
    # Error type classification
    if analysis["solution_length"] < analysis["expected_length"]:
        analysis["error_types"].append("incomplete_solution")
        analysis["specific_issues"].append(f"Missing {analysis['expected_length'] - analysis['solution_length']} code block(s)")
    elif analysis["solution_length"] > analysis["expected_length"]:
        analysis["error_types"].append("extra_blocks")
        analysis["specific_issues"].append(f"Has {analysis['solution_length'] - analysis['expected_length']} extra code block(s)")
    
    if analysis["has_indentation_issues"]:
        analysis["error_types"].append("indentation_error")
        analysis["specific_issues"].append("Indentation needs attention")
    
    if analysis["missing_concepts"]:
        analysis["error_types"].append("missing_concepts")
        analysis["specific_issues"].append(f"Missing: {', '.join(analysis['missing_concepts'])}")
    
    # Code structure analysis
    analysis["code_structure_analysis"] = analyze_code_structure(cleaned_user_solution, correct_lines)
    
    return analysis

def compare_solutions_detailed(user_solution: List[str], correct_solution: List[str]) -> Dict[str, Any]:
    """
    Provides detailed comparison between user and correct solutions.
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
        for j, correct_line in enumerate(correct_solution):
            if user_line.strip() == correct_line.strip():
                comparison["matching_lines"].append({
                    "line": user_line.strip(),
                    "user_pos": i,
                    "correct_pos": j,
                    "is_correct_position": i == j
                })
                if i != j and comparison["first_error_position"] is None:
                    comparison["first_error_position"] = i
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
                "line": user_solution[matching_positions[i][0]].strip(),
                "current_pos": matching_positions[i][0],
                "should_be_before": user_solution[matching_positions[i-1][0]].strip()
            })
    
    return comparison

def analyze_code_structure(user_solution: List[str], correct_solution: List[str]) -> Dict[str, Any]:
    """
    Analyzes the structural aspects of the code.
    """
    structure = {
        "has_function_def": False,
        "has_main_logic": False,
        "has_proper_ending": False,
        "control_flow_order": [],
        "indentation_pattern": []
    }
    
    for line in user_solution:
        stripped = line.strip().lower()
        if stripped.startswith('def '):
            structure["has_function_def"] = True
        if any(keyword in stripped for keyword in ['for ', 'while ', 'if ']):
            structure["control_flow_order"].append(stripped.split()[0])
        
        # Analyze indentation pattern
        indent_level = (len(line) - len(line.lstrip())) // 4
        structure["indentation_pattern"].append(indent_level)
    
    return structure

def build_conversation_context_enhanced(chat_history: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Enhanced conversation context building with progression tracking and topic analysis.
    """
    if not chat_history:
        return {
            "conversation_stage": "initial",
            "topics_discussed": [],
            "questions_asked": [],
            "student_understanding": "unknown",
            "teaching_progression": "diagnostic",
            "last_tutor_approach": None,
            "student_engagement_level": "unknown",
            "conversation_summary": "This is the start of our conversation."
        }
    
    # Analyze conversation progression
    context = {
        "conversation_stage": determine_conversation_stage(chat_history),
        "topics_discussed": extract_topics_discussed(chat_history),
        "questions_asked": extract_questions_asked(chat_history),
        "student_understanding": assess_student_understanding(chat_history),
        "teaching_progression": determine_teaching_progression(chat_history),
        "last_tutor_approach": analyze_last_tutor_approach(chat_history),
        "student_engagement_level": assess_engagement_level(chat_history),
        "conversation_summary": generate_conversation_summary(chat_history)
    }
    
    return context

def determine_conversation_stage(chat_history: List[Dict[str, Any]]) -> str:
    """Determine what stage of conversation we're in."""
    message_count = len(chat_history)
    
    if message_count <= 2:
        return "initial"
    elif message_count <= 6:
        return "exploration" 
    elif message_count <= 10:
        return "guided_analysis"
    else:
        return "deep_engagement"

def extract_topics_discussed(chat_history: List[Dict[str, Any]]) -> List[str]:
    """Extract the main topics that have been discussed."""
    topics = set()
    
    topic_keywords = {
        "indentation": ["indent", "indentation", "spacing", "tab", "space"],
        "functions": ["function", "def", "return", "parameter", "argument"],
        "loops": ["loop", "for", "while", "iteration", "repeat"],
        "conditionals": ["if", "else", "condition", "conditional", "elif"],
        "variables": ["variable", "assignment", "value", "assign"],
        "order": ["order", "sequence", "first", "second", "before", "after"],
        "logic": ["logic", "logical", "flow", "program flow", "algorithm"],
        "syntax": ["syntax", "grammar", "format", "structure"],
        "debugging": ["error", "bug", "wrong", "mistake", "problem", "issue"]
    }
    
    for message in chat_history:
        content = message.get('content', '').lower()
        for topic, keywords in topic_keywords.items():
            if any(keyword in content for keyword in keywords):
                topics.add(topic)
    
    return list(topics)

def extract_questions_asked(chat_history: List[Dict[str, Any]]) -> List[str]:
    """Extract the types of questions that have been asked."""
    questions = []
    
    for message in chat_history:
        if message.get('role') == 'tutor' and '?' in message.get('content', ''):
            content = message.get('content', '')
            # Categorize question types
            if any(word in content.lower() for word in ['what', 'which']):
                questions.append("what/which")
            elif any(word in content.lower() for word in ['how', 'why']):
                questions.append("how/why")
            elif any(word in content.lower() for word in ['where', 'when']):
                questions.append("where/when")
            elif 'do you think' in content.lower():
                questions.append("opinion/reflection")
            else:
                questions.append("general")
    
    return questions

def assess_student_understanding(chat_history: List[Dict[str, Any]]) -> str:
    """Assess the student's level of understanding based on their responses."""
    student_messages = [msg for msg in chat_history if msg.get('role') == 'student']
    
    if not student_messages:
        return "unknown"
    
    understanding_indicators = {
        "confused": ["confused", "don't understand", "don't get", "lost", "stuck"],
        "partial": ["I think", "maybe", "not sure", "kind of", "sort of"],
        "understanding": ["I see", "that makes sense", "I understand", "got it", "okay"],
        "confident": ["yes", "definitely", "I know", "correct", "right"]
    }
    
    recent_messages = student_messages[-3:]  # Look at last 3 student messages
    understanding_scores = {level: 0 for level in understanding_indicators}
    
    for message in recent_messages:
        content = message.get('content', '').lower()
        for level, indicators in understanding_indicators.items():
            if any(indicator in content for indicator in indicators):
                understanding_scores[level] += 1
    
    # Return the level with the highest score
    return max(understanding_scores, key=understanding_scores.get) if any(understanding_scores.values()) else "unknown"

def determine_teaching_progression(chat_history: List[Dict[str, Any]]) -> str:
    """Determine what teaching approach to use next."""
    topics = extract_topics_discussed(chat_history)
    understanding = assess_student_understanding(chat_history)
    stage = determine_conversation_stage(chat_history)
    
    if stage == "initial":
        return "diagnostic"
    elif understanding == "confused" and len(topics) < 2:
        return "diagnostic"
    elif understanding in ["partial", "understanding"] and len(topics) >= 1:
        return "analytical"
    elif understanding == "understanding" and len(topics) >= 2:
        return "guidance"
    else:
        return "diagnostic"

def analyze_last_tutor_approach(chat_history: List[Dict[str, Any]]) -> str:
    """Analyze what approach the tutor used in the last message."""
    tutor_messages = [msg for msg in chat_history if msg.get('role') == 'tutor']
    
    if not tutor_messages:
        return None
    
    last_message = tutor_messages[-1].get('content', '').lower()
    
    if '?' in last_message:
        if any(word in last_message for word in ['what', 'which', 'where']):
            return "factual_question"
        elif any(word in last_message for word in ['how', 'why']):
            return "analytical_question"
        elif 'think' in last_message:
            return "reflective_question"
        else:
            return "general_question"
    elif any(word in last_message for word in ['let me explain', 'here\'s how', 'the reason']):
        return "explanation"
    elif any(word in last_message for word in ['try', 'can you', 'let\'s']):
        return "guidance"
    else:
        return "supportive"

def assess_engagement_level(chat_history: List[Dict[str, Any]]) -> str:
    """Assess how engaged the student seems to be."""
    student_messages = [msg for msg in chat_history if msg.get('role') == 'student']
    
    if not student_messages:
        return "unknown"
    
    recent_messages = student_messages[-2:]  # Look at last 2 student messages
    
    engagement_indicators = {
        "low": ["ok", "yes", "no", "idk", "i don't know"],
        "medium": ["i think", "maybe", "not sure", "can you help"],
        "high": ["that's interesting", "i see", "can you explain", "what about", "how does"]
    }
    
    total_length = sum(len(msg.get('content', '')) for msg in recent_messages)
    avg_length = total_length / len(recent_messages) if recent_messages else 0
    
    if avg_length < 20:
        return "low"
    elif avg_length < 50:
        return "medium"
    else:
        return "high"

def generate_conversation_summary(chat_history: List[Dict[str, Any]]) -> str:
    """Generate a brief summary of the conversation so far."""
    if len(chat_history) <= 2:
        return "We've just started our conversation."
    
    topics = extract_topics_discussed(chat_history)
    understanding = assess_student_understanding(chat_history)
    
    summary = f"We've discussed {len(topics)} main topic(s)"
    if topics:
        summary += f" including {', '.join(topics[:3])}"
        if len(topics) > 3:
            summary += f" and {len(topics) - 3} more"
    
    summary += f". The student seems to be {understanding}"
    if understanding != "unknown":
        summary += " with the concepts"
    
    summary += f". We've exchanged {len(chat_history)} messages total."
    
    return summary

def analyze_student_message(current_message: str, solution_analysis: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze the student's current message for intent, topic, and emotional state.
    """
    message_lower = current_message.lower()
    
    analysis = {
        "intent": determine_message_intent(message_lower),
        "topics_mentioned": extract_message_topics(message_lower),
        "emotional_state": assess_emotional_state(message_lower),
        "specificity_level": assess_message_specificity(current_message, solution_analysis),
        "question_type": categorize_question_type(message_lower)
    }
    
    return analysis

def determine_message_intent(message_lower: str) -> str:
    """Determine what the student is trying to accomplish with their message."""
    intent_patterns = {
        "seeking_help": ["help", "stuck", "don't know", "confused", "lost"],
        "asking_clarification": ["what do you mean", "can you explain", "i don't understand"],
        "proposing_solution": ["i think", "should i", "what if", "maybe"],
        "confirming_understanding": ["so", "is this right", "does this mean"],
        "expressing_frustration": ["this is hard", "i can't", "this doesn't work"],
        "asking_specific_question": ["how do", "why does", "what does", "where should"]
    }
    
    for intent, patterns in intent_patterns.items():
        if any(pattern in message_lower for pattern in patterns):
            return intent
    
    return "general_inquiry"

def extract_message_topics(message_lower: str) -> List[str]:
    """Extract specific topics mentioned in the student's message."""
    topics = []
    
    topic_patterns = {
        "indentation": ["indent", "spacing", "tab", "space"],
        "order": ["order", "first", "second", "before", "after", "sequence"],
        "functions": ["function", "def", "return"],
        "loops": ["loop", "for", "while"],
        "conditionals": ["if", "else", "condition"],
        "variables": ["variable", "value", "assign"],
        "syntax": ["syntax", "colon", "parentheses", "bracket"],
        "logic": ["logic", "algorithm", "flow", "step"]
    }
    
    for topic, patterns in topic_patterns.items():
        if any(pattern in message_lower for pattern in patterns):
            topics.append(topic)
    
    return topics

def assess_emotional_state(message_lower: str) -> str:
    """Assess the emotional state of the student based on their message."""
    emotional_indicators = {
        "frustrated": ["frustrated", "annoying", "difficult", "hard", "can't do"],
        "confused": ["confused", "lost", "don't understand", "don't get"],
        "curious": ["interesting", "why", "how", "what if", "curious"],
        "confident": ["i think i know", "i believe", "i'm sure", "definitely"],
        "neutral": ["okay", "fine", "sure", "yes", "no"]
    }
    
    for state, indicators in emotional_indicators.items():
        if any(indicator in message_lower for indicator in indicators):
            return state
    
    return "neutral"

def assess_message_specificity(message: str, solution_analysis: Dict[str, Any]) -> str:
    """Assess how specific the student's message is."""
    if len(message) < 10:
        return "very_low"
    elif len(message) < 30:
        return "low"
    elif any(concept in message.lower() for concept in ["line", "block", "indentation", "function", "loop"]):
        return "high"
    elif len(message) > 100:
        return "very_high"
    else:
        return "medium"

def categorize_question_type(message_lower: str) -> str:
    """Categorize the type of question being asked."""
    if not any(q in message_lower for q in ['?', 'what', 'how', 'why', 'where', 'when', 'which']):
        return "not_a_question"
    
    question_types = {
        "factual": ["what is", "what does", "which"],
        "procedural": ["how do", "how can", "how should"],
        "conceptual": ["why", "why does", "why should"],
        "diagnostic": ["what's wrong", "what am i doing wrong", "where is the error"],
        "confirmational": ["is this right", "am i correct", "does this look good"]
    }
    
    for q_type, patterns in question_types.items():
        if any(pattern in message_lower for pattern in patterns):
            return q_type
    
    return "general"

def create_chat_prompt_enhanced(
    problem_settings: Dict[str, Any],
    user_solution: List[str], 
    current_message: str,
    conversation_context: Dict[str, Any],
    solution_analysis: Dict[str, Any],
    message_analysis: Dict[str, Any]
) -> str:
    """
    Creates a sophisticated, context-aware prompt for generating chat responses.
    """
    # Extract problem info
    initial_code = problem_settings["initial"]
    correct_lines = [line for line in initial_code.split('\n') if line.strip() and '#distractor' not in line]
    correct_solution = "\n".join(correct_lines)
    
    # Format user solution with detailed analysis
    if user_solution:
        user_solution_str = "\n".join([line.strip() for line in user_solution if line.strip()])
        solution_comparison = solution_analysis.get("comparison_with_correct", {})
    else:
        user_solution_str = "No solution arranged yet"
        solution_comparison = {}
    
    # Build contextual teaching strategy
    teaching_strategy = determine_response_strategy(
        conversation_context,
        solution_analysis,
        message_analysis
    )
    
    prompt = f"""
TUTORING CONTEXT:
Student is working on a Python Parsons problem (arranging code blocks in correct order).

CONVERSATION STATE:
- Stage: {conversation_context['conversation_stage']}
- Teaching Progression: {conversation_context['teaching_progression']}
- Student Understanding: {conversation_context['student_understanding']}
- Topics Discussed: {', '.join(conversation_context['topics_discussed']) if conversation_context['topics_discussed'] else 'None yet'}
- Student Engagement: {conversation_context['student_engagement_level']}
- Last Tutor Approach: {conversation_context['last_tutor_approach'] or 'None'}

CURRENT STUDENT MESSAGE ANALYSIS:
- Intent: {message_analysis['intent']}
- Topics Mentioned: {', '.join(message_analysis['topics_mentioned']) if message_analysis['topics_mentioned'] else 'None'}
- Emotional State: {message_analysis['emotional_state']}
- Question Type: {message_analysis['question_type']}
- Specificity: {message_analysis['specificity_level']}

PROBLEM SOLUTION ANALYSIS:
CORRECT SOLUTION:
```python
{correct_solution}
```

STUDENT'S CURRENT SOLUTION:
```python
{user_solution_str}
```

SOLUTION STATE:
- Completion: {solution_analysis['completion_ratio']:.1%} ({solution_analysis['solution_length']}/{solution_analysis['expected_length']} blocks)
- Error Types: {', '.join(solution_analysis['error_types']) if solution_analysis['error_types'] else 'None detected'}
- Specific Issues: {'; '.join(solution_analysis['specific_issues']) if solution_analysis['specific_issues'] else 'None identified'}
- Missing Concepts: {', '.join(solution_analysis['missing_concepts']) if solution_analysis['missing_concepts'] else 'None'}
- Correct Concepts: {', '.join(solution_analysis['correct_concepts']) if solution_analysis['correct_concepts'] else 'None'}

DETAILED COMPARISON:
{format_solution_comparison(solution_comparison)}

STUDENT'S CURRENT MESSAGE:
"{current_message}"

TEACHING STRATEGY FOR THIS RESPONSE:
{teaching_strategy['approach']} - {teaching_strategy['description']}

RESPONSE INSTRUCTIONS:
1. ACKNOWLEDGE: Reference their specific message and current solution state
2. BUILD ON CONTEXT: Connect to previous conversation naturally
3. ADDRESS SPECIFIC ISSUES: Focus on their actual code problems with concrete examples
4. USE STRATEGIC QUESTIONING: {teaching_strategy['questioning_style']}
5. MAINTAIN PROGRESSION: Move the conversation forward constructively

RESPONSE GUIDELINES:
- Reference specific lines or blocks from their solution when relevant
- Build on topics already discussed in previous messages
- Use Socratic questioning appropriate to their understanding level
- If they're confused, simplify and provide more structure
- If they're understanding, challenge them with deeper questions
- Always connect abstract concepts to their concrete code
- Celebrate progress and insights they've shown
- Guide them toward the next logical step in understanding

Keep response conversational, specific to their situation, and 2-3 sentences with 1 strategic question.
"""
    
    return prompt

def determine_response_strategy(
    conversation_context: Dict[str, Any],
    solution_analysis: Dict[str, Any],
    message_analysis: Dict[str, Any]
) -> Dict[str, str]:
    """
    Determine the optimal response strategy based on all available context.
    """
    progression = conversation_context['teaching_progression']
    understanding = conversation_context['student_understanding']
    emotional_state = message_analysis['emotional_state']
    intent = message_analysis['intent']
    
    # Strategic decision tree
    if emotional_state == "frustrated":
        return {
            "approach": "supportive_simplification",
            "description": "Provide emotional support and break down into simpler steps",
            "questioning_style": "Use gentle, encouraging questions that build confidence"
        }
    
    elif intent == "seeking_help" and understanding == "confused":
        return {
            "approach": "diagnostic_scaffolding", 
            "description": "Identify specific confusion points and provide structured guidance",
            "questioning_style": "Ask targeted questions to pinpoint misunderstanding"
        }
    
    elif progression == "diagnostic" and solution_analysis['solution_length'] == 0:
        return {
            "approach": "initial_exploration",
            "description": "Help student understand the problem and identify first steps",
            "questioning_style": "Ask broad questions about program purpose and logic"
        }
    
    elif progression == "analytical" and solution_analysis['error_types']:
        return {
            "approach": "error_analysis",
            "description": "Guide student to analyze their specific errors",
            "questioning_style": "Ask questions that help them discover their own mistakes"
        }
    
    elif understanding == "understanding" and progression == "guidance":
        return {
            "approach": "solution_refinement",
            "description": "Help student perfect their solution and deepen understanding",
            "questioning_style": "Ask questions that encourage reflection and extension"
        }
    
    else:
        return {
            "approach": "adaptive_response",
            "description": "Respond flexibly based on immediate context",
            "questioning_style": "Use contextually appropriate questions"
        }

def format_solution_comparison(comparison: Dict[str, Any]) -> str:
    """
    Format the solution comparison for inclusion in the prompt.
    """
    if not comparison:
        return "No detailed comparison available yet."
    
    parts = []
    
    if comparison.get("matching_lines"):
        correct_positions = sum(1 for match in comparison["matching_lines"] if match["is_correct_position"])
        total_matches = len(comparison["matching_lines"])
        parts.append(f"Correctly placed: {correct_positions}/{total_matches} matching lines")
    
    if comparison.get("missing_lines"):
        parts.append(f"Missing: {len(comparison['missing_lines'])} required lines")
    
    if comparison.get("extra_lines"):
        parts.append(f"Extra: {len(comparison['extra_lines'])} unnecessary lines")
    
    if comparison.get("order_issues"):
        parts.append(f"Order issues: {len(comparison['order_issues'])} lines in wrong position")
    
    if comparison.get("first_error_position") is not None:
        parts.append(f"First error at position: {comparison['first_error_position']}")
    
    return "; ".join(parts) if parts else "No specific issues identified in comparison."

def post_process_chat_response_enhanced(
    ai_response: str, 
    student_message: str, 
    conversation_context: Dict[str, Any],
    solution_analysis: Dict[str, Any]
) -> str:
    """
    Enhanced post-processing of the AI response to ensure quality and appropriateness.
    """
    # Clean up any formatting issues
    response = ai_response.strip()
    
    # Ensure the response isn't too long (split if needed)
    if len(response) > 600:
        sentences = re.split(r'[.!?]', response)
        # Keep first 3-4 sentences
        response = '. '.join(sentences[:4]).strip() + '.'
    
    # Ensure it ends with proper punctuation
    if response and response[-1] not in '.!?':
        response += '.'
    
    # Check for repetition with previous messages
    topics_discussed = conversation_context.get('topics_discussed', [])
    last_approach = conversation_context.get('last_tutor_approach', '')
    
    # If we're repeating the same approach too much, add variety
    if last_approach == "factual_question" and response.count('?') > 0:
        if any(word in response.lower() for word in ['what', 'which']) and len(topics_discussed) > 2:
            # Add some explanation before the question
            question_start = response.find('?')
            if question_start > 0:
                question = response[response.rfind('.', 0, question_start) + 1:question_start + 1].strip()
                explanation = response[:response.rfind('.', 0, question_start) + 1].strip()
                if explanation:
                    response = f"{explanation} Let me help you think through this. {question}"
    
    # Ensure response addresses the student's emotional state
    emotional_state = solution_analysis.get('emotional_state', 'neutral')
    if emotional_state == "frustrated" and not any(word in response.lower() for word in ['understand', 'okay', 'let\'s', 'together']):
        response = "I understand this can be challenging. " + response
    elif emotional_state == "confident" and not any(word in response.lower() for word in ['great', 'good', 'excellent', 'right']):
        response = "You're on the right track! " + response
    
    # If response is too short or generic, enhance it
    if len(response) < 30 or response.lower() in ['yes.', 'no.', 'ok.', 'sure.', 'that\'s right.']:
        if solution_analysis.get('has_solution', False):
            response += " Looking at your current solution, what do you think about the logical flow of the steps?"
        else:
            response += " What's your first thought about how to approach this problem?"
    
    return response

def generate_chat_fallback_enhanced(
    current_message: str, 
    user_solution: List[str], 
    problem_settings: Dict[str, Any], 
    chat_history: List[Dict[str, Any]]
) -> str:
    """
    Enhanced fallback response generation when AI API is unavailable.
    """
    message_lower = current_message.lower()
    
    # Check conversation history for context
    topics_discussed = set()
    if chat_history:
        for msg in chat_history[-4:]:  # Look at recent messages
            content = msg.get('content', '').lower()
            if 'indent' in content:
                topics_discussed.add('indentation')
            if any(word in content for word in ['order', 'sequence', 'first']):
                topics_discussed.add('order')
            if any(word in content for word in ['function', 'def']):
                topics_discussed.add('functions')
    
    # Generate contextual response based on message and history
    if 'indent' in message_lower:
        if 'indentation' in topics_discussed:
            return "We've talked about indentation before. Remember, Python uses indentation to show which lines belong together - like how you indent paragraphs in an essay. Looking at your current blocks, which ones do you think should be grouped together?"
        else:
            return "Indentation in Python is like organizing your thoughts in an outline. Lines that belong to the same 'group' (like inside a function or if statement) should be indented the same amount. What do you notice about the structure of your code blocks?"
    
    elif any(word in message_lower for word in ['order', 'sequence', 'first', 'next']):
        if 'order' in topics_discussed:
            return "You're continuing to think about the logical order - that's exactly right! Think about this like giving directions to a friend. What would need to happen before the step you're looking at can work?"
        else:
            return "Great question about order! Programming is like writing a recipe - some steps must happen before others. What do you think this program is trying to accomplish overall?"
    
    elif any(word in message_lower for word in ['function', 'def', 'return']):
        return "Functions are like little machines that take inputs and produce outputs. In your blocks, the 'def' line is like setting up the machine, and 'return' is like the machine giving you back the result. Where do you think each part should go?"
    
    elif any(word in message_lower for word in ['loop', 'for', 'while']):
        return "Loops repeat code multiple times. The code inside the loop should be indented. What's confusing you about the loop in this problem?"
    
    elif any(word in message_lower for word in ['help', 'stuck', 'confused']):
        if len(user_solution) == 0:
            return "No worries - everyone starts somewhere! Look at all your code blocks and think: if this were a story, what would happen first? What's the opening scene of this program?"
        elif len(topics_discussed) > 1:
            return f"You've been doing great thinking about {' and '.join(list(topics_discussed)[:2])}. Sometimes it helps to step back and ask: what is this program's main job? Once you're clear on that, the order often becomes clearer."
        else:
            return "Let's break this down step by step. Looking at your current arrangement, does the order make sense if you were explaining it to a friend? What feels out of place?"
    
    elif any(word in message_lower for word in ['right', 'correct', 'good']):
        if 'functions' in topics_discussed:
            return "You're thinking well about the structure! Functions need their pieces in the right order too. What do you think should happen inside the function before it can return a result?"
        else:
            return "You're asking the right questions! Take a look at what you have so far. If you were reading this code out loud, would it sound like a logical sequence of steps?"
    
    else:
        # Contextual generic response based on solution state
        if len(user_solution) == 0:
            return "I'm here to help you work through this step by step! What's your first instinct about which block should go first? There's no wrong answer - just tell me what you're thinking."
        elif len(user_solution) < 3:
            return "You've made a good start! Look at what you have so far and think about what should come next. What does the program need to do after these first steps?"
        else:
            return "You're making progress! Step back and read through your current solution. Does it tell a clear 'story' of what the program should do? What part feels like it might be in the wrong place?"

def generate_fallback_feedback(correct_lines: List[str], user_solution: List[str]) -> str:
    """
    Generates simple feedback without using AI when the API is unavailable.
    This is the ORIGINAL fallback function - preserved for backwards compatibility.
    """
    # Compare length first
    if len(user_solution) != len(correct_lines):
        return "I notice your solution has a different number of lines than expected. Have you included all the necessary code blocks? Are there any blocks that might not belong?"
    
    # Find the first mismatch
    for i, (user_line, correct_line) in enumerate(zip(user_solution, correct_lines)):
        if user_line != correct_line:
            # Try to give a hint based on the type of mismatch
            if i == 0:
                return "I'm looking at the very first line of your solution. Is this the right place to start? What should happen first in this program?"
            
            # Check if it's a control structure mismatch
            if any(keyword in correct_line for keyword in ["if", "for", "while", "def"]):
                return f"Take a look at line {i+1} of your solution. Should this be a control structure? What would be the logical flow at this point in the program?"
            
            # Check if it's likely a logic/algorithm step
            if "=" in correct_line or "return" in correct_line:
                return f"Consider line {i+1}. What operation needs to happen at this point in the program? What values do we need to calculate or return?"
            
            # Generic feedback
            return f"I'm noticing an issue around line {i+1}. What do you think should happen at this point in the program flow?"
    
    # Should not reach here if validation determined the solution is incorrect
    return "I see some issues with your solution. Can you review the logical flow of your program? What should happen first, and what operations follow?"

def generate_chat_fallback(current_message: str, user_solution: List[str], problem_settings: Dict[str, Any]) -> str:
    """
    Generates a helpful fallback response when the AI API is unavailable.
    This is the ORIGINAL chat fallback function - preserved for backwards compatibility.
    """
    message_lower = current_message.lower()
    
    # Analyze what the student is asking about
    if 'indent' in message_lower:
        return "Indentation in Python shows which lines belong together. Lines that are part of the same block (like inside a function or if statement) should have the same indentation. What part of indentation are you finding confusing?"
    
    elif 'order' in message_lower or 'sequence' in message_lower:
        return "Code order is important! Think about what needs to happen first in your program. What do you think should be the very first step?"
    
    elif 'function' in message_lower or 'def' in message_lower:
        return "Functions are defined with 'def' and contain code that runs when the function is called. What do you want to know about functions in this problem?"
    
    elif 'loop' in message_lower or 'for' in message_lower:
        return "Loops repeat code multiple times. The code inside the loop should be indented. What's confusing you about the loop in this problem?"
    
    elif 'help' in message_lower or 'confused' in message_lower or 'stuck' in message_lower:
        if len(user_solution) == 0:
            return "I'm here to help! Start by dragging some code blocks to the solution area. What do you think should go first?"
        else:
            return "Let's work through this step by step. Look at your current arrangement - does the order make logical sense for what the program should do?"
    
    elif 'start' in message_lower or 'begin' in message_lower:
        return "Great question! Think about what a program needs to do first. Usually, that means setting up variables or defining functions. What do you see in the code blocks that might need to happen first?"
    
    else:
        # Generic helpful response
        return "I'm here to help you with this Python problem! Can you tell me more specifically what you're trying to figure out? I can help with code order, indentation, or Python concepts."

# Unified OpenAI chat completion for both v1.x and pre-v1.0 clients

def get_openai_response(messages, max_tokens=200, temperature=0.7, **kwargs):
    """
    OpenAI v1.x chat completion using OpenRouter or OpenAI endpoint.
    """
    client = openai.OpenAI(
        api_key=os.getenv("OPENROUTER_API_KEY"),
        base_url="https://openrouter.ai/api/v1"
    )
    response = client.chat.completions.create(
        model='qwen/qwen-2.5-coder-32b-instruct:free',
        messages=messages,
        max_tokens=max_tokens,
        temperature=temperature,
        **kwargs
    )
    return response.choices[0].message.content.strip()