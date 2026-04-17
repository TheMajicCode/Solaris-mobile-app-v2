"""
Solaris Holistic Health - Comprehensive Seed Data Script
Generates demo-ready data for the MVP
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
import uuid
import random

# MongoDB connection
client = AsyncIOMotorClient('mongodb://localhost:27017')
db = client['solaris_health']

# Helper function to generate IDs
def gen_id(prefix):
    return f"{prefix}_{uuid.uuid4().hex[:12]}"

# Sample data
FIRST_NAMES = ["Emma", "Liam", "Olivia", "Noah", "Ava", "Ethan", "Sophia", "Mason", "Isabella", "William", 
               "Mia", "James", "Charlotte", "Benjamin", "Amelia", "Lucas", "Harper", "Henry", "Evelyn", "Alexander"]
LAST_NAMES = ["Garcia", "Rodriguez", "Martinez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore",
              "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez"]

CITIES = ["Medellín", "Bogotá", "Cartagena", "Cali", "Santa Marta", "Barranquilla"]
COUNTRIES = ["Colombia"]

SPECIALTIES = [
    "Integrative Medicine", "Functional Medicine", "Traditional Chinese Medicine", "Ayurveda",
    "Naturopathy", "Holistic Nutrition", "Energy Healing", "Breathwork", "Meditation",
    "Acupuncture", "Massage Therapy", "Yoga Therapy", "Sound Healing", "Reiki",
    "Herbalism", "Homeopathy", "Chiropractic", "Osteopathy", "Craniosacral Therapy"
]

BODY_SYSTEMS = ["bioelectrical", "hydration", "circadian", "microbiome", "respiratory", "neurological", "cardiovascular", "nutritional"]

GOALS = ["energy", "stress", "sleep", "focus", "balance", "weight", "pain", "longevity"]

async def clear_existing_data():
    """Clear existing seed data (keep real users)"""
    # Keep users that have actually signed in (have sessions)
    print("Preserving real user data...")
    
async def create_users():
    """Create 20 sample users"""
    print("Creating sample users...")
    users = []
    
    for i in range(20):
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        user = {
            "user_id": gen_id("user"),
            "email": f"{first.lower()}.{last.lower()}{i}@example.com",
            "name": f"{first} {last}",
            "first_name": first,
            "last_name": last,
            "display_name": first,
            "role": "user",
            "country": random.choice(COUNTRIES),
            "city": random.choice(CITIES),
            "language": "en",
            "goals_text": ", ".join(random.sample(GOALS, 3)),
            "preferred_guidance": random.choice(["self-guided", "practitioner-guided", "mixed"]),
            "onboarding_status": random.choice(["completed", "completed", "completed", "in_progress"]),
            "onboarding_step": random.randint(5, 10),
            "created_at": datetime.now(timezone.utc) - timedelta(days=random.randint(1, 60)),
            "updated_at": datetime.now(timezone.utc)
        }
        users.append(user)
    
    # Insert if not exists
    for user in users:
        existing = await db.users.find_one({"email": user["email"]})
        if not existing:
            await db.users.insert_one(user)
    
    print(f"Created {len(users)} sample users")
    return users

async def create_practitioners():
    """Create 8 practitioner listings"""
    print("Creating practitioners...")
    practitioners = [
        {
            "listing_type": "practitioner",
            "node_type": "practitioner_node",
            "status": "published",
            "title": "Dr. Elena Voss",
            "short_description": "Integrative medicine specialist focusing on mind-body connection and chronic condition management.",
            "full_description": "Dr. Elena Voss brings 15 years of experience combining Western medicine with holistic approaches. She specializes in helping patients understand the root causes of their health challenges and creates personalized healing journeys that address mental, emotional, and physical wellbeing.",
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
            "goals_supported": ["energy", "stress", "balance"],
            "tags": ["holistic", "integrative", "mind-body", "chronic-care"]
        },
        {
            "listing_type": "practitioner",
            "node_type": "practitioner_node",
            "status": "published",
            "title": "Maya Chen, L.Ac",
            "short_description": "Traditional Chinese Medicine practitioner specializing in acupuncture and herbal medicine.",
            "full_description": "Maya Chen has studied extensively in both China and the United States, bringing authentic TCM wisdom to modern wellness seekers. Her gentle approach to acupuncture and customized herbal formulas have helped hundreds of patients restore balance and vitality.",
            "tagline": "Ancient wisdom, modern healing",
            "city": "Medellín",
            "country": "Colombia",
            "languages": ["English", "Mandarin", "Spanish"],
            "booking_enabled": True,
            "featured": True,
            "price_range_min": 80,
            "price_range_max": 150,
            "currency": "USD",
            "specialties": ["Acupuncture", "Herbal Medicine", "Energy Healing"],
            "body_systems_supported": ["bioelectrical", "circadian", "microbiome"],
            "goals_supported": ["energy", "sleep", "pain"],
            "tags": ["tcm", "acupuncture", "herbal", "energy"]
        },
        {
            "listing_type": "practitioner",
            "node_type": "practitioner_node",
            "status": "published",
            "title": "Dr. James Rivera",
            "short_description": "Functional medicine doctor specializing in gut health and microbiome optimization.",
            "full_description": "Dr. Rivera takes a systems-biology approach to health, recognizing that gut health is foundational to overall wellbeing. Using advanced testing and personalized protocols, he helps patients optimize their microbiome and resolve chronic digestive issues.",
            "tagline": "Heal your gut, heal your life",
            "city": "Bogotá",
            "country": "Colombia",
            "languages": ["English", "Spanish"],
            "booking_enabled": True,
            "featured": False,
            "price_range_min": 120,
            "price_range_max": 250,
            "currency": "USD",
            "specialties": ["Functional Medicine", "Gut Health", "Nutrition"],
            "body_systems_supported": ["microbiome", "nutritional", "neurological"],
            "goals_supported": ["energy", "weight", "focus"],
            "tags": ["functional", "gut-health", "microbiome", "nutrition"]
        },
        {
            "listing_type": "practitioner",
            "node_type": "practitioner_node",
            "status": "published",
            "title": "Sofia Morales",
            "short_description": "Certified breathwork facilitator and meditation teacher with trauma-informed approach.",
            "full_description": "Sofia guides individuals through transformative breathwork experiences that release stored tension and emotional blockages. Her trauma-informed approach creates a safe space for deep healing and self-discovery.",
            "tagline": "Breathe into your power",
            "city": "Cartagena",
            "country": "Colombia",
            "languages": ["English", "Spanish"],
            "booking_enabled": True,
            "featured": True,
            "price_range_min": 60,
            "price_range_max": 120,
            "currency": "USD",
            "specialties": ["Breathwork", "Meditation", "Trauma Release"],
            "body_systems_supported": ["respiratory", "neurological", "bioelectrical"],
            "goals_supported": ["stress", "balance", "sleep"],
            "tags": ["breathwork", "meditation", "trauma", "healing"]
        },
        {
            "listing_type": "practitioner",
            "node_type": "practitioner_node",
            "status": "published",
            "title": "Dr. Andreas Schmidt",
            "short_description": "Naturopathic physician specializing in bioregulatory medicine and detoxification.",
            "full_description": "Dr. Schmidt combines European naturopathic traditions with cutting-edge bioregulatory approaches. His detoxification protocols and regenerative therapies help patients recover vitality and optimize their body's natural healing capacity.",
            "tagline": "Restore your natural vitality",
            "city": "Medellín",
            "country": "Colombia",
            "languages": ["English", "German", "Spanish"],
            "booking_enabled": True,
            "featured": False,
            "price_range_min": 200,
            "price_range_max": 400,
            "currency": "USD",
            "specialties": ["Naturopathy", "Detoxification", "Bioregulatory Medicine"],
            "body_systems_supported": ["hydration", "nutritional", "cardiovascular"],
            "goals_supported": ["energy", "longevity", "weight"],
            "tags": ["naturopathy", "detox", "regenerative", "european"]
        },
        {
            "listing_type": "practitioner",
            "node_type": "practitioner_node",
            "status": "published",
            "title": "Lucia Fernandez",
            "short_description": "Holistic nutritionist and Ayurvedic consultant helping clients find their optimal diet.",
            "full_description": "Lucia blends modern nutritional science with ancient Ayurvedic wisdom to create personalized eating plans that honor each individual's unique constitution. Her approach goes beyond calories to address the energetic qualities of food.",
            "tagline": "Nourish your unique nature",
            "city": "Cali",
            "country": "Colombia",
            "languages": ["English", "Spanish"],
            "booking_enabled": True,
            "featured": False,
            "price_range_min": 70,
            "price_range_max": 140,
            "currency": "USD",
            "specialties": ["Holistic Nutrition", "Ayurveda", "Diet Planning"],
            "body_systems_supported": ["nutritional", "microbiome", "circadian"],
            "goals_supported": ["weight", "energy", "balance"],
            "tags": ["nutrition", "ayurveda", "diet", "holistic"]
        },
        {
            "listing_type": "practitioner",
            "node_type": "practitioner_node",
            "status": "published",
            "title": "Marco Torres",
            "short_description": "Sound healer and vibrational therapist using crystal bowls and tuning forks.",
            "full_description": "Marco creates immersive sound healing experiences that bring the body into deep states of relaxation and regeneration. His sessions use crystal singing bowls, tuning forks, and voice to harmonize the body's energy systems.",
            "tagline": "Tune into harmony",
            "city": "Santa Marta",
            "country": "Colombia",
            "languages": ["English", "Spanish"],
            "booking_enabled": True,
            "featured": False,
            "price_range_min": 50,
            "price_range_max": 100,
            "currency": "USD",
            "specialties": ["Sound Healing", "Vibrational Therapy", "Energy Work"],
            "body_systems_supported": ["bioelectrical", "neurological", "circadian"],
            "goals_supported": ["stress", "sleep", "balance"],
            "tags": ["sound", "healing", "vibration", "relaxation"]
        },
        {
            "listing_type": "practitioner",
            "node_type": "practitioner_node",
            "status": "published",
            "title": "Dr. Patricia Reyes",
            "short_description": "Mind-body medicine specialist with expertise in psychoneuroimmunology.",
            "full_description": "Dr. Reyes explores the fascinating connections between mind, brain, and immune system. Her integrative approach helps patients understand how thoughts and emotions influence physical health, and provides tools for lasting transformation.",
            "tagline": "Transform mind, transform health",
            "city": "Bogotá",
            "country": "Colombia",
            "languages": ["English", "Spanish", "Portuguese"],
            "booking_enabled": True,
            "featured": True,
            "price_range_min": 130,
            "price_range_max": 260,
            "currency": "USD",
            "specialties": ["Mind-Body Medicine", "Psychoneuroimmunology", "Stress Medicine"],
            "body_systems_supported": ["neurological", "cardiovascular", "respiratory"],
            "goals_supported": ["stress", "focus", "balance"],
            "tags": ["mind-body", "pni", "stress", "integrative"]
        }
    ]
    
    for p in practitioners:
        p["listing_id"] = gen_id("list")
        p["slug"] = p["title"].lower().replace(" ", "-").replace(".", "").replace(",", "")[:50]
        p["created_at"] = datetime.now(timezone.utc) - timedelta(days=random.randint(10, 90))
        p["updated_at"] = datetime.now(timezone.utc)
        
        existing = await db.listings.find_one({"title": p["title"]})
        if not existing:
            await db.listings.insert_one(p)
    
    print(f"Created {len(practitioners)} practitioners")
    return practitioners

async def create_clinics():
    """Create 4 clinic/place listings"""
    print("Creating clinics and places...")
    clinics = [
        {
            "listing_type": "clinic",
            "node_type": "care_node",
            "status": "published",
            "title": "Solaris Wellness Center",
            "short_description": "Premium holistic health center offering comprehensive wellness programs and regenerative therapies.",
            "full_description": "Solaris Wellness Center is a sanctuary for healing, bringing together world-class practitioners and cutting-edge therapies in a beautiful, nurturing environment. Our comprehensive programs address all dimensions of health—physical, mental, emotional, and spiritual.",
            "tagline": "Your sanctuary for healing",
            "city": "Medellín",
            "country": "Colombia",
            "address": "Calle 10 #43E-25, El Poblado",
            "languages": ["English", "Spanish"],
            "booking_enabled": True,
            "featured": True,
            "price_range_min": 200,
            "price_range_max": 2000,
            "currency": "USD",
            "specialties": ["Wellness Programs", "Detox", "Regenerative Therapies", "IV Therapy"],
            "body_systems_supported": ["hydration", "nutritional", "circadian", "microbiome", "cardiovascular"],
            "goals_supported": ["energy", "longevity", "weight", "stress"],
            "tags": ["wellness", "detox", "premium", "comprehensive"]
        },
        {
            "listing_type": "clinic",
            "node_type": "care_node",
            "status": "published",
            "title": "Raíces Healing Collective",
            "short_description": "Community-centered healing space offering traditional and indigenous healing practices.",
            "full_description": "Raíces honors the wisdom of indigenous healing traditions while creating accessible pathways to holistic health. Our collective of healers offers plant medicine consultations, traditional ceremonies, and community healing circles.",
            "tagline": "Healing rooted in tradition",
            "city": "Bogotá",
            "country": "Colombia",
            "languages": ["Spanish", "English"],
            "booking_enabled": True,
            "featured": False,
            "price_range_min": 50,
            "price_range_max": 300,
            "currency": "USD",
            "specialties": ["Traditional Medicine", "Plant Medicine", "Community Healing"],
            "body_systems_supported": ["bioelectrical", "neurological", "microbiome"],
            "goals_supported": ["balance", "stress", "focus"],
            "tags": ["traditional", "indigenous", "community", "plant-medicine"]
        },
        {
            "listing_type": "place",
            "node_type": "place_node",
            "status": "published",
            "title": "Mountain Retreat Center",
            "short_description": "Serene mountain retreat for healing, rejuvenation, and digital detox experiences.",
            "full_description": "Nestled in the lush mountains of Antioquia, our retreat center offers the perfect environment for deep rest and renewal. With comfortable eco-lodges, organic gardens, and stunning natural surroundings, guests can fully disconnect and reconnect with themselves.",
            "tagline": "Find peace in nature",
            "city": "Guatapé",
            "country": "Colombia",
            "languages": ["English", "Spanish"],
            "booking_enabled": True,
            "featured": True,
            "price_range_min": 150,
            "price_range_max": 500,
            "currency": "USD",
            "specialties": ["Retreat", "Nature Therapy", "Digital Detox", "Meditation"],
            "body_systems_supported": ["circadian", "respiratory", "bioelectrical", "neurological"],
            "goals_supported": ["stress", "sleep", "balance"],
            "tags": ["retreat", "nature", "peaceful", "detox"]
        },
        {
            "listing_type": "place",
            "node_type": "place_node",
            "status": "published",
            "title": "Ocean Spirit Sanctuary",
            "short_description": "Beachfront wellness sanctuary combining ocean therapy with holistic healing practices.",
            "full_description": "Ocean Spirit Sanctuary harnesses the healing power of the Caribbean Sea alongside expert practitioners to offer unique oceanside wellness experiences. From sunrise yoga on the beach to therapeutic seawater treatments, every element supports your healing journey.",
            "tagline": "Heal with the rhythm of the sea",
            "city": "Santa Marta",
            "country": "Colombia",
            "languages": ["English", "Spanish"],
            "booking_enabled": True,
            "featured": True,
            "price_range_min": 200,
            "price_range_max": 800,
            "currency": "USD",
            "specialties": ["Ocean Therapy", "Yoga", "Thalassotherapy", "Meditation"],
            "body_systems_supported": ["respiratory", "hydration", "circadian", "bioelectrical"],
            "goals_supported": ["stress", "energy", "balance"],
            "tags": ["ocean", "beach", "yoga", "therapy"]
        }
    ]
    
    for c in clinics:
        c["listing_id"] = gen_id("list")
        c["slug"] = c["title"].lower().replace(" ", "-")[:50]
        c["created_at"] = datetime.now(timezone.utc) - timedelta(days=random.randint(30, 120))
        c["updated_at"] = datetime.now(timezone.utc)
        
        existing = await db.listings.find_one({"title": c["title"]})
        if not existing:
            await db.listings.insert_one(c)
    
    print(f"Created {len(clinics)} clinics/places")
    return clinics

async def create_services():
    """Create 10 service listings"""
    print("Creating services...")
    services = [
        {
            "listing_type": "service",
            "node_type": "protocol_node",
            "status": "published",
            "title": "Comprehensive Health Assessment",
            "short_description": "Full-body diagnostic assessment with advanced testing and personalized recommendations.",
            "full_description": "Our comprehensive assessment includes advanced biomarkers, genetic insights, microbiome analysis, and functional testing to create a complete picture of your health. You'll receive a detailed report and personalized protocol.",
            "tagline": "Know your body deeply",
            "languages": ["English", "Spanish"],
            "booking_enabled": True,
            "featured": True,
            "price_range_min": 500,
            "price_range_max": 1200,
            "currency": "USD",
            "specialties": ["Diagnostics", "Assessment", "Personalized Plans"],
            "body_systems_supported": ["cardiovascular", "neurological", "nutritional", "microbiome", "hydration"],
            "goals_supported": ["energy", "longevity", "focus"],
            "tags": ["assessment", "diagnostics", "comprehensive", "testing"]
        },
        {
            "listing_type": "service",
            "node_type": "protocol_node",
            "status": "published",
            "title": "IV Nutrient Therapy",
            "short_description": "Customized intravenous nutrient infusions for rapid hydration and vitality boost.",
            "tagline": "Restore from within",
            "languages": ["English", "Spanish"],
            "booking_enabled": True,
            "price_range_min": 100,
            "price_range_max": 300,
            "currency": "USD",
            "specialties": ["IV Therapy", "Hydration", "Nutrient Infusion"],
            "body_systems_supported": ["hydration", "nutritional", "cardiovascular"],
            "goals_supported": ["energy", "longevity"],
            "tags": ["iv", "nutrients", "hydration", "infusion"]
        },
        {
            "listing_type": "service",
            "node_type": "protocol_node",
            "status": "published",
            "title": "Colon Hydrotherapy",
            "short_description": "Gentle colon cleansing to support detoxification and digestive health.",
            "tagline": "Clean gut, clear mind",
            "languages": ["English", "Spanish"],
            "booking_enabled": True,
            "price_range_min": 80,
            "price_range_max": 150,
            "currency": "USD",
            "specialties": ["Colon Hydrotherapy", "Detox", "Digestive Health"],
            "body_systems_supported": ["microbiome", "hydration", "nutritional"],
            "goals_supported": ["weight", "energy"],
            "tags": ["colon", "detox", "digestive", "cleanse"]
        },
        {
            "listing_type": "service",
            "node_type": "protocol_node",
            "status": "published",
            "title": "Hyperbaric Oxygen Therapy",
            "short_description": "Pressurized oxygen treatment for cellular regeneration and recovery.",
            "tagline": "Breathe life into your cells",
            "languages": ["English", "Spanish"],
            "booking_enabled": True,
            "price_range_min": 100,
            "price_range_max": 200,
            "currency": "USD",
            "specialties": ["HBOT", "Oxygen Therapy", "Regeneration"],
            "body_systems_supported": ["respiratory", "cardiovascular", "neurological"],
            "goals_supported": ["energy", "longevity", "pain"],
            "tags": ["hyperbaric", "oxygen", "regeneration", "recovery"]
        },
        {
            "listing_type": "service",
            "node_type": "protocol_node",
            "status": "published",
            "title": "Cryotherapy Session",
            "short_description": "Whole-body cold therapy for inflammation reduction and recovery.",
            "tagline": "Cool down, power up",
            "languages": ["English", "Spanish"],
            "booking_enabled": True,
            "price_range_min": 50,
            "price_range_max": 100,
            "currency": "USD",
            "specialties": ["Cryotherapy", "Recovery", "Inflammation"],
            "body_systems_supported": ["cardiovascular", "neurological", "bioelectrical"],
            "goals_supported": ["pain", "energy", "longevity"],
            "tags": ["cryo", "cold", "recovery", "inflammation"]
        },
        {
            "listing_type": "service",
            "node_type": "protocol_node",
            "status": "published",
            "title": "Infrared Sauna Session",
            "short_description": "Deep-penetrating infrared heat for detoxification and relaxation.",
            "tagline": "Sweat out the stress",
            "languages": ["English", "Spanish"],
            "booking_enabled": True,
            "price_range_min": 30,
            "price_range_max": 60,
            "currency": "USD",
            "specialties": ["Infrared Sauna", "Detox", "Relaxation"],
            "body_systems_supported": ["hydration", "cardiovascular", "circadian"],
            "goals_supported": ["stress", "weight", "sleep"],
            "tags": ["sauna", "infrared", "detox", "relaxation"]
        },
        {
            "listing_type": "service",
            "node_type": "protocol_node",
            "status": "published",
            "title": "Neurofeedback Training",
            "short_description": "Brain training technology to optimize focus, calm, and cognitive performance.",
            "tagline": "Train your brain",
            "languages": ["English", "Spanish"],
            "booking_enabled": True,
            "price_range_min": 100,
            "price_range_max": 200,
            "currency": "USD",
            "specialties": ["Neurofeedback", "Brain Training", "Cognitive Enhancement"],
            "body_systems_supported": ["neurological", "bioelectrical"],
            "goals_supported": ["focus", "stress", "sleep"],
            "tags": ["neurofeedback", "brain", "cognitive", "training"]
        },
        {
            "listing_type": "service",
            "node_type": "protocol_node",
            "status": "published",
            "title": "Lymphatic Drainage Massage",
            "short_description": "Specialized massage technique to support lymphatic flow and detoxification.",
            "tagline": "Flow freely",
            "languages": ["English", "Spanish"],
            "booking_enabled": True,
            "price_range_min": 70,
            "price_range_max": 120,
            "currency": "USD",
            "specialties": ["Lymphatic Massage", "Detox", "Bodywork"],
            "body_systems_supported": ["hydration", "cardiovascular", "nutritional"],
            "goals_supported": ["weight", "energy"],
            "tags": ["lymphatic", "massage", "detox", "bodywork"]
        },
        {
            "listing_type": "service",
            "node_type": "protocol_node",
            "status": "published",
            "title": "Ozone Therapy",
            "short_description": "Medical ozone treatments for immune support and cellular oxygenation.",
            "tagline": "Energize at the cellular level",
            "languages": ["English", "Spanish"],
            "booking_enabled": True,
            "price_range_min": 80,
            "price_range_max": 180,
            "currency": "USD",
            "specialties": ["Ozone Therapy", "Immune Support", "Oxidative Therapy"],
            "body_systems_supported": ["respiratory", "cardiovascular", "bioelectrical"],
            "goals_supported": ["energy", "longevity"],
            "tags": ["ozone", "immune", "oxygen", "therapy"]
        },
        {
            "listing_type": "service",
            "node_type": "protocol_node",
            "status": "published",
            "title": "Float Tank Experience",
            "short_description": "Sensory deprivation floating for deep relaxation and mental clarity.",
            "tagline": "Float into stillness",
            "languages": ["English", "Spanish"],
            "booking_enabled": True,
            "price_range_min": 60,
            "price_range_max": 100,
            "currency": "USD",
            "specialties": ["Float Therapy", "Sensory Deprivation", "Relaxation"],
            "body_systems_supported": ["neurological", "circadian", "bioelectrical"],
            "goals_supported": ["stress", "sleep", "focus"],
            "tags": ["float", "sensory", "relaxation", "meditation"]
        }
    ]
    
    for s in services:
        s["listing_id"] = gen_id("list")
        s["slug"] = s["title"].lower().replace(" ", "-")[:50]
        s["created_at"] = datetime.now(timezone.utc) - timedelta(days=random.randint(5, 60))
        s["updated_at"] = datetime.now(timezone.utc)
        
        existing = await db.listings.find_one({"title": s["title"]})
        if not existing:
            await db.listings.insert_one(s)
    
    print(f"Created {len(services)} services")
    return services

async def create_workshops():
    """Create 4 workshop listings"""
    print("Creating workshops...")
    workshops = [
        {
            "listing_type": "workshop",
            "node_type": "education_node",
            "status": "published",
            "title": "Breathwork & Meditation Intensive",
            "short_description": "3-day immersive workshop to master breathwork techniques and establish a meditation practice.",
            "full_description": "This transformative intensive guides you through multiple breathwork modalities and meditation styles. You'll leave with practical tools for daily stress management and a deeper connection to your inner wisdom.",
            "tagline": "Breathe your way to clarity",
            "city": "Medellín",
            "country": "Colombia",
            "languages": ["English", "Spanish"],
            "booking_enabled": True,
            "featured": True,
            "price_range_min": 250,
            "price_range_max": 350,
            "currency": "USD",
            "specialties": ["Breathwork", "Meditation", "Stress Relief", "Mindfulness"],
            "body_systems_supported": ["respiratory", "neurological", "bioelectrical"],
            "goals_supported": ["stress", "focus", "sleep"],
            "tags": ["breathwork", "meditation", "workshop", "intensive"]
        },
        {
            "listing_type": "workshop",
            "node_type": "education_node",
            "status": "published",
            "title": "Nutrition for Vitality",
            "short_description": "Full-day workshop on optimizing your diet for energy, longevity, and mental clarity.",
            "full_description": "Learn the principles of functional nutrition, understand how food affects your unique body, and create a personalized eating plan. Includes cooking demonstration and recipe book.",
            "tagline": "Eat for your best life",
            "city": "Bogotá",
            "country": "Colombia",
            "languages": ["English", "Spanish"],
            "booking_enabled": True,
            "price_range_min": 120,
            "price_range_max": 180,
            "currency": "USD",
            "specialties": ["Nutrition", "Cooking", "Functional Food"],
            "body_systems_supported": ["nutritional", "microbiome", "circadian"],
            "goals_supported": ["energy", "weight", "focus"],
            "tags": ["nutrition", "cooking", "workshop", "vitality"]
        },
        {
            "listing_type": "workshop",
            "node_type": "education_node",
            "status": "published",
            "title": "Sleep Optimization Masterclass",
            "short_description": "Learn science-backed strategies to transform your sleep and wake up energized.",
            "full_description": "Poor sleep affects every aspect of health. This workshop covers sleep science, circadian rhythm optimization, sleep environment design, and natural remedies for better rest.",
            "tagline": "Master the art of rest",
            "city": "Cartagena",
            "country": "Colombia",
            "languages": ["English", "Spanish"],
            "booking_enabled": True,
            "price_range_min": 100,
            "price_range_max": 150,
            "currency": "USD",
            "specialties": ["Sleep Science", "Circadian Health", "Natural Remedies"],
            "body_systems_supported": ["circadian", "neurological", "bioelectrical"],
            "goals_supported": ["sleep", "energy", "stress"],
            "tags": ["sleep", "circadian", "workshop", "optimization"]
        },
        {
            "listing_type": "workshop",
            "node_type": "education_node",
            "status": "published",
            "title": "Emotional Intelligence & Healing",
            "short_description": "Two-day workshop on understanding emotions, releasing trauma, and building resilience.",
            "full_description": "Explore the landscape of your emotions in a safe, supportive environment. Learn somatic practices, emotional release techniques, and build lasting emotional intelligence.",
            "tagline": "Feel to heal",
            "city": "Medellín",
            "country": "Colombia",
            "languages": ["English", "Spanish"],
            "booking_enabled": True,
            "featured": True,
            "price_range_min": 200,
            "price_range_max": 300,
            "currency": "USD",
            "specialties": ["Emotional Intelligence", "Trauma Release", "Somatic Work"],
            "body_systems_supported": ["neurological", "bioelectrical", "respiratory"],
            "goals_supported": ["balance", "stress", "focus"],
            "tags": ["emotional", "healing", "workshop", "trauma"]
        }
    ]
    
    for w in workshops:
        w["listing_id"] = gen_id("list")
        w["slug"] = w["title"].lower().replace(" ", "-")[:50]
        w["created_at"] = datetime.now(timezone.utc) - timedelta(days=random.randint(5, 45))
        w["updated_at"] = datetime.now(timezone.utc)
        
        existing = await db.listings.find_one({"title": w["title"]})
        if not existing:
            await db.listings.insert_one(w)
    
    print(f"Created {len(workshops)} workshops")
    return workshops

async def create_assessments(users):
    """Create 10 completed assessment results"""
    print("Creating assessment results...")
    
    sample_users = users[:10] if len(users) >= 10 else users
    
    for user in sample_users:
        # Generate random but realistic scores
        mental = random.randint(40, 85)
        emotional = random.randint(35, 80)
        physical = random.randint(45, 90)
        spiritual = random.randint(30, 75)
        vitality = (mental + emotional + physical + spiritual) / 4
        
        body_systems = {
            "bioelectrical": random.randint(35, 80),
            "hydration": random.randint(40, 85),
            "circadian": random.randint(30, 75),
            "microbiome": random.randint(35, 80),
            "respiratory": random.randint(50, 90),
            "neurological": random.randint(40, 85),
            "cardiovascular": random.randint(45, 90),
            "nutritional": random.randint(35, 80)
        }
        
        # Determine focus areas (lowest scores)
        all_scores = [
            ("Mental Clarity", mental),
            ("Emotional Balance", emotional),
            ("Physical Vitality", physical),
            ("Spiritual Connection", spiritual),
        ]
        all_scores.extend([(k.title(), v) for k, v in body_systems.items()])
        all_scores.sort(key=lambda x: x[1])
        top_focus = [x[0] for x in all_scores[:3]]
        
        assessment = {
            "response_id": gen_id("resp"),
            "user_id": user["user_id"],
            "answers": [],  # Simplified for demo
            "vitality_score": round(vitality, 1),
            "mental_score": mental,
            "emotional_score": emotional,
            "physical_score": physical,
            "spiritual_score": spiritual,
            "body_system_scores": body_systems,
            "top_focus_areas": top_focus,
            "completed_at": datetime.now(timezone.utc) - timedelta(days=random.randint(1, 30))
        }
        
        existing = await db.assessment_responses.find_one({"user_id": user["user_id"]})
        if not existing:
            await db.assessment_responses.insert_one(assessment)
    
    print(f"Created {len(sample_users)} assessment results")

async def create_bookings(users):
    """Create 12 booking requests"""
    print("Creating booking requests...")
    
    listings = await db.listings.find({}, {"listing_id": 1, "title": 1}).to_list(100)
    if not listings:
        print("No listings found for bookings")
        return
    
    statuses = ["pending", "pending", "pending", "confirmed", "confirmed", "completed", "completed", "cancelled"]
    
    bookings = []
    for i in range(12):
        user = random.choice(users)
        listing = random.choice(listings)
        status = random.choice(statuses)
        
        booking = {
            "booking_id": gen_id("book"),
            "user_id": user["user_id"],
            "listing_id": listing["listing_id"],
            "status": status,
            "preferred_date": f"2026-0{random.randint(3,6)}-{random.randint(10,28)}",
            "preferred_time": f"{random.randint(9,17)}:00",
            "note": random.choice([
                "Looking forward to this session!",
                "First time trying this, excited to learn.",
                "Returning for another session.",
                "Recommended by a friend.",
                "Need help with stress management.",
                None
            ]),
            "admin_notes": "Confirmed via phone" if status == "confirmed" else None,
            "quoted_price": random.choice([None, 100, 150, 200, 250]) if status != "pending" else None,
            "payment_status": "paid" if status == "completed" else "unpaid",
            "created_at": datetime.now(timezone.utc) - timedelta(days=random.randint(1, 20)),
            "updated_at": datetime.now(timezone.utc)
        }
        bookings.append(booking)
    
    for b in bookings:
        await db.booking_requests.insert_one(b)
    
    print(f"Created {len(bookings)} booking requests")

async def create_rewards(users):
    """Create 30 reward events"""
    print("Creating reward events...")
    
    event_types = [
        ("account_created", 100, "onboarding", "Welcome to Solaris!"),
        ("onboarding_completed", 150, "onboarding", "Onboarding completed"),
        ("assessment_completed", 250, "onboarding", "Assessment completed!"),
        ("daily_checkin", 25, "consistency", "Daily check-in completed"),
        ("daily_checkin", 25, "consistency", "Daily check-in completed"),
        ("daily_checkin", 25, "consistency", "Daily check-in completed"),
        ("booking_request", 50, "engagement", "Booking requested"),
        ("streak_bonus", 100, "consistency", "7-day streak achieved!"),
        ("referral", 200, "growth", "Referred a friend"),
        ("workshop_attended", 75, "engagement", "Workshop completed"),
    ]
    
    rewards = []
    for i in range(30):
        user = random.choice(users)
        event = random.choice(event_types)
        
        reward = {
            "event_id": gen_id("reward"),
            "user_id": user["user_id"],
            "event_type": event[0],
            "points": event[1],
            "category": event[2],
            "note": event[3],
            "created_at": datetime.now(timezone.utc) - timedelta(days=random.randint(0, 45))
        }
        rewards.append(reward)
    
    for r in rewards:
        await db.reward_events.insert_one(r)
    
    print(f"Created {len(rewards)} reward events")

async def create_daily_checkins(users):
    """Create sample daily checkins"""
    print("Creating daily checkins...")
    
    checkins = []
    for user in users[:10]:
        # Create checkins for last 7-14 days
        for days_ago in range(random.randint(5, 14)):
            checkin = {
                "checkin_id": gen_id("check"),
                "user_id": user["user_id"],
                "checkin_date": (datetime.now(timezone.utc) - timedelta(days=days_ago)).strftime("%Y-%m-%d"),
                "energy_score": random.randint(4, 9),
                "mood_score": random.randint(4, 9),
                "sleep_hours": round(random.uniform(5.5, 8.5), 1),
                "hydration_glasses": random.randint(3, 10),
                "movement_minutes": random.randint(0, 90),
                "created_at": datetime.now(timezone.utc) - timedelta(days=days_ago)
            }
            checkins.append(checkin)
    
    for c in checkins:
        existing = await db.daily_checkins.find_one({
            "user_id": c["user_id"], 
            "checkin_date": c["checkin_date"]
        })
        if not existing:
            await db.daily_checkins.insert_one(c)
    
    print(f"Created {len(checkins)} daily checkins")

async def main():
    print("\n" + "="*50)
    print("SOLARIS HOLISTIC HEALTH - SEED DATA GENERATOR")
    print("="*50 + "\n")
    
    # Create seed data
    users = await create_users()
    await create_practitioners()
    await create_clinics()
    await create_services()
    await create_workshops()
    await create_assessments(users)
    await create_bookings(users)
    await create_rewards(users)
    await create_daily_checkins(users)
    
    # Print summary
    print("\n" + "="*50)
    print("SEED DATA COMPLETE!")
    print("="*50)
    print(f"Users: {await db.users.count_documents({})}")
    print(f"Listings: {await db.listings.count_documents({})}")
    print(f"Assessments: {await db.assessment_responses.count_documents({})}")
    print(f"Bookings: {await db.booking_requests.count_documents({})}")
    print(f"Rewards: {await db.reward_events.count_documents({})}")
    print(f"Checkins: {await db.daily_checkins.count_documents({})}")
    print("="*50 + "\n")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
