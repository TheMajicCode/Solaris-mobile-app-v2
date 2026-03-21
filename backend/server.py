from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'solaris_health')]

# LLM Configuration
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Create the main app
app = FastAPI(title="Solaris Holistic Health API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============= PYDANTIC MODELS =============

# User Models (FHIR: Patient)
class UserProfile(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    display_name: Optional[str] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    language: Optional[str] = "en"
    timezone: Optional[str] = "UTC"
    date_of_birth: Optional[str] = None
    goals_text: Optional[str] = None
    main_concerns: Optional[str] = None
    budget_range: Optional[str] = None
    preferred_guidance: Optional[str] = "mixed"  # self-guided, practitioner-guided, mixed
    onboarding_status: str = "not_started"  # not_started, in_progress, completed
    onboarding_step: int = 0
    role: str = "user"  # user, admin
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    display_name: Optional[str] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    language: Optional[str] = None
    timezone: Optional[str] = None
    date_of_birth: Optional[str] = None
    goals_text: Optional[str] = None
    main_concerns: Optional[str] = None
    budget_range: Optional[str] = None
    preferred_guidance: Optional[str] = None
    onboarding_status: Optional[str] = None
    onboarding_step: Optional[int] = None

# Assessment Models (FHIR: Questionnaire, QuestionnaireResponse, Observation)
class AssessmentQuestion(BaseModel):
    question_id: str
    section: str  # aspects, body_systems
    category: str  # mental, emotional, physical, spiritual, bioelectrical, etc.
    question_text: str
    question_type: str  # slider, yes_no, single_select, multi_select, text
    options: Optional[List[str]] = None
    min_value: Optional[int] = 0
    max_value: Optional[int] = 10
    weight: float = 1.0
    sort_order: int = 0

class AssessmentAnswer(BaseModel):
    question_id: str
    answer_value: Any
    normalized_score: Optional[float] = None

class AssessmentResponse(BaseModel):
    response_id: str = Field(default_factory=lambda: f"resp_{uuid.uuid4().hex[:12]}")
    user_id: str
    answers: List[AssessmentAnswer]
    vitality_score: Optional[float] = None
    mental_score: Optional[float] = None
    emotional_score: Optional[float] = None
    physical_score: Optional[float] = None
    spiritual_score: Optional[float] = None
    body_system_scores: Optional[Dict[str, float]] = None
    top_focus_areas: Optional[List[str]] = None
    recommendations: Optional[List[Dict]] = None
    completed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Listing Models (FHIR: Practitioner, Organization, Location)
class Listing(BaseModel):
    listing_id: str = Field(default_factory=lambda: f"list_{uuid.uuid4().hex[:12]}")
    listing_type: str  # practitioner, clinic, service, workshop, place, diagnostics, kitchen, program
    node_type: str  # care_node, practitioner_node, protocol_node, etc.
    status: str = "draft"  # draft, published, archived
    title: str
    slug: Optional[str] = None
    short_description: Optional[str] = None
    full_description: Optional[str] = None
    tagline: Optional[str] = None
    cover_image: Optional[str] = None
    gallery: Optional[List[str]] = None
    city: Optional[str] = None
    region: Optional[str] = None
    country: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    languages: Optional[List[str]] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    website_url: Optional[str] = None
    whatsapp_url: Optional[str] = None
    booking_enabled: bool = True
    payment_enabled: bool = False
    featured: bool = False
    price_range_min: Optional[float] = None
    price_range_max: Optional[float] = None
    currency: str = "USD"
    specialties: Optional[List[str]] = None
    body_systems_supported: Optional[List[str]] = None
    goals_supported: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ListingCreate(BaseModel):
    listing_type: str
    node_type: str
    title: str
    short_description: Optional[str] = None
    full_description: Optional[str] = None
    tagline: Optional[str] = None
    cover_image: Optional[str] = None
    gallery: Optional[List[str]] = None
    city: Optional[str] = None
    region: Optional[str] = None
    country: Optional[str] = None
    address: Optional[str] = None
    languages: Optional[List[str]] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    website_url: Optional[str] = None
    booking_enabled: bool = True
    payment_enabled: bool = False
    featured: bool = False
    price_range_min: Optional[float] = None
    price_range_max: Optional[float] = None
    currency: str = "USD"
    specialties: Optional[List[str]] = None
    body_systems_supported: Optional[List[str]] = None
    goals_supported: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    status: str = "draft"

# Booking Models (FHIR: Appointment)
class BookingRequest(BaseModel):
    booking_id: str = Field(default_factory=lambda: f"book_{uuid.uuid4().hex[:12]}")
    user_id: str
    listing_id: str
    status: str = "pending"  # pending, confirmed, completed, cancelled
    preferred_date: Optional[str] = None
    preferred_time: Optional[str] = None
    note: Optional[str] = None
    admin_notes: Optional[str] = None
    quoted_price: Optional[float] = None
    payment_status: str = "unpaid"  # unpaid, pending, paid
    payment_link: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BookingCreate(BaseModel):
    listing_id: str
    preferred_date: Optional[str] = None
    preferred_time: Optional[str] = None
    note: Optional[str] = None

# Daily Check-in Models (FHIR: Observation)
class DailyCheckin(BaseModel):
    checkin_id: str = Field(default_factory=lambda: f"check_{uuid.uuid4().hex[:12]}")
    user_id: str
    checkin_date: str
    energy_score: Optional[int] = None
    mood_score: Optional[int] = None
    sleep_hours: Optional[float] = None
    hydration_glasses: Optional[int] = None
    movement_minutes: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DailyCheckinCreate(BaseModel):
    checkin_date: str
    energy_score: Optional[int] = None
    mood_score: Optional[int] = None
    sleep_hours: Optional[float] = None
    hydration_glasses: Optional[int] = None
    movement_minutes: Optional[int] = None
    notes: Optional[str] = None

# Rewards Models (LOVE Points)
class RewardEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: f"reward_{uuid.uuid4().hex[:12]}")
    user_id: str
    event_type: str  # account_created, onboarding_completed, assessment_completed, daily_checkin, booking_request, etc.
    points: int
    category: str = "engagement"
    reference_id: Optional[str] = None
    note: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Chat Models
class ChatMessage(BaseModel):
    message_id: str = Field(default_factory=lambda: f"msg_{uuid.uuid4().hex[:12]}")
    user_id: str
    session_id: str
    role: str  # user, assistant
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

# ============= AUTHENTICATION =============

async def get_session_from_cookie(request: Request) -> Optional[dict]:
    """Extract and validate session from cookie or Authorization header"""
    session_token = request.cookies.get("session_token")
    
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.replace("Bearer ", "")
    
    if not session_token:
        return None
    
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        return None
    
    # Check expiry
    expires_at = session.get("expires_at")
    if expires_at:
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            return None
    
    return session

async def get_current_user(request: Request) -> dict:
    """Get current authenticated user"""
    session = await get_session_from_cookie(request)
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

async def get_optional_user(request: Request) -> Optional[dict]:
    """Get current user if authenticated, None otherwise"""
    try:
        return await get_current_user(request)
    except HTTPException:
        return None

async def require_admin(request: Request) -> dict:
    """Require admin role"""
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ============= AUTH ROUTES =============

@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    """Exchange session_id for session_token"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent Auth to exchange session_id
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            auth_data = resp.json()
        except Exception as e:
            logger.error(f"Auth error: {e}")
            raise HTTPException(status_code=401, detail="Authentication failed")
    
    email = auth_data.get("email")
    name = auth_data.get("name", "")
    picture = auth_data.get("picture", "")
    session_token = auth_data.get("session_token")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user info
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture, "updated_at": datetime.now(timezone.utc)}}
        )
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        new_user = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "role": "user",
            "onboarding_status": "not_started",
            "onboarding_step": 0,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(new_user)
        
        # Award points for account creation
        reward = RewardEvent(
            user_id=user_id,
            event_type="account_created",
            points=100,
            category="onboarding",
            note="Welcome to Solaris!"
        )
        await db.reward_events.insert_one(reward.dict())
    
    # Create session
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    }
    await db.user_sessions.update_one(
        {"user_id": user_id},
        {"$set": session_doc},
        upsert=True
    )
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Get current user profile"""
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    session = await get_session_from_cookie(request)
    if session:
        await db.user_sessions.delete_one({"user_id": session["user_id"]})
    
    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out"}

# ============= USER ROUTES =============

@api_router.put("/users/profile")
async def update_profile(update: UserProfileUpdate, user: dict = Depends(get_current_user)):
    """Update user profile"""
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": update_data}
    )
    
    updated_user = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return updated_user

