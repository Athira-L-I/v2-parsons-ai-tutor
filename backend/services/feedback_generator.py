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
    cleaned_user_solution = [line.strip() for line in user_solution if line.strip()]
    cleaned_user_solution_str = "\n".join(cleaned_user_solution)
    
    # If no OpenAI API key is available, use a fallback method
    if not openai.api_key:
        return generate_fallback_feedback(correct_lines, cleaned_user_solution)
    
    try:
        # Create a prompt for the AI
        prompt = f"""
        I'm helping a student learn python programming through Parsons problems (code reordering exercises).
        
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
        
        # Call the OpenAI API
        client = openai.OpenAI(base_url="https://openrouter.ai/api/v1", api_key=openai.api_key)
        response = client.chat.completions.create(
            model='qwen/qwen-2.5-coder-32b-instruct:free',
            messages=[
                {"role": "system", "content": "You are a helpful python programming tutor using the Socratic method."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=200,  # Keep responses concise
            temperature=0.7,  # Some creativity but not too random
        )
        
        # Extract and return the generated feedback
        feedback = response.choices[0].message.content.strip()
        return feedback
    
    except Exception as e:
        # If API call fails, use the fallback method
        print(f"OpenAI API error: {str(e)}")
        return generate_fallback_feedback(correct_lines, cleaned_user_solution)

def generate_chat_response(
    problem_settings: Dict[str, Any], 
    user_solution: List[str],
    chat_history: List[Dict[str, Any]],
    current_message: str
) -> str:
    """
    Generates a conversational, context-aware response for chat-based tutoring.
    
    Args:
        problem_settings: The ParsonsSettings of the problem
        user_solution: The user's current solution as a list of code lines
        chat_history: Previous messages in the conversation
        current_message: The student's current question/message
    
    Returns:
        A string containing a conversational, educational response
    """
    # If no OpenAI API key is available, use fallback
    if not openai.api_key:
        return generate_chat_fallback(current_message, user_solution, problem_settings)
    
    try:
        # Analyze the current state
        solution_analysis = analyze_solution_state(problem_settings, user_solution)
        
        # Build conversation context from chat history
        conversation_context = build_conversation_context(chat_history)
        
        # Create a sophisticated prompt for chat response
        prompt = create_chat_prompt(
            problem_settings, 
            user_solution, 
            current_message, 
            conversation_context,
            solution_analysis
        )
        
        # Call OpenAI API with conversation-optimized settings
        client = openai.OpenAI(base_url="https://openrouter.ai/api/v1", api_key=openai.api_key)
        response = client.chat.completions.create(
            model='qwen/qwen-2.5-coder-32b-instruct:free',
            messages=[
                {
                    "role": "system", 
                    "content": """You are an expert programming tutor specializing in Python and Parsons problems. Your teaching style is:
                    - Socratic: Ask questions to guide students to discover answers
                    - Encouraging: Always positive and supportive
                    - Focused: Address one concept at a time
                    - Practical: Give concrete, actionable advice
                    - Conversational: Respond naturally like a human tutor
                    
                    You help students understand not just what to do, but WHY it works that way."""
                },
                {"role": "user", "content": prompt}
            ],
            max_tokens=300,  # Allow longer responses for conversation
            temperature=0.8,  # More conversational and varied
            presence_penalty=0.1,  # Slightly encourage new topics
            frequency_penalty=0.1   # Slightly discourage repetition
        )
        
        # Extract and clean the response
        ai_response = response.choices[0].message.content.strip()
        
        # Post-process the response to ensure it's appropriate
        processed_response = post_process_chat_response(ai_response, current_message)
        
        return processed_response
        
    except Exception as e:
        print(f"Chat API error: {str(e)}")
        # Fall back to simpler chat response
        return generate_chat_fallback(current_message, user_solution, problem_settings)

def analyze_solution_state(problem_settings: Dict[str, Any], user_solution: List[str]) -> Dict[str, Any]:
    """
    Analyzes the current state of the student's solution.
    
    Returns:
        Dict containing analysis of solution completeness, correctness, common issues
    """
    initial_code = problem_settings["initial"]
    correct_lines = [line for line in initial_code.split('\n') if line.strip() and '#distractor' not in line]
    
    # Clean user solution
    cleaned_user_solution = [line.strip() for line in user_solution if line.strip()]
    
    analysis = {
        "has_solution": len(cleaned_user_solution) > 0,
        "solution_length": len(cleaned_user_solution),
        "expected_length": len(correct_lines),
        "is_complete": len(cleaned_user_solution) >= len(correct_lines),
        "has_indentation_issues": False,
        "missing_concepts": [],
        "correct_concepts": []
    }
    
    # Check for indentation issues (simplified)
    for line in user_solution:
        if line.startswith('    ') or line.startswith('\t'):
            analysis["has_indentation_issues"] = True
            break
    
    # Check for key programming concepts
    solution_text = ' '.join(cleaned_user_solution).lower()
    concepts = {
        "functions": ["def ", "return"],
        "loops": ["for ", "while "],
        "conditionals": ["if ", "else", "elif"],
        "variables": ["="],
        "output": ["print("]
    }
    
    for concept, keywords in concepts.items():
        if any(keyword in solution_text for keyword in keywords):
            analysis["correct_concepts"].append(concept)
        elif any(keyword in ' '.join(correct_lines).lower() for keyword in keywords):
            analysis["missing_concepts"].append(concept)
    
    return analysis

def build_conversation_context(chat_history: List[Dict[str, Any]]) -> str:
    """
    Builds a summary of the conversation context from chat history.
    
    Returns:
        String summarizing the conversation so far
    """
    if not chat_history:
        return "This is the start of our conversation."
    
    # Get recent messages (last 6 messages to keep context manageable)
    recent_messages = chat_history[-6:] if len(chat_history) > 6 else chat_history
    
    context_parts = []
    student_topics = []
    
    for msg in recent_messages:
        role = msg.get('role', '')
        content = msg.get('content', '').lower()
        
        if role == 'student':
            # Extract key topics the student has asked about
            if 'indent' in content:
                student_topics.append('indentation')
            elif 'loop' in content or 'for' in content:
                student_topics.append('loops')
            elif 'function' in content or 'def' in content:
                student_topics.append('functions')
            elif 'order' in content or 'sequence' in content:
                student_topics.append('code order')
            elif 'help' in content or 'confused' in content:
                student_topics.append('general help')
    
    if student_topics:
        context_parts.append(f"The student has asked about: {', '.join(set(student_topics))}")
    
    context_parts.append(f"We've exchanged {len(recent_messages)} messages in this conversation.")
    
    return ' '.join(context_parts)

def create_chat_prompt(
    problem_settings: Dict[str, Any],
    user_solution: List[str], 
    current_message: str,
    conversation_context: str,
    solution_analysis: Dict[str, Any]
) -> str:
    """
    Creates a sophisticated prompt for generating chat responses.
    """
    # Extract problem info
    initial_code = problem_settings["initial"]
    correct_lines = [line for line in initial_code.split('\n') if line.strip() and '#distractor' not in line]
    correct_solution = "\n".join(correct_lines)
    
    # Format user solution
    if user_solution:
        user_solution_str = "\n".join([line.strip() for line in user_solution if line.strip()])
    else:
        user_solution_str = "No solution arranged yet"
    
    # Build analysis summary
    analysis_summary = []
    if solution_analysis["has_solution"]:
        analysis_summary.append(f"Student has arranged {solution_analysis['solution_length']} lines")
        if solution_analysis["has_indentation_issues"]:
            analysis_summary.append("Indentation needs attention")
        if solution_analysis["missing_concepts"]:
            analysis_summary.append(f"Missing concepts: {', '.join(solution_analysis['missing_concepts'])}")
    else:
        analysis_summary.append("Student hasn't started arranging code yet")
    
    prompt = f"""
            CONTEXT:
            I'm tutoring a student working on a Python Parsons problem (drag-and-drop code arrangement).

            CONVERSATION HISTORY:
            {conversation_context}

            PROBLEM - CORRECT SOLUTION:
            ```python
            {correct_solution}

            STUDENT'S CURRENT ARRANGEMENT:
            python{user_solution_str}

            SOLUTION ANALYSIS:
            {' | '.join(analysis_summary)}
            STUDENT'S CURRENT MESSAGE:
            "{current_message}"
            INSTRUCTIONS:
            Respond as a friendly, knowledgeable Python tutor. The student just asked you something - respond directly to their question while being helpful about their Parsons problem.
            GUIDELINES:

            Answer their specific question first
            If relevant, guide them with Socratic questions about their code arrangement
            Be conversational and encouraging
            Don't give away the complete answer - help them discover it
            Focus on Python concepts that help with this problem
            If they seem stuck, offer a small hint or ask a leading question
            Keep responses to 2-3 sentences with maybe 1 question

            Remember: You're having a conversation, not giving a lecture. Be natural and helpful!
            """
    return prompt


def post_process_chat_response(ai_response: str, student_message: str) -> str:
    """
    Post-processes the AI response to ensure it's appropriate and helpful.
    """
    # Clean up any formatting issues
    response = ai_response.strip()
    # Ensure the response isn't too long (split if needed)
    if len(response) > 500:
        sentences = re.split(r'[.!?]', response)
        # Keep first 2-3 sentences
        response = '. '.join(sentences[:3]).strip() + '.'

    # Ensure it ends with proper punctuation
    if response and response[-1] not in '.!?':
        response += '.'

    # If response is too short or generic, add a helpful follow-up
    if len(response) < 20 or response.lower() in ['yes.', 'no.', 'ok.', 'sure.']:
        response += " What specific part would you like me to explain more?"

    return response
def generate_chat_fallback(current_message: str, user_solution: List[str], problem_settings: Dict[str, Any]) -> str:
    """
    Generates a helpful fallback response when the AI API is unavailable.
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