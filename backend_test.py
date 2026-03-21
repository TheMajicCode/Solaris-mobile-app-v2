#!/usr/bin/env python3
"""
Backend API Testing for Solaris Holistic Health API
Tests the core endpoints as specified in the review request.
"""

import requests
import json
import sys
from typing import Dict, Any

# Backend URL from environment
BACKEND_URL = "https://luca-wellness.preview.emergentagent.com/api"

def test_endpoint(method: str, endpoint: str, data: Dict[Any, Any] = None, headers: Dict[str, str] = None) -> Dict[str, Any]:
    """Test an API endpoint and return results"""
    url = f"{BACKEND_URL}{endpoint}"
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=headers, timeout=10)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, headers=headers, timeout=10)
        else:
            return {"success": False, "error": f"Unsupported method: {method}"}
        
        result = {
            "success": True,
            "status_code": response.status_code,
            "url": url,
            "method": method.upper()
        }
        
        # Try to parse JSON response
        try:
            result["response"] = response.json()
        except:
            result["response"] = response.text[:500]  # First 500 chars if not JSON
        
        return result
        
    except requests.exceptions.Timeout:
        return {"success": False, "error": "Request timeout", "url": url}
    except requests.exceptions.ConnectionError:
        return {"success": False, "error": "Connection error", "url": url}
    except Exception as e:
        return {"success": False, "error": str(e), "url": url}

def main():
    """Run all backend API tests"""
    print("=" * 60)
    print("SOLARIS HOLISTIC HEALTH API - BACKEND TESTING")
    print("=" * 60)
    print(f"Testing backend at: {BACKEND_URL}")
    print()
    
    tests = []
    
    # Test 1: GET /api/assessment/questions
    print("1. Testing GET /api/assessment/questions")
    print("-" * 40)
    result = test_endpoint("GET", "/assessment/questions")
    tests.append(("Assessment Questions", result))
    
    if result["success"]:
        print(f"✅ Status: {result['status_code']}")
        if isinstance(result["response"], list):
            print(f"✅ Response: Array with {len(result['response'])} questions")
            if len(result["response"]) > 0:
                first_q = result["response"][0]
                print(f"✅ Sample question: {first_q.get('question_text', 'N/A')[:50]}...")
        else:
            print(f"⚠️  Response type: {type(result['response'])}")
    else:
        print(f"❌ Error: {result['error']}")
    print()
    
    # Test 2: GET /api/listings
    print("2. Testing GET /api/listings")
    print("-" * 40)
    result = test_endpoint("GET", "/listings")
    tests.append(("Listings", result))
    
    if result["success"]:
        print(f"✅ Status: {result['status_code']}")
        if isinstance(result["response"], list):
            print(f"✅ Response: Array with {len(result['response'])} listings")
            if len(result["response"]) > 0:
                first_listing = result["response"][0]
                print(f"✅ Sample listing: {first_listing.get('title', 'N/A')}")
            else:
                print("ℹ️  No listings found (empty array - this is expected initially)")
        else:
            print(f"⚠️  Response type: {type(result['response'])}")
    else:
        print(f"❌ Error: {result['error']}")
    print()
    
    # Test 3: POST /api/auth/session (with invalid data)
    print("3. Testing POST /api/auth/session (invalid data)")
    print("-" * 40)
    invalid_auth_data = {"session_id": "invalid_session_12345"}
    result = test_endpoint("POST", "/auth/session", data=invalid_auth_data)
    tests.append(("Auth Session (Invalid)", result))
    
    if result["success"]:
        print(f"✅ Status: {result['status_code']}")
        if result["status_code"] in [400, 401]:
            print("✅ Correctly rejected invalid session (400/401 expected)")
        else:
            print(f"⚠️  Unexpected status for invalid auth: {result['status_code']}")
        print(f"Response: {result['response']}")
    else:
        print(f"❌ Error: {result['error']}")
    print()
    
    # Test 4: POST /api/auth/session (missing data)
    print("4. Testing POST /api/auth/session (missing session_id)")
    print("-" * 40)
    result = test_endpoint("POST", "/auth/session", data={})
    tests.append(("Auth Session (Missing Data)", result))
    
    if result["success"]:
        print(f"✅ Status: {result['status_code']}")
        if result["status_code"] == 400:
            print("✅ Correctly rejected missing session_id (400 expected)")
        else:
            print(f"⚠️  Unexpected status for missing data: {result['status_code']}")
        print(f"Response: {result['response']}")
    else:
        print(f"❌ Error: {result['error']}")
    print()
    
    # Summary
    print("=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = 0
    failed = 0
    
    for test_name, result in tests:
        if result["success"]:
            status_ok = False
            if "Assessment" in test_name:
                status_ok = result["status_code"] == 200
            elif "Listings" in test_name:
                status_ok = result["status_code"] == 200
            elif "Auth" in test_name:
                status_ok = result["status_code"] in [400, 401]
            
            if status_ok:
                print(f"✅ {test_name}: PASS")
                passed += 1
            else:
                print(f"⚠️  {test_name}: UNEXPECTED STATUS ({result['status_code']})")
                failed += 1
        else:
            print(f"❌ {test_name}: FAIL - {result['error']}")
            failed += 1
    
    print()
    print(f"Total Tests: {len(tests)}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    
    if failed == 0:
        print("\n🎉 ALL TESTS PASSED! Backend API is responding correctly.")
        return 0
    else:
        print(f"\n⚠️  {failed} test(s) failed. Check the details above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())