@api_router.get("/users/rewards")
async def get_user_rewards(user: dict = Depends(get_current_user)):
    """Get user's reward points and history"""
    rewards = await db.reward_events.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    total_points = sum(r.get("points", 0) for r in rewards)
    
    # Calculate streak
    checkins = await db.daily_checkins.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).sort("checkin_date", -1).to_list(30)
    
    streak = 0
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    for i, checkin in enumerate(checkins):
        expected_date = (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d")
        if checkin.get("checkin_date") == expected_date:
            streak += 1
        else:
            break
    
    return {
        "total_points": total_points,
        "streak": streak,
        "history": rewards[:20]
    }

# ============= ASSESSMENT ROUTES =============

# Define assessment questions
ASSESSMENT_QUESTIONS = [
    # 4 Aspects - Mental
    {"question_id": "mental_1", "section": "aspects", "category": "mental", "question_text": "How often do you feel mentally clear and focused?", "question_type": "slider", "min_value": 0, "max_value": 10, "weight": 1.0, "sort_order": 1},
    {"question_id": "mental_2", "section": "aspects", "category": "mental", "question_text": "How would you rate your ability to manage stress?", "question_type": "slider", "min_value": 0, "max_value": 10, "weight": 1.0, "sort_order": 2},
    {"question_id": "mental_3", "section": "aspects", "category": "mental", "question_text": "Do you often experience racing thoughts or mental fog?", "question_type": "single_select", "options": ["Never", "Rarely", "Sometimes", "Often", "Always"], "weight": 1.0, "sort_order": 3},
    {"question_id": "mental_4", "section": "aspects", "category": "mental", "question_text": "How satisfied are you with your current mental clarity?", "question_type": "slider", "min_value": 0, "max_value": 10, "weight": 1.0, "sort_order": 4},
    
    # 4 Aspects - Emotional
    {"question_id": "emotional_1", "section": "aspects", "category": "emotional", "question_text": "How often do you feel emotionally balanced?", "question_type": "slider", "min_value": 0, "max_value": 10, "weight": 1.0, "sort_order": 5},
    {"question_id": "emotional_2", "section": "aspects", "category": "emotional", "question_text": "How connected do you feel to your emotions?", "question_type": "slider", "min_value": 0, "max_value": 10, "weight": 1.0, "sort_order": 6},
    {"question_id": "emotional_3", "section": "aspects", "category": "emotional", "question_text": "Do you often feel overwhelmed by emotions?", "question_type": "single_select", "options": ["Never", "Rarely", "Sometimes", "Often", "Always"], "weight": 1.0, "sort_order": 7},
    {"question_id": "emotional_4", "section": "aspects", "category": "emotional", "question_text": "How would you rate your emotional resilience?", "question_type": "slider", "min_value": 0, "max_value": 10, "weight": 1.0, "sort_order": 8},
    
    # 4 Aspects - Physical
    {"question_id": "physical_1", "section": "aspects", "category": "physical", "question_text": "How would you rate your overall energy levels?", "question_type": "slider", "min_value": 0, "max_value": 10, "weight": 1.0, "sort_order": 9},
    {"question_id": "physical_2", "section": "aspects", "category": "physical", "question_text": "How often do you engage in physical activity?", "question_type": "single_select", "options": ["Never", "1-2 times/week", "3-4 times/week", "5+ times/week", "Daily"], "weight": 1.0, "sort_order": 10},
    {"question_id": "physical_3", "section": "aspects", "category": "physical", "question_text": "How satisfied are you with your physical health?", "question_type": "slider", "min_value": 0, "max_value": 10, "weight": 1.0, "sort_order": 11},
    {"question_id": "physical_4", "section": "aspects", "category": "physical", "question_text": "Do you experience chronic pain or discomfort?", "question_type": "single_select", "options": ["Never", "Rarely", "Sometimes", "Often", "Always"], "weight": 1.0, "sort_order": 12},
    
    # 4 Aspects - Spiritual
    {"question_id": "spiritual_1", "section": "aspects", "category": "spiritual", "question_text": "How connected do you feel to your sense of purpose?", "question_type": "slider", "min_value": 0, "max_value": 10, "weight": 1.0, "sort_order": 13},
    {"question_id": "spiritual_2", "section": "aspects", "category": "spiritual", "question_text": "How often do you feel hopeful about the future?", "question_type": "slider", "min_value": 0, "max_value": 10, "weight": 1.0, "sort_order": 14},
    {"question_id": "spiritual_3", "section": "aspects", "category": "spiritual", "question_text": "Do you practice any form of meditation or mindfulness?", "question_type": "single_select", "options": ["Never", "Occasionally", "Weekly", "Several times/week", "Daily"], "weight": 1.0, "sort_order": 15},
    {"question_id": "spiritual_4", "section": "aspects", "category": "spiritual", "question_text": "How meaningful do you find your daily activities?", "question_type": "slider", "min_value": 0, "max_value": 10, "weight": 1.0, "sort_order": 16},
    
    # 8 Body Systems - Bioelectrical
    {"question_id": "bio_1", "section": "body_systems", "category": "bioelectrical", "question_text": "How often do you feel energetically depleted?", "question_type": "single_select", "options": ["Never", "Rarely", "Sometimes", "Often", "Always"], "weight": 1.0, "sort_order": 17},
    {"question_id": "bio_2", "section": "body_systems", "category": "bioelectrical", "question_text": "Do you ground yourself in nature regularly?", "question_type": "single_select", "options": ["Never", "Rarely", "Sometimes", "Often", "Daily"], "weight": 1.0, "sort_order": 18},
    
    # 8 Body Systems - Hydration
    {"question_id": "hydration_1", "section": "body_systems", "category": "hydration", "question_text": "How many glasses of water do you drink daily?", "question_type": "single_select", "options": ["0-2", "3-4", "5-6", "7-8", "9+"], "weight": 1.0, "sort_order": 19},
    {"question_id": "hydration_2", "section": "body_systems", "category": "hydration", "question_text": "How often do you feel thirsty throughout the day?", "question_type": "single_select", "options": ["Never", "Rarely", "Sometimes", "Often", "Always"], "weight": 1.0, "sort_order": 20},
    
    # 8 Body Systems - Circadian
    {"question_id": "circadian_1", "section": "body_systems", "category": "circadian", "question_text": "How would you rate your sleep quality?", "question_type": "slider", "min_value": 0, "max_value": 10, "weight": 1.0, "sort_order": 21},
    {"question_id": "circadian_2", "section": "body_systems", "category": "circadian", "question_text": "Do you wake up feeling refreshed?", "question_type": "single_select", "options": ["Never", "Rarely", "Sometimes", "Often", "Always"], "weight": 1.0, "sort_order": 22},
    {"question_id": "circadian_3", "section": "body_systems", "category": "circadian", "question_text": "How consistent is your sleep schedule?", "question_type": "slider", "min_value": 0, "max_value": 10, "weight": 1.0, "sort_order": 23},
    
    # 8 Body Systems - Microbiome
    {"question_id": "micro_1", "section": "body_systems", "category": "microbiome", "question_text": "How often do you experience digestive discomfort?", "question_type": "single_select", "options": ["Never", "Rarely", "Sometimes", "Often", "Always"], "weight": 1.0, "sort_order": 24},
    {"question_id": "micro_2", "section": "body_systems", "category": "microbiome", "question_text": "How diverse is your diet?", "question_type": "slider", "min_value": 0, "max_value": 10, "weight": 1.0, "sort_order": 25},
    {"question_id": "micro_3", "section": "body_systems", "category": "microbiome", "question_text": "Do you consume fermented foods regularly?", "question_type": "single_select", "options": ["Never", "Rarely", "Sometimes", "Often", "Daily"], "weight": 1.0, "sort_order": 26},
    
    # 8 Body Systems - Respiratory
    {"question_id": "resp_1", "section": "body_systems", "category": "respiratory", "question_text": "How would you rate your breathing quality?", "question_type": "slider", "min_value": 0, "max_value": 10, "weight": 1.0, "sort_order": 27},
    {"question_id": "resp_2", "section": "body_systems", "category": "respiratory", "question_text": "Do you practice breathwork or deep breathing?", "question_type": "single_select", "options": ["Never", "Rarely", "Sometimes", "Often", "Daily"], "weight": 1.0, "sort_order": 28},
    
    # 8 Body Systems - Neurological
    {"question_id": "neuro_1", "section": "body_systems", "category": "neurological", "question_text": "How would you rate your memory and concentration?", "question_type": "slider", "min_value": 0, "max_value": 10, "weight": 1.0, "sort_order": 29},
    {"question_id": "neuro_2", "section": "body_systems", "category": "neurological", "question_text": "Do you experience headaches frequently?", "question_type": "single_select", "options": ["Never", "Rarely", "Sometimes", "Often", "Daily"], "weight": 1.0, "sort_order": 30},
    
    # 8 Body Systems - Cardiovascular
    {"question_id": "cardio_1", "section": "body_systems", "category": "cardiovascular", "question_text": "How would you rate your cardiovascular fitness?", "question_type": "slider", "min_value": 0, "max_value": 10, "weight": 1.0, "sort_order": 31},
    {"question_id": "cardio_2", "section": "body_systems", "category": "cardiovascular", "question_text": "Do you experience shortness of breath during light activity?", "question_type": "single_select", "options": ["Never", "Rarely", "Sometimes", "Often", "Always"], "weight": 1.0, "sort_order": 32},
    
    # 8 Body Systems - Nutritional
    {"question_id": "nutri_1", "section": "body_systems", "category": "nutritional", "question_text": "How balanced do you consider your diet?", "question_type": "slider", "min_value": 0, "max_value": 10, "weight": 1.0, "sort_order": 33},
    {"question_id": "nutri_2", "section": "body_systems", "category": "nutritional", "question_text": "How often do you eat processed foods?", "question_type": "single_select", "options": ["Never", "Rarely", "Sometimes", "Often", "Daily"], "weight": 1.0, "sort_order": 34},
    {"question_id": "nutri_3", "section": "body_systems", "category": "nutritional", "question_text": "Do you take any supplements?", "question_type": "single_select", "options": ["None", "Occasionally", "Regularly", "Daily"], "weight": 1.0, "sort_order": 35},
]

def calculate_scores(answers: List[AssessmentAnswer]) -> dict:
    """Calculate vitality and category scores from answers"""
    answer_map = {a.question_id: a for a in answers}
    
    # Helper to normalize answer to 0-100 scale
    def normalize_answer(question_id: str, answer_value) -> float:
        question = next((q for q in ASSESSMENT_QUESTIONS if q["question_id"] == question_id), None)
        if not question:
            return 50.0
        
        if question["question_type"] == "slider":
            return (answer_value / question.get("max_value", 10)) * 100
        elif question["question_type"] in ["single_select", "yes_no"]:
            options = question.get("options", [])
            if options and answer_value in options:
                idx = options.index(answer_value)
                # Reverse for negative questions
                if "discomfort" in question["question_text"].lower() or "pain" in question["question_text"].lower() or "often" in question["question_text"].lower() and "negative" in question.get("sentiment", ""):
                    return 100 - (idx / (len(options) - 1)) * 100
                return (idx / (len(options) - 1)) * 100
        return 50.0
    
    # Calculate aspect scores
    aspect_scores = {"mental": [], "emotional": [], "physical": [], "spiritual": []}
    body_system_scores = {"bioelectrical": [], "hydration": [], "circadian": [], "microbiome": [], "respiratory": [], "neurological": [], "cardiovascular": [], "nutritional": []}
    
    for question in ASSESSMENT_QUESTIONS:
        qid = question["question_id"]
        if qid in answer_map:
            score = normalize_answer(qid, answer_map[qid].answer_value)
            category = question["category"]
            if question["section"] == "aspects":
                aspect_scores[category].append(score)
            else:
                body_system_scores[category].append(score)
    
    # Average scores
    mental_score = sum(aspect_scores["mental"]) / len(aspect_scores["mental"]) if aspect_scores["mental"] else 50
    emotional_score = sum(aspect_scores["emotional"]) / len(aspect_scores["emotional"]) if aspect_scores["emotional"] else 50
    physical_score = sum(aspect_scores["physical"]) / len(aspect_scores["physical"]) if aspect_scores["physical"] else 50
    spiritual_score = sum(aspect_scores["spiritual"]) / len(aspect_scores["spiritual"]) if aspect_scores["spiritual"] else 50
    
    body_scores = {}
    for system, scores in body_system_scores.items():
        body_scores[system] = sum(scores) / len(scores) if scores else 50
    
    # Calculate vitality score (weighted average)
    vitality_score = (mental_score * 0.25 + emotional_score * 0.25 + physical_score * 0.25 + spiritual_score * 0.25)
    
    # Determine top focus areas (lowest scoring areas)
    all_scores = [
        ("Mental Clarity", mental_score),
        ("Emotional Balance", emotional_score),
        ("Physical Vitality", physical_score),
        ("Spiritual Connection", spiritual_score),
    ]
    all_scores.extend([(k.title(), v) for k, v in body_scores.items()])
    all_scores.sort(key=lambda x: x[1])
    top_focus = [x[0] for x in all_scores[:3]]
    
    return {
        "vitality_score": round(vitality_score, 1),
        "mental_score": round(mental_score, 1),
        "emotional_score": round(emotional_score, 1),
        "physical_score": round(physical_score, 1),
        "spiritual_score": round(spiritual_score, 1),
        "body_system_scores": {k: round(v, 1) for k, v in body_scores.items()},
        "top_focus_areas": top_focus
    }

@api_router.get("/assessment/questions")
async def get_assessment_questions():
    """Get all assessment questions"""
    return ASSESSMENT_QUESTIONS

@api_router.post("/assessment/submit")
async def submit_assessment(answers: List[AssessmentAnswer], user: dict = Depends(get_current_user)):
    """Submit assessment and calculate scores"""
    scores = calculate_scores(answers)
    
    response = AssessmentResponse(
        user_id=user["user_id"],
        answers=answers,
        **scores
    )
    
    await db.assessment_responses.insert_one(response.dict())
    
    # Update user onboarding status
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"onboarding_status": "completed", "onboarding_step": 10, "updated_at": datetime.now(timezone.utc)}}
    )
    
    # Award points for assessment completion
    reward = RewardEvent(
        user_id=user["user_id"],
        event_type="assessment_completed",
        points=250,
        category="onboarding",
        reference_id=response.response_id,
        note="Assessment completed!"
    )
    await db.reward_events.insert_one(reward.dict())
    
    return response

