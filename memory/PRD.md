# Solaris Holistic Health - Product Requirements Document

## Overview
Solaris Holistic Health is a premium, cinematic, mobile-first wellness platform MVP that helps users:
- Understand their current wellness picture through comprehensive assessments
- Complete a guided holistic health assessment
- Receive personalized AI guidance from LUCA (wellness concierge)
- Follow daily wellness actions and track progress
- Explore curated practitioners, clinics, workshops, services, and programs
- Request bookings and earn LOVE points

## Tech Stack
- **Frontend**: Expo/React Native with expo-router (mobile-first responsive design)
- **Backend**: FastAPI with MongoDB
- **AI**: OpenAI GPT-4o via Emergent LLM Key for LUCA AI assistant
- **Auth**: Emergent Google OAuth social login
- **Database**: MongoDB (FHIR-aligned schema)
- **Payments**: Mocked payment flow (designed for future Spark.money integration)

## Core Features Implemented

### 1. Cinematic Onboarding Flow
- Splash screen with Solaris logo
- 5-step welcome slides (Welcome, Golden Age, Heal-Learn-Earn, Solaris Method, Body Speaking)
- Google OAuth authentication
- Profile setup (name, location)
- Goals and intentions selection
- Preferred guidance type

### 2. Health Assessment
- 35 questions covering:
  - 4 Aspects: Mental, Emotional, Physical, Spiritual
  - 8 Body Systems: Bioelectrical, Hydration, Circadian, Microbiome, Respiratory, Neurological, Cardiovascular, Nutritional
- Slider and multiple-choice question types
- Vitality score calculation
- Top 3 focus areas identification
- Results visualization with radar-style display

### 3. Main App Tabs
- **Home**: Dashboard with vitality score, daily check-in, streak, quick actions, LUCA insights
- **My Health**: Detailed health overview, 4 aspects scores, body systems progress, check-in history
- **LUCA**: AI chat assistant for wellness guidance (powered by OpenAI GPT-4o)
- **Explore**: Marketplace for practitioners, clinics, services, workshops (admin-created listings)
- **Profile**: User info, rewards (LOVE points), bookings, settings

### 4. LUCA AI Assistant
- Contextual wellness guidance based on user's assessment results
- Suggested prompts for common questions
- Chat history persistence
- Never claims to diagnose - acts as wellness concierge

### 5. Daily Check-ins
- Energy level tracking (1-10)
- Mood tracking (1-10)
- Sleep hours
- Hydration (glasses)
- Movement (minutes)
- Streak system

### 6. Rewards System (LOVE Points)
- Points for account creation (100)
- Points for assessment completion (250)
- Points for daily check-ins (25)
- Points for booking requests (50)

### 7. Marketplace & Bookings
- Listing types: practitioner, clinic, service, workshop, place, program, diagnostics, kitchen
- Filtering and search
- Booking request flow with notes and preferred date
- Admin management of bookings

### 8. Admin Dashboard
- Overview statistics
- User management
- Listing creation/management
- Booking management (confirm, cancel, complete)
- Seed data functionality

## Design System
- **Colors**: Deep navy (#0A1628), Emerald green (#10B981), Teal accents (#14B8A6), Gold (#F59E0B)
- **Style**: Premium, cinematic, futuristic yet warm, mobile-first
- **Components**: Rounded cards, soft glows, gradient backgrounds, glassmorphism

## API Endpoints
- `POST /api/auth/session` - OAuth session exchange
- `GET /api/auth/me` - Current user
- `PUT /api/users/profile` - Update profile
- `GET /api/users/rewards` - Get rewards and streak
- `GET /api/assessment/questions` - Get assessment questions
- `POST /api/assessment/submit` - Submit assessment
- `GET /api/assessment/results` - Get results
- `POST /api/luca/chat` - Chat with LUCA AI
- `GET /api/listings` - Get marketplace listings
- `POST /api/bookings` - Create booking request
- `POST /api/checkins` - Create daily check-in
- Admin endpoints for user/listing/booking management

## Future Enhancements (v2+)
- Full Spark.money payment integration
- Practitioner self-serve accounts
- Nostr/Privy integration
- Full FHIR interoperability
- Advanced analytics and recommendations
