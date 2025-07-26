
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, auth
import json
import os
from datetime import datetime
from typing import Optional, List

app = FastAPI()

# Initialize Firebase Admin SDK
if not firebase_admin._apps:
    # Try to get service account from environment or use default
    try:
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred)
    except:
        # If no service account available, you'll need to add one
        print("Firebase Admin SDK not initialized. Add service account credentials.")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Admin storage (in production, use a database)
admin_storage = []

class AdminRequest(BaseModel):
    email: str

class AdminUser(BaseModel):
    email: str
    addedAt: str
    addedBy: str

async def verify_token(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    try:
        # Extract token from "Bearer <token>"
        token = authorization.split(" ")[1] if authorization.startswith("Bearer ") else authorization
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")

async def verify_admin(token_data = Depends(verify_token)):
    # Check if user has admin privileges
    email = token_data.get('email')
    if not email:
        raise HTTPException(status_code=403, detail="Email not found in token")
    
    # Check if user is in admin storage
    is_admin = any(admin['email'] == email for admin in admin_storage)
    if not is_admin:
        raise HTTPException(status_code=403, detail="Admin privileges required")
    
    return token_data

@app.get("/api/admin/check")
async def check_admin_status(token_data = Depends(verify_token)):
    """Check if the current user has admin privileges"""
    email = token_data.get('email')
    is_admin = any(admin['email'] == email for admin in admin_storage)
    return {"isAdmin": is_admin}

@app.get("/api/admin/list")
async def list_admins(token_data = Depends(verify_admin)):
    """List all admin users"""
    return {"admins": admin_storage}

@app.post("/api/admin/add")
async def add_admin(request: AdminRequest, token_data = Depends(verify_admin)):
    """Add a new admin user"""
    # Check if user already exists
    if any(admin['email'] == request.email for admin in admin_storage):
        raise HTTPException(status_code=400, detail="User is already an admin")
    
    # Verify the email exists in Firebase Auth
    try:
        user = auth.get_user_by_email(request.email)
    except auth.UserNotFoundError:
        raise HTTPException(status_code=404, detail="User not found in Firebase Auth")
    
    # Add to admin storage
    new_admin = {
        "email": request.email,
        "addedAt": datetime.now().isoformat(),
        "addedBy": token_data.get('email')
    }
    admin_storage.append(new_admin)
    
    # Set custom claims in Firebase (optional)
    try:
        auth.set_custom_user_claims(user.uid, {"admin": True})
    except Exception as e:
        print(f"Failed to set custom claims: {e}")
    
    return {"message": "Admin added successfully"}

@app.post("/api/admin/remove")
async def remove_admin(request: AdminRequest, token_data = Depends(verify_admin)):
    """Remove an admin user"""
    current_user_email = token_data.get('email')
    
    # Prevent removing yourself
    if request.email == current_user_email:
        raise HTTPException(status_code=400, detail="Cannot remove yourself as admin")
    
    # Find and remove admin
    admin_storage[:] = [admin for admin in admin_storage if admin['email'] != request.email]
    
    # Remove custom claims in Firebase (optional)
    try:
        user = auth.get_user_by_email(request.email)
        auth.set_custom_user_claims(user.uid, {"admin": False})
    except Exception as e:
        print(f"Failed to remove custom claims: {e}")
    
    return {"message": "Admin removed successfully"}

@app.post("/api/search")
async def search_institutions(request: dict):
    """Search institutions - placeholder endpoint"""
    # This should integrate with your institution search logic
    query = request.get('query', '')
    
    # Mock response for now
    mock_schools = [
        {
            "name": f"University of {query}",
            "state": "CA",
            "ownership": "Public",
            "size": 25000
        }
    ]
    
    return {"schools": mock_schools}

# Initialize with a default admin (replace with your email)
if not admin_storage:
    admin_storage.append({
        "email": "your-email@example.com",  # Replace with your actual email
        "addedAt": datetime.now().isoformat(),
        "addedBy": "system"
    })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