@api_router.get("/assessment/results")
async def get_assessment_results(user: dict = Depends(get_current_user)):
    """Get user's latest assessment results"""
    result = await db.assessment_responses.find_one(
        {"user_id": user["user_id"]},
        {"_id": 0}
    )
    if not result:
        raise HTTPException(status_code=404, detail="No assessment found")
    return result

# ============= LUCA AI ROUTES =============

@api_router.post("/luca/chat")
async def luca_chat(chat_req: ChatRequest, user: dict = Depends(get_current_user)):
    """Chat with LUCA AI"""
    session_id = chat_req.session_id or f"session_{user['user_id']}_{uuid.uuid4().hex[:8]}"
    
    # Get user's assessment data for context
    assessment = await db.assessment_responses.find_one({"user_id": user["user_id"]}, {"_id": 0})
    
    # Build context
    context_parts = [
        f"User: {user.get('name', 'Friend')}",
    ]
    if assessment:
        context_parts.append(f"Vitality Score: {assessment.get('vitality_score', 'Not assessed')}")
        context_parts.append(f"Mental: {assessment.get('mental_score', 'N/A')}, Emotional: {assessment.get('emotional_score', 'N/A')}, Physical: {assessment.get('physical_score', 'N/A')}, Spiritual: {assessment.get('spiritual_score', 'N/A')}")
        if assessment.get('top_focus_areas'):
            context_parts.append(f"Focus Areas: {', '.join(assessment['top_focus_areas'])}")
    
    user_context = "\n".join(context_parts)
    
    system_message = f"""You are LUCA, a warm, wise, and supportive holistic health guide for Solaris Holistic Health.

Your role is to:
- Help users understand their wellness picture in simple, encouraging language
- Suggest practical daily habits and routines
- Recommend exploration of practitioners, services, and workshops when appropriate
- Celebrate progress and encourage consistency
- Provide educational insights about holistic health

IMPORTANT GUIDELINES:
- Never diagnose medical conditions or replace professional medical advice
- Use supportive, hopeful, and calm language
- Be conversational and friendly, not clinical
- Reference the user's assessment data when helpful
- Keep responses concise but meaningful (2-4 paragraphs max)

USER CONTEXT:
{user_context}"""

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=system_message
        ).with_model("openai", "gpt-4o")
        
        # Get chat history
        history = await db.chat_messages.find(
            {"user_id": user["user_id"], "session_id": session_id},
            {"_id": 0}
        ).sort("created_at", 1).to_list(20)
        
        # Build message with history context
        history_text = ""
        for msg in history[-6:]:  # Last 6 messages for context
            role = "User" if msg["role"] == "user" else "LUCA"
            history_text += f"{role}: {msg['content']}\n"
        
        full_message = f"{history_text}User: {chat_req.message}" if history_text else chat_req.message
        
        user_message = UserMessage(text=full_message)
        response = await chat.send_message(user_message)
        
        # Save messages
        user_msg = ChatMessage(
            user_id=user["user_id"],
            session_id=session_id,
            role="user",
            content=chat_req.message
        )
        assistant_msg = ChatMessage(
            user_id=user["user_id"],
            session_id=session_id,
            role="assistant",
            content=response
        )
        await db.chat_messages.insert_many([user_msg.dict(), assistant_msg.dict()])
        
        return {
            "response": response,
            "session_id": session_id
        }
    except Exception as e:
        logger.error(f"LUCA chat error: {e}")
        raise HTTPException(status_code=500, detail="LUCA is taking a moment. Please try again.")

