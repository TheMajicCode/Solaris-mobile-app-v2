#!/usr/bin/env python3
"""
Backend API Testing for Solaris Holistic Health Admin Endpoints
Tests all admin endpoints for authentication and structure
"""

import requests
import json
import sys
from typing import Dict, Any

# Backend URL from environment
BACKEND_URL = "https://luca-wellness.preview.emergentagent.com/api"

class AdminEndpointTester:
    def __init__(self):
        self.results = []
        self.session = requests.Session()
        
    def log_result(self, endpoint: str, method: str, status_code: int, expected: int, 
                   response_data: Any = None, error: str = None):
        """Log test result"""
        passed = status_code == expected
        result = {
            "endpoint": f"{method} {endpoint}",
            "status_code": status_code,
            "expected": expected,
            "passed": passed,
            "response_data": response_data,
            "error": error
        }
        self.results.append(result)
        
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} {method} {endpoint} - {status_code} (expected {expected})")
        if error:
            print(f"    Error: {error}")
        if response_data and isinstance(response_data, dict) and len(str(response_data)) < 200:
            print(f"    Response: {response_data}")
        print()
        
    def test_endpoint_unauthenticated(self, endpoint: str, method: str = "GET", 
                                    json_data: Dict = None):
        """Test endpoint without authentication - should return 401"""
        try:
            url = f"{BACKEND_URL}{endpoint}"
            
            if method == "GET":
                response = self.session.get(url)
            elif method == "POST":
                response = self.session.post(url, json=json_data or {})
            elif method == "PUT":
                response = self.session.put(url, json=json_data or {})
            elif method == "DELETE":
                response = self.session.delete(url)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            try:
                response_data = response.json()
            except:
                response_data = response.text
                
            self.log_result(endpoint, method, response.status_code, 401, response_data)
            
        except Exception as e:
            self.log_result(endpoint, method, 0, 401, error=str(e))
    
    def test_public_endpoint(self, endpoint: str, expected_status: int = 200):
        """Test public endpoint - should work without auth"""
        try:
            url = f"{BACKEND_URL}{endpoint}"
            response = self.session.get(url)
            
            try:
                response_data = response.json()
            except:
                response_data = response.text
                
            self.log_result(endpoint, "GET", response.status_code, expected_status, response_data)
            
        except Exception as e:
            self.log_result(endpoint, "GET", 0, expected_status, error=str(e))
    
    def run_all_tests(self):
        """Run all admin endpoint tests"""
        print("=" * 80)
        print("SOLARIS HOLISTIC HEALTH - ADMIN BACKEND API TESTS")
        print("=" * 80)
        print(f"Testing backend at: {BACKEND_URL}")
        print()
        
        # Test public endpoints first (should work)
        print("🔓 TESTING PUBLIC ENDPOINTS")
        print("-" * 40)
        self.test_public_endpoint("/assessment/questions")
        self.test_public_endpoint("/listings")
        
        # Test admin endpoints without auth (should return 401)
        print("🔒 TESTING ADMIN ENDPOINTS (Unauthenticated - Should Return 401)")
        print("-" * 60)
        
        # 1. GET /api/admin/stats
        self.test_endpoint_unauthenticated("/admin/stats")
        
        # 2. GET /api/admin/users  
        self.test_endpoint_unauthenticated("/admin/users")
        
        # 3. PUT /api/admin/users/{user_id} - NEW endpoint
        test_user_data = {
            "role": "admin",
            "onboarding_status": "completed",
            "first_name": "Test",
            "last_name": "User",
            "display_name": "Test User",
            "phone": "+1234567890",
            "city": "Test City",
            "country": "Test Country"
        }
        self.test_endpoint_unauthenticated("/admin/users/test_user_123", "PUT", test_user_data)
        
        # 4. GET /api/admin/listings
        self.test_endpoint_unauthenticated("/admin/listings")
        
        # 5. POST /api/admin/listings
        test_listing_data = {
            "listing_type": "practitioner",
            "node_type": "practitioner_node", 
            "title": "Test Practitioner",
            "short_description": "Test description",
            "status": "draft"
        }
        self.test_endpoint_unauthenticated("/admin/listings", "POST", test_listing_data)
        
        # 6. PUT /api/admin/listings/{listing_id}
        test_listing_update = {
            "title": "Updated Test Practitioner",
            "status": "published"
        }
        self.test_endpoint_unauthenticated("/admin/listings/test_listing_123", "PUT", test_listing_update)
        
        # 7. DELETE /api/admin/listings/{listing_id}
        self.test_endpoint_unauthenticated("/admin/listings/test_listing_123", "DELETE")
        
        # 8. GET /api/admin/bookings
        self.test_endpoint_unauthenticated("/admin/bookings")
        
        # 9. GET /api/admin/bookings with status filter
        self.test_endpoint_unauthenticated("/admin/bookings?status=pending")
        
        # 10. PUT /api/admin/bookings/{booking_id}
        test_booking_update = {
            "status": "confirmed",
            "admin_notes": "Booking confirmed by admin"
        }
        self.test_endpoint_unauthenticated("/admin/bookings/test_booking_123", "PUT", test_booking_update)
        
        # 11. GET /api/admin/rewards - NEW endpoint
        self.test_endpoint_unauthenticated("/admin/rewards")
        
        # Summary
        print("=" * 80)
        print("TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r["passed"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        print()
        
        if failed_tests > 0:
            print("FAILED TESTS:")
            print("-" * 20)
            for result in self.results:
                if not result["passed"]:
                    print(f"❌ {result['endpoint']} - Got {result['status_code']}, expected {result['expected']}")
                    if result["error"]:
                        print(f"   Error: {result['error']}")
            print()
        
        # Check for specific issues
        print("ANALYSIS:")
        print("-" * 20)
        
        # Check public endpoints
        public_endpoints = [r for r in self.results if "/admin/" not in r["endpoint"]]
        public_working = all(r["passed"] for r in public_endpoints)
        
        if public_working:
            print("✅ Public endpoints are working correctly")
        else:
            print("❌ Public endpoints have issues")
            
        # Check admin auth protection
        admin_endpoints = [r for r in self.results if "/admin/" in r["endpoint"]]
        admin_protected = all(r["passed"] for r in admin_endpoints)
        
        if admin_protected:
            print("✅ All admin endpoints properly require authentication (return 401)")
        else:
            print("❌ Some admin endpoints are not properly protected")
            unprotected = [r for r in admin_endpoints if not r["passed"]]
            for endpoint in unprotected:
                print(f"   - {endpoint['endpoint']} returned {endpoint['status_code']} instead of 401")
        
        print()
        return passed_tests == total_tests

def main():
    """Main test runner"""
    tester = AdminEndpointTester()
    success = tester.run_all_tests()
    
    if success:
        print("🎉 ALL TESTS PASSED!")
        sys.exit(0)
    else:
        print("💥 SOME TESTS FAILED!")
        sys.exit(1)

if __name__ == "__main__":
    main()