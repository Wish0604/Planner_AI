# AI Project Planner

## Environment Variables
- GEMINI_API_KEY - Google Gemini API key for AI agents
- FIREBASE_PROJECT_ID - Firebase project ID
- FIREBASE_API_KEY - Firebase API key
- FIREBASE_AUTH_DOMAIN - Firebase auth domain
- FIREBASE_STORAGE_BUCKET - Firebase storage bucket
- FIREBASE_MESSAGING_SENDER_ID - Firebase messaging sender ID
- FIREBASE_APP_ID - Firebase app ID

## Cloud Run Deployment
```bash
gcloud run deploy ai-backend \
	--source backend \
	--allow-unauthenticated \
	--region us-central1 \
	--set-env-vars GEMINI_API_KEY=...,FIREBASE_PROJECT_ID=...,FIREBASE_API_KEY=...,FIREBASE_AUTH_DOMAIN=...,FIREBASE_STORAGE_BUCKET=...,FIREBASE_MESSAGING_SENDER_ID=...,FIREBASE_APP_ID=...
```

## Firebase Hosting Deployment
```bash
firebase deploy --only hosting:modern-rhythm-483209-c5
```

## Main Features
- Multi-agent AI project planning
- Team management and skill tracking
- SLA monitoring
- Feedback collection
- Real-time telemetry
- Project history and chat

