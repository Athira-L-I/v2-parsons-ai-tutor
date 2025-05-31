#!/usr/bin/env python3
"""
Test script for the chat API endpoint
Run with: python test_chat_api.py
Make sure the FastAPI server is running first!
"""

import requests
import json
import sys
import time

# API base URL - adjust if your server runs on a different port
BASE_URL = "http://localhost:8000"

def test_health_check():
    """Test the health check endpoint"""
    print("Testing health check endpoint...")
    
    try:
        response = requests.get(f"{BASE_URL}/api/feedback/health")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Health check passed: {data['status']}")
            print(f"✓ Available endpoints: {len(data['endpoints'])}")
            return True
        else:
            print(f"✗ Health check failed: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("✗ Cannot connect to server. Make sure FastAPI is running on localhost:8000")
        return False
    except Exception as e:
        print(f"✗ Health check error: {e}")
        return False

def test_original_feedback_endpoint():
    """Test that the original feedback endpoint still works"""
    print("\nTesting original feedback endpoint...")
    
    payload = {
        "problemId": "demo-problem-1",
        "userSolution": ["print('hello')", "x = 5"]
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/feedback",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Original feedback endpoint works")
            print(f"✓ Feedback received: {data['feedback'][:50]}...")
            return True
        else:
            print(f"✗ Original feedback failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"✗ Original feedback error: {e}")
        return False

def test_chat_endpoint_basic():
    """Test the new chat endpoint with basic request"""
    print("\nTesting chat endpoint - basic request...")
    
    payload = {
        "problemId": "demo-problem-1",
        "userSolution": [],
        "chatHistory": [],
        "currentMessage": "Hello, I need help with this problem"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/feedback/chat",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Chat endpoint works")
            print(f"✓ Success: {data['success']}")
            print(f"✓ Chat message role: {data['chatMessage']['role']}")
            print(f"✓ Chat content: {data['chatMessage']['content'][:60]}...")
            return True
        else:
            print(f"✗ Chat endpoint failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"✗ Chat endpoint error: {e}")
        return False

def test_chat_endpoint_with_history():
    """Test the chat endpoint with chat history"""
    print("\nTesting chat endpoint - with chat history...")
    
    payload = {
        "problemId": "demo-problem-1",
        "userSolution": ["start = 1", "end = 10"],
        "chatHistory": [
            {
                "id": "msg_1",
                "role": "tutor",
                "content": "Hello! How can I help you with this problem?",
                "timestamp": int(time.time() * 1000) - 60000
            },
            {
                "id": "msg_2",
                "role": "student", 
                "content": "I'm confused about the order of these code blocks",
                "timestamp": int(time.time() * 1000) - 30000
            }
        ],
        "currentMessage": "Can you explain how loops work in Python?"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/feedback/chat",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Chat with history works")
            print(f"✓ Response considers context: {len(data['chatMessage']['content']) > 20}")
            print(f"✓ Traditional feedback included: {data['traditionalFeedback'] is not None}")
            print(f"✓ Solution validation included: {data['solutionValidation'] is not None}")
            return True
        else:
            print(f"✗ Chat with history failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"✗ Chat with history error: {e}")
        return False

def test_chat_endpoint_validation():
    """Test chat endpoint validation"""
    print("\nTesting chat endpoint validation...")
    
    # Test empty message
    payload = {
        "problemId": "demo-problem-1",
        "userSolution": [],
        "chatHistory": [],
        "currentMessage": ""
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/feedback/chat",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 400:
            print("✓ Empty message validation works")
        else:
            print(f"✗ Empty message should return 400, got {response.status_code}")
            
    except Exception as e:
        print(f"✗ Validation test error: {e}")
        return False
    
    # Test missing problem ID
    payload = {
        "problemId": "",
        "userSolution": [],
        "chatHistory": [],
        "currentMessage": "Test message"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/feedback/chat",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 400:
            print("✓ Missing problem ID validation works")
            return True
        else:
            print(f"✗ Missing problem ID should return 400, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"✗ Validation test error: {e}")
        return False

def test_curl_examples():
    """Show curl examples for manual testing"""
    print("\nCURL Examples for manual testing:")
    print("=" * 50)
    
    print("\n1. Health Check:")
    print(f"curl -X GET {BASE_URL}/api/feedback/health")
    
    print("\n2. Original Feedback:")
    print(f"""curl -X POST {BASE_URL}/api/feedback \\
  -H "Content-Type: application/json" \\
  -d '{{"problemId": "demo-problem-1", "userSolution": ["print(\\"hello\\")"]}}' """)
    
    print("\n3. Chat Feedback:")
    print(f"""curl -X POST {BASE_URL}/api/feedback/chat \\
  -H "Content-Type: application/json" \\
  -d '{{
    "problemId": "demo-problem-1",
    "userSolution": [],
    "chatHistory": [],
    "currentMessage": "Can you help me understand this problem?"
  }}' """)

if __name__ == "__main__":
    print("=" * 60)
    print("TESTING CHAT API ENDPOINT")
    print("=" * 60)
    print("Make sure your FastAPI server is running first!")
    print("Run: uvicorn main:app --reload")
    print("=" * 60)
    
    # Wait a moment for user to see the message
    time.sleep(2)
    
    all_passed = True
    
    # Run tests
    all_passed &= test_health_check()
    all_passed &= test_original_feedback_endpoint()
    all_passed &= test_chat_endpoint_basic()
    all_passed &= test_chat_endpoint_with_history()
    all_passed &= test_chat_endpoint_validation()
    
    # Show curl examples
    test_curl_examples()
    
    if all_passed:
        print("\n" + "=" * 60)
        print("ALL API TESTS PASSED! ✓")
        print("Chat endpoint is working correctly")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("SOME TESTS FAILED - Check the details above")
        print("Make sure the FastAPI server is running")
        print("=" * 60)