@api_router.get("/luca/history")
async def get_chat_history(session_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    """Get chat history"""
    query = {"user_id": user["user_id"]}
    if session_id:
        query["session_id"] = session_id
    
    messages = await db.chat_messages.find(
        query, {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    
    return messages

# ============= LISTING ROUTES =============

@api_router.get("/listings")
async def get_listings(
    listing_type: Optional[str] = None,
    featured: Optional[bool] = None,
    limit: int = 50
):
    """Get published listings"""
    query = {"status": "published"}
    if listing_type:
        query["listing_type"] = listing_type
    if featured is not None:
        query["featured"] = featured
    
    listings = await db.listings.find(query, {"_id": 0}).limit(limit).to_list(limit)
    return listings

@api_router.get("/listings/{listing_id}")
async def get_listing(listing_id: str):
    """Get a specific listing"""
    listing = await db.listings.find_one({"listing_id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return listing

@api_router.get("/listings/search/{query}")
async def search_listings(query: str, limit: int = 20):
    """Search listings"""
    search_filter = {
        "status": "published",
        "$or": [
            {"title": {"$regex": query, "$options": "i"}},
            {"short_description": {"$regex": query, "$options": "i"}},
            {"tags": {"$in": [query.lower()]}},
            {"specialties": {"$in": [query.lower()]}}
        ]
    }
    listings = await db.listings.find(search_filter, {"_id": 0}).limit(limit).to_list(limit)
    return listings

# ============= BOOKING ROUTES =============

@api_router.post("/bookings")
async def create_booking(booking: BookingCreate, user: dict = Depends(get_current_user)):
    """Create a booking request"""
    # Verify listing exists
    listing = await db.listings.find_one({"listing_id": booking.listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    booking_obj = BookingRequest(
        user_id=user["user_id"],
        **booking.dict()
    )
    await db.booking_requests.insert_one(booking_obj.dict())
    
    # Award points
    reward = RewardEvent(
        user_id=user["user_id"],
        event_type="booking_request",
        points=50,
        category="engagement",
        reference_id=booking_obj.booking_id,
        note=f"Booking requested: {listing.get('title', 'Service')}"
    )
    await db.reward_events.insert_one(reward.dict())
    
    return booking_obj

@api_router.get("/bookings")
async def get_user_bookings(user: dict = Depends(get_current_user)):
    """Get user's bookings"""
    bookings = await db.booking_requests.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    # Enrich with listing info
    for booking in bookings:
        listing = await db.listings.find_one({"listing_id": booking["listing_id"]}, {"_id": 0, "title": 1, "listing_type": 1, "cover_image": 1})
        booking["listing"] = listing
    
    return bookings

# ============= DAILY CHECKIN ROUTES =============

@api_router.post("/checkins")
async def create_checkin(checkin: DailyCheckinCreate, user: dict = Depends(get_current_user)):
    """Create daily check-in"""
    # Check if already checked in today
    existing = await db.daily_checkins.find_one({
        "user_id": user["user_id"],
        "checkin_date": checkin.checkin_date
    })
    
    if existing:
        # Update existing
        await db.daily_checkins.update_one(
            {"user_id": user["user_id"], "checkin_date": checkin.checkin_date},
            {"$set": checkin.dict()}
        )
        return await db.daily_checkins.find_one({"user_id": user["user_id"], "checkin_date": checkin.checkin_date}, {"_id": 0})
    
    checkin_obj = DailyCheckin(
        user_id=user["user_id"],
        **checkin.dict()
    )
    await db.daily_checkins.insert_one(checkin_obj.dict())
    
    # Award points
    reward = RewardEvent(
        user_id=user["user_id"],
        event_type="daily_checkin",
        points=25,
        category="consistency",
        reference_id=checkin_obj.checkin_id,
        note="Daily check-in completed"
    )
    await db.reward_events.insert_one(reward.dict())
    
    return checkin_obj

@api_router.get("/checkins")
async def get_checkins(limit: int = 30, user: dict = Depends(get_current_user)):
    """Get user's check-in history"""
    checkins = await db.daily_checkins.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).sort("checkin_date", -1).to_list(limit)
    return checkins

@api_router.get("/checkins/today")
async def get_today_checkin(user: dict = Depends(get_current_user)):
    """Get today's check-in"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    checkin = await db.daily_checkins.find_one(
        {"user_id": user["user_id"], "checkin_date": today},
        {"_id": 0}
    )
    return checkin or {"checked_in": False}

# ============= ADMIN ROUTES =============

@api_router.get("/admin/users")
async def admin_get_users(admin: dict = Depends(require_admin)):
    """Get all users (admin only)"""
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    return users

@api_router.get("/admin/users/{user_id}")
async def admin_get_user(user_id: str, admin: dict = Depends(require_admin)):
    """Get user detail (admin only)"""
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's assessment
    assessment = await db.assessment_responses.find_one({"user_id": user_id}, {"_id": 0})
    # Get user's rewards
    rewards = await db.reward_events.find({"user_id": user_id}, {"_id": 0}).to_list(50)
    total_points = sum(r.get("points", 0) for r in rewards)
    
    return {
        "user": user,
        "assessment": assessment,
        "total_points": total_points,
        "recent_rewards": rewards[:10]
    }

@api_router.post("/admin/listings")
async def admin_create_listing(listing: ListingCreate, admin: dict = Depends(require_admin)):
    """Create a new listing (admin only)"""
    listing_obj = Listing(
        created_by=admin["user_id"],
        **listing.dict()
    )
    # Generate slug
    listing_obj.slug = listing_obj.title.lower().replace(" ", "-")[:50]
    
    await db.listings.insert_one(listing_obj.dict())
    return listing_obj

@api_router.put("/admin/listings/{listing_id}")
async def admin_update_listing(listing_id: str, update: dict, admin: dict = Depends(require_admin)):
    """Update a listing (admin only)"""
    update["updated_at"] = datetime.now(timezone.utc)
    await db.listings.update_one(
        {"listing_id": listing_id},
        {"$set": update}
    )
    return await db.listings.find_one({"listing_id": listing_id}, {"_id": 0})

@api_router.delete("/admin/listings/{listing_id}")
async def admin_delete_listing(listing_id: str, admin: dict = Depends(require_admin)):
    """Delete a listing (admin only)"""
    await db.listings.delete_one({"listing_id": listing_id})
    return {"deleted": True}

@api_router.get("/admin/listings")
async def admin_get_listings(admin: dict = Depends(require_admin)):
    """Get all listings (admin only)"""
    listings = await db.listings.find({}, {"_id": 0}).to_list(500)
    return listings

@api_router.get("/admin/bookings")
async def admin_get_bookings(status: Optional[str] = None, admin: dict = Depends(require_admin)):
    """Get all bookings (admin only)"""
    query = {}
    if status:
        query["status"] = status
    
    bookings = await db.booking_requests.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    
    # Enrich with user and listing info
    for booking in bookings:
        user = await db.users.find_one({"user_id": booking["user_id"]}, {"_id": 0, "name": 1, "email": 1})
        listing = await db.listings.find_one({"listing_id": booking["listing_id"]}, {"_id": 0, "title": 1, "listing_type": 1})
        booking["user"] = user
        booking["listing"] = listing
    
    return bookings

@api_router.put("/admin/bookings/{booking_id}")
async def admin_update_booking(booking_id: str, update: dict, admin: dict = Depends(require_admin)):
    """Update booking status (admin only)"""
    update["updated_at"] = datetime.now(timezone.utc)
    await db.booking_requests.update_one(
        {"booking_id": booking_id},
        {"$set": update}
    )
    return await db.booking_requests.find_one({"booking_id": booking_id}, {"_id": 0})

@api_router.get("/admin/stats")
async def admin_get_stats(admin: dict = Depends(require_admin)):
    """Get dashboard stats (admin only)"""
    total_users = await db.users.count_documents({})
    completed_onboarding = await db.users.count_documents({"onboarding_status": "completed"})
    total_assessments = await db.assessment_responses.count_documents({})
    total_bookings = await db.booking_requests.count_documents({})
    pending_bookings = await db.booking_requests.count_documents({"status": "pending"})
    total_listings = await db.listings.count_documents({})
    published_listings = await db.listings.count_documents({"status": "published"})
    
    # Recent signups
    recent_users = await db.users.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    
    return {
        "total_users": total_users,
        "completed_onboarding": completed_onboarding,
        "onboarding_rate": round(completed_onboarding / total_users * 100, 1) if total_users > 0 else 0,
        "total_assessments": total_assessments,
        "total_bookings": total_bookings,
        "pending_bookings": pending_bookings,
        "total_listings": total_listings,
        "published_listings": published_listings,
        "recent_users": recent_users
    }

# ============= SEED DATA =============

@api_router.post("/admin/seed")
async def seed_data(admin: dict = Depends(require_admin)):
    """Seed sample data (admin only)"""
    # Sample listings
    sample_listings = [
        {
            "listing_type": "practitioner",
            "node_type": "practitioner_node",
            "status": "published",
            "title": "Dr. Elena Voss",
            "short_description": "Integrative medicine specialist focusing on mind-body connection",
            "full_description": "Dr. Voss combines Western medicine with holistic approaches to create personalized healing journeys.",
            "tagline": "Healing through integration",
            "city": "Medellín",
            "country": "Colombia",
            "languages": ["English", "Spanish"],
            "booking_enabled": True,
            "featured": True,
            "price_range_min": 150,
            "price_range_max": 300,
            "currency": "USD",
            "specialties": ["Integrative Medicine", "Stress Management", "Chronic Conditions"],
            "body_systems_supported": ["neurological", "cardiovascular", "respiratory"],
            "tags": ["holistic", "integrative", "mind-body"]
        },
        {
            "listing_type": "practitioner",
            "node_type": "practitioner_node",
            "status": "published",
            "title": "Maya Chen",
            "short_description": "Traditional Chinese Medicine & Acupuncture specialist",
            "tagline": "Ancient wisdom, modern healing",
            "city": "Medellín",
            "country": "Colombia",
            "languages": ["English", "Mandarin", "Spanish"],
            "booking_enabled": True,
            "featured": True,
            "price_range_min": 80,
            "price_range_max": 150,
            "specialties": ["Acupuncture", "Herbal Medicine", "Energy Healing"],
            "body_systems_supported": ["bioelectrical", "circadian", "microbiome"],
            "tags": ["tcm", "acupuncture", "energy"]
        },
        {
            "listing_type": "clinic",
            "node_type": "care_node",
            "status": "published",
            "title": "Solaris Wellness Center",
            "short_description": "Premium holistic health center offering comprehensive wellness programs",
            "tagline": "Your sanctuary for healing",
            "city": "Medellín",
            "country": "Colombia",
            "languages": ["English", "Spanish"],
            "booking_enabled": True,
            "featured": True,
            "specialties": ["Wellness Programs", "Detox", "Regenerative Therapies"],
            "body_systems_supported": ["hydration", "nutritional", "circadian", "microbiome"],
            "tags": ["wellness", "detox", "premium"]
        },
        {
            "listing_type": "workshop",
            "node_type": "education_node",
            "status": "published",
            "title": "Breathwork & Meditation Intensive",
            "short_description": "3-day immersive workshop to master breathwork techniques",
            "tagline": "Breathe your way to clarity",
            "city": "Medellín",
            "country": "Colombia",
            "languages": ["English"],
            "booking_enabled": True,
            "featured": False,
            "price_range_min": 250,
            "price_range_max": 250,
            "specialties": ["Breathwork", "Meditation", "Stress Relief"],
            "body_systems_supported": ["respiratory", "neurological", "bioelectrical"],
            "tags": ["breathwork", "meditation", "workshop"]
        },
        {
            "listing_type": "service",
            "node_type": "protocol_node",
            "status": "published",
            "title": "Comprehensive Health Assessment",
            "short_description": "Full-body diagnostic assessment with personalized recommendations",
            "tagline": "Know your body deeply",
            "languages": ["English", "Spanish"],
            "booking_enabled": True,
            "price_range_min": 500,
            "price_range_max": 800,
            "specialties": ["Diagnostics", "Assessment", "Personalized Plans"],
            "body_systems_supported": ["cardiovascular", "neurological", "nutritional", "microbiome"],
            "tags": ["assessment", "diagnostics", "comprehensive"]
        },
        {
            "listing_type": "practitioner",
            "node_type": "practitioner_node",
            "status": "published",
            "title": "Dr. James Rivera",
            "short_description": "Functional medicine doctor specializing in gut health",
            "tagline": "Heal your gut, heal your life",
            "city": "Bogotá",
            "country": "Colombia",
            "languages": ["English", "Spanish"],
            "booking_enabled": True,
            "price_range_min": 120,
            "price_range_max": 250,
            "specialties": ["Functional Medicine", "Gut Health", "Nutrition"],
            "body_systems_supported": ["microbiome", "nutritional", "neurological"],
            "tags": ["functional", "gut-health", "nutrition"]
        },
        {
            "listing_type": "place",
            "node_type": "place_node",
            "status": "published",
            "title": "Mountain Retreat Center",
            "short_description": "Serene mountain retreat for healing and rejuvenation",
            "tagline": "Find peace in nature",
            "city": "Guatapé",
            "country": "Colombia",
            "languages": ["English", "Spanish"],
            "booking_enabled": True,
            "featured": True,
            "specialties": ["Retreat", "Nature Therapy", "Digital Detox"],
            "body_systems_supported": ["circadian", "respiratory", "bioelectrical"],
            "tags": ["retreat", "nature", "peaceful"]
        },
        {
            "listing_type": "program",
            "node_type": "protocol_node",
            "status": "published",
            "title": "21-Day Vitality Reset",
            "short_description": "Comprehensive program to reset your energy and vitality",
            "tagline": "Transform in 21 days",
            "languages": ["English"],
            "booking_enabled": True,
            "price_range_min": 400,
            "price_range_max": 400,
            "specialties": ["Vitality", "Energy", "Lifestyle Reset"],
            "body_systems_supported": ["hydration", "circadian", "nutritional", "bioelectrical"],
            "tags": ["program", "reset", "vitality"]
        }
    ]
    
    for listing_data in sample_listings:
        listing = Listing(**listing_data)
        listing.slug = listing.title.lower().replace(" ", "-").replace(".", "")[:50]
        existing = await db.listings.find_one({"title": listing.title})
        if not existing:
            await db.listings.insert_one(listing.dict())
    
    return {"message": "Seed data created", "listings_added": len(sample_listings)}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
