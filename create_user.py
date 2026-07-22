import requests
import json
import sys

base_url = "http://localhost:3000"

# First check if server is working
health_response = requests.get(f"{base_url}/api/health")
if health_response.status_code != 200:
    print("❌ Server is not responding properly")
    sys.exit(1)

print("✅ Server is working")

# Create new admin user
try:
    url = f"{base_url}/api/users"
    headers = {'Content-Type': 'application/json'}
    
    user_data = {
        "username": "birtan",
        "password": "birtan123", 
        "name": "Birtan Admin",
        "email": "birtan@example.com",
        "role": "ADMIN",
        "isActive": True
    }
    
    print(f"🛠️  Sending user data to {url}")
    print(f"Data: {json.dumps(user_data, indent=2)}")
    
    response = requests.post(url, headers=headers, data=json.dumps(user_data))
    
    print(f"📬 Response Status: {response.status_code}")
    print(f"📄 Response Body: {response.text}")
    
    if response.status_code == 200:
        user_info = response.json()
        print(f"✅ Successfully created user: {json.dumps(user_info, indent=2)}")
    else:
        print(f"❌ Failed to create user. Status: {response.status_code}, Response: {response.text}")
        
except Exception as e:
    print(f"❌ Error creating user: {e}")
    import traceback
    traceback.print_exc()