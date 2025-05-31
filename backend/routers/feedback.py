from fastapi import APIRouter, HTTPException
from models import (
    FeedbackRequest, 
    FeedbackResponse, 
    ChatFeedbackRequest, 
    ChatFeedbackResponse,
    ChatMessage,
    SolutionValidation
)
from services.feedback_generator import generate_feedback, generate_chat_response
from services.solution_validator import validate_solution
from routers.problems import load_problems
import traceback
import uuid
from datetime import datetime

router = APIRouter()

@router.post("", response_model=FeedbackResponse)
async def get_feedback(request: FeedbackRequest):
    """
    Generate AI-based Socratic feedback for a student's solution attempt.
    
    This is the ORIGINAL endpoint - preserved for backwards compatibility.
    """
    # Get the problem
    problems = load_problems()
    problem = next((p for p in problems if p["id"] == request.problemId), None)
    
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    # Generate feedback
    try:
        feedback = generate_feedback(
            problem["parsonsSettings"], 
            request.userSolution
        )
        
        return {"feedback": feedback}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate feedback: {str(e)}"
        )

@router.post("/chat", response_model=ChatFeedbackResponse)
async def get_chat_feedback(request: ChatFeedbackRequest):
    """
    Generate conversational, context-aware feedback for chat-based tutoring.
    
    This endpoint:
    - Accepts chat history for context-aware responses
    - Generates conversational tutoring responses
    - Includes traditional feedback validation
    - Returns structured chat response format
    """
    try:
        # Validate request
        if not request.problemId:
            raise HTTPException(status_code=400, detail="Problem ID is required")
        
        if not request.currentMessage or not request.currentMessage.strip():
            raise HTTPException(status_code=400, detail="Current message cannot be empty")
        
        # Get the problem
        problems = load_problems()
        problem = next((p for p in problems if p["id"] == request.problemId), None)
        
        if not problem:
            raise HTTPException(status_code=404, detail="Problem not found")
        
        # Validate chat history format
        validated_chat_history = []
        for msg in request.chatHistory:
            if not isinstance(msg, dict):
                # Convert ChatMessage object to dict
                validated_chat_history.append({
                    "id": msg.id if hasattr(msg, 'id') else str(uuid.uuid4()),
                    "role": msg.role if hasattr(msg, 'role') else "student",
                    "content": msg.content if hasattr(msg, 'content') else "",
                    "timestamp": msg.timestamp if hasattr(msg, 'timestamp') else int(datetime.now().timestamp() * 1000)
                })
            else:
                validated_chat_history.append(msg)
        
        # Generate chat response
        try:
            chat_response_content = generate_chat_response(
                problem["parsonsSettings"],
                request.userSolution,
                validated_chat_history,
                request.currentMessage
            )
        except Exception as chat_error:
            print(f"Chat generation error: {chat_error}")
            # Fallback to simple response if chat generation fails
            chat_response_content = "I'm here to help! Can you tell me more about what you're trying to figure out with this problem?"
        
        # Create the response chat message
        response_chat_message = ChatMessage(
            id=f"chat_{int(datetime.now().timestamp() * 1000)}_{uuid.uuid4().hex[:8]}",
            role="tutor",
            content=chat_response_content,
            timestamp=int(datetime.now().timestamp() * 1000),
            isTyping=False
        )
        
        # Generate traditional feedback if user has a solution
        traditional_feedback = None
        solution_validation = None
        
        if request.userSolution and len(request.userSolution) > 0:
            try:
                # Get traditional feedback
                traditional_feedback = generate_feedback(
                    problem["parsonsSettings"],
                    request.userSolution
                )
                
                # Validate solution
                validation_result = validate_solution(
                    problem["parsonsSettings"],
                    request.userSolution
                )
                
                solution_validation = SolutionValidation(
                    isCorrect=validation_result["isCorrect"],
                    details=validation_result["details"]
                )
                
            except Exception as feedback_error:
                print(f"Traditional feedback error: {feedback_error}")
                # Don't fail the whole request if traditional feedback fails
                traditional_feedback = "Unable to generate traditional feedback at this time."
                solution_validation = SolutionValidation(
                    isCorrect=False,
                    details="Unable to validate solution at this time."
                )
        
        # Build response
        response = ChatFeedbackResponse(
            success=True,
            message="Chat response generated successfully",
            chatMessage=response_chat_message,
            traditionalFeedback=traditional_feedback,
            solutionValidation=solution_validation
        )
        
        return response
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log the full error for debugging
        print(f"Unexpected error in chat feedback: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        
        # Create a fallback response
        fallback_message = ChatMessage(
            id=f"error_{int(datetime.now().timestamp() * 1000)}",
            role="tutor",
            content="I apologize, but I encountered an error. Please try asking your question again, or let me know if you need help with a specific part of the problem.",
            timestamp=int(datetime.now().timestamp() * 1000),
            isTyping=False
        )
        
        return ChatFeedbackResponse(
            success=False,
            message=f"Error generating chat response: {str(e)}",
            chatMessage=fallback_message,
            traditionalFeedback=None,
            solutionValidation=None
        )

@router.get("/health")
async def health_check():
    """
    Simple health check endpoint for testing API availability.
    """
    return {
        "status": "healthy",
        "service": "feedback_router",
        "endpoints": [
            "/api/feedback (POST) - Original feedback endpoint",
            "/api/feedback/chat (POST) - New chat feedback endpoint",
            "/api/feedback/health (GET) - This health check"
        ],
        "timestamp": int(datetime.now().timestamp() * 1000)
    }