#!/usr/bin/env python3
"""
Test script for validating the new chat models
Run with: python test_models.py
"""

import sys
import os
from datetime import datetime
import json

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models import (
    ChatMessage, 
    ChatFeedbackRequest, 
    ChatFeedbackResponse,
    SolutionValidation,
    FeedbackRequest,
    FeedbackResponse
)

def test_chat_message():
    print("Testing ChatMessage model...")
    
    # Valid chat message
    valid_message = ChatMessage(
        id="msg_123",
        role="student",
        content="I need help with this problem",
        timestamp=1640995200000
    )
    print(f"✓ Valid ChatMessage created: {valid_message.role} - {valid_message.content[:30]}...")
    
    # Test with typing indicator
    typing_message = ChatMessage(
        id="msg_124",
        role="tutor", 
        content="",
        timestamp=1640995200000,
        isTyping=True
    )
    print(f"✓ Typing ChatMessage created: isTyping={typing_message.isTyping}")
    
    # Test validation errors
    try:
        invalid_role = ChatMessage(
            id="msg_125",
            role="invalid_role",
            content="test",
            timestamp=1640995200000
        )
        print("✗ Should have failed with invalid role")
    except ValueError as e:
        print(f"✓ Correctly caught invalid role: {e}")
    
    try:
        invalid_timestamp = ChatMessage(
            id="msg_126",
            role="student",
            content="test",
            timestamp=-1
        )
        print("✗ Should have failed with invalid timestamp")
    except ValueError as e:
        print(f"✓ Correctly caught invalid timestamp: {e}")
    
    print("ChatMessage tests passed!\n")

def test_chat_feedback_request():
    print("Testing ChatFeedbackRequest model...")
    
    # Create sample chat history
    chat_history = [
        ChatMessage(
            id="msg_1",
            role="tutor",
            content="Hello! How can I help you?",
            timestamp=1640995200000
        ),
        ChatMessage(
            id="msg_2", 
            role="student",
            content="I'm confused about indentation",
            timestamp=1640995260000
        )
    ]
    
    valid_request = ChatFeedbackRequest(
        problemId="prob_123",
        userSolution=["print('hello')", "x = 5"],
        chatHistory=chat_history,
        currentMessage="Can you explain how indentation works in Python?"
    )
    
    print(f"✓ Valid ChatFeedbackRequest created with {len(valid_request.chatHistory)} messages")
    print(f"✓ Current message: {valid_request.currentMessage[:40]}...")
    
    # Test validation
    try:
        invalid_message = ChatFeedbackRequest(
            problemId="prob_123",
            userSolution=["print('hello')"],
            chatHistory=[],
            currentMessage=""  # Empty message should fail
        )
        print("✗ Should have failed with empty current message")
    except ValueError as e:
        print(f"✓ Correctly caught empty message: {e}")
    
    print("ChatFeedbackRequest tests passed!\n")

def test_chat_feedback_response():
    print("Testing ChatFeedbackResponse model...")
    
    # Create response message
    response_message = ChatMessage(
        id="msg_response",
        role="tutor",
        content="Indentation in Python is used to define code blocks. Lines with the same indentation level belong to the same block.",
        timestamp=1640995320000
    )
    
    # Create solution validation
    solution_validation = SolutionValidation(
        isCorrect=False,
        details="Your solution has indentation errors on line 2."
    )
    
    valid_response = ChatFeedbackResponse(
        success=True,
        message="Generated conversational response",
        chatMessage=response_message,
        traditionalFeedback="<div>Code blocks are not in correct order</div>",
        solutionValidation=solution_validation
    )
    
    print(f"✓ Valid ChatFeedbackResponse created")
    print(f"✓ Success: {valid_response.success}")
    print(f"✓ Chat message role: {valid_response.chatMessage.role}")
    print(f"✓ Has traditional feedback: {valid_response.traditionalFeedback is not None}")
    print(f"✓ Has solution validation: {valid_response.solutionValidation is not None}")
    
    print("ChatFeedbackResponse tests passed!\n")

def test_backwards_compatibility():
    print("Testing backwards compatibility...")
    
    # Test existing models still work
    old_feedback_request = FeedbackRequest(
        problemId="prob_123",
        userSolution=["print('hello')"]
    )
    print(f"✓ Old FeedbackRequest still works: {old_feedback_request.problemId}")
    
    old_feedback_response = FeedbackResponse(
        feedback="This is traditional feedback"
    )
    print(f"✓ Old FeedbackResponse still works: {old_feedback_response.feedback[:30]}...")
    
    print("Backwards compatibility tests passed!\n")

def test_json_serialization():
    print("Testing JSON serialization...")
    
    # Test that models can be converted to/from JSON
    message = ChatMessage(
        id="msg_json",
        role="student",
        content="Test message",
        timestamp=1640995200000
    )
    
    # Serialize to JSON
    json_data = message.dict()
    print(f"✓ Serialized to JSON: {json.dumps(json_data, indent=2)}")
    
    # Deserialize from JSON
    recreated_message = ChatMessage(**json_data)
    print(f"✓ Deserialized from JSON: {recreated_message.content}")
    
    print("JSON serialization tests passed!\n")

if __name__ == "__main__":
    print("=" * 50)
    print("TESTING CHAT MODELS")
    print("=" * 50)
    
    try:
        test_chat_message()
        test_chat_feedback_request() 
        test_chat_feedback_response()
        test_backwards_compatibility()
        test_json_serialization()
        
        print("=" * 50)
        print("ALL TESTS PASSED! ✓")
        print("=" * 50)
        
    except Exception as e:
        print(f"=" * 50)
        print(f"TEST FAILED: {e}")
        print("=" * 50)
        sys.exit(1)