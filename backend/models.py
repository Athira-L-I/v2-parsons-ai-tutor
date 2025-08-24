from pydantic import BaseModel, validator
from typing import List, Dict, Optional, Union, Any, Literal

class ParsonsOptions(BaseModel):
    sortableId: Optional[str] = None
    trashId: Optional[str] = None
    max_wrong_lines: Optional[int] = None
    can_indent: Optional[bool] = None
    vartests: Optional[List[Dict[str, Any]]] = None
    grader: Optional[str] = None
    executable_code: Optional[str] = None
    programmingLang: Optional[str] = None
    unittests: Optional[str] = None
    x_indent: Optional[int] = None
    exec_limit: Optional[int] = None
    unittest_code_prepend: Optional[str] = None
    show_feedback: Optional[bool] = None
    lang: Optional[str] = None

class ParsonsSettings(BaseModel):
    initial: str
    options: ParsonsOptions

class Problem(BaseModel):
    id: str
    title: str
    description: str
    difficulty: str
    tags: List[str]
    parsonsSettings: ParsonsSettings
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

class ProblemList(BaseModel):
    problems: List[Problem]

class SourceCodeUpload(BaseModel):
    sourceCode: str

class SolutionSubmission(BaseModel):
    problemId: str
    solution: List[str] = []  # Default to empty list if not provided
    solutionContext: Optional[Dict[str, Any]] = None
    
    @validator('solution')
    def validate_solution(cls, v):
        """Ensure solution is a list, even if empty"""
        if v is None:
            return []
        return v

class SolutionValidation(BaseModel):
    isCorrect: bool
    details: Optional[str] = None

class FeedbackRequest(BaseModel):
    problemId: str
    userSolution: List[str]
    solutionContext: Optional[Dict[str, Any]] = None

class FeedbackResponse(BaseModel):
    feedback: str

# New chat models
class ChatMessage(BaseModel):
    id: str
    role: Literal["student", "tutor"]
    content: str
    timestamp: int
    isTyping: Optional[bool] = False

    @validator('role')
    def validate_role(cls, v):
        if v not in ['student', 'tutor']:
            raise ValueError('Role must be either "student" or "tutor"')
        return v

    @validator('content')
    def validate_content(cls, v):
        if not isinstance(v, str):
            raise ValueError('Content must be a string')
        return v

    @validator('timestamp')
    def validate_timestamp(cls, v):
        if not isinstance(v, int) or v < 0:
            raise ValueError('Timestamp must be a positive integer')
        return v

class ChatFeedbackRequest(BaseModel):
    problemId: str
    userSolution: List[str]
    chatHistory: List[ChatMessage]
    currentMessage: str
    solutionContext: Optional[Dict[str, Any]] = None 

    @validator('chatHistory')
    def validate_chat_history(cls, v):
        if not isinstance(v, list):
            raise ValueError('Chat history must be a list')
        return v

    @validator('currentMessage')
    def validate_current_message(cls, v):
        if not isinstance(v, str) or len(v.strip()) == 0:
            raise ValueError('Current message must be a non-empty string')
        return v.strip()

    @validator('userSolution')
    def validate_user_solution(cls, v):
        if not isinstance(v, list):
            raise ValueError('User solution must be a list')
        return v

class ChatFeedbackResponse(BaseModel):
    success: bool
    message: str
    chatMessage: ChatMessage
    traditionalFeedback: Optional[str] = None
    solutionValidation: Optional[SolutionValidation] = None

    @validator('message')
    def validate_message(cls, v):
        if not isinstance(v, str):
            raise ValueError('Message must be a string')
        return v

# Backwards compatibility - ensure existing imports still work
__all__ = [
    'SolutionSubmission',
    'SolutionValidation', 
    'FeedbackRequest',
    'FeedbackResponse',
    'SourceCodeUpload',
    'Problem',
    'ParsonsSettings',
    'ChatMessage',
    'ChatFeedbackRequest',
    'ChatFeedbackResponse'
]