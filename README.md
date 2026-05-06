# Planner_AI

Planner_AI is a JavaScript-based, AI-driven project planning and team management solution. It leverages Google Gemini AI for adaptive scheduling and feedback, Firebase for real-time collaboration and hosting, and Cloud Run for scalable backend deployment.

---

## Key Features

- **AI Project Planning:** Multi-agent workspace for creating, tracking, and adjusting AI-driven project roadmaps.
- **Advanced Team Management:** Visual dashboards for team skills, capacity, workload, and service-level agreements (SLA).
- **Skill & Capacity Mapping:** Heatmaps and APIs to map skills, monitor utilization, and match tasks to expertise.
- **SLA & Feedback Monitoring:** Integrated tools for monitoring deadlines, project health, and collecting feedback.
- **Real-time Telemetry & Collaboration:** See project status, team activity, and chat history with instant updates.

---

## Quickstart

1. **Clone & Install:**
   ```bash
   git clone https://github.com/Wish0604/Planner_AI.git
   cd Planner_AI
   npm install
   ```

2. **Configure Environment:**
   - Copy `.env.example` to `.env` (if present) and fill in:
     - `GEMINI_API_KEY`: Google Gemini API key
     - Firebase keys: `FIREBASE_PROJECT_ID`, `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`

3. **Deploy Backend (Cloud Run):**
   ```bash
   gcloud run deploy ai-backend \
     --source backend \
     --allow-unauthenticated \
     --region us-central1 \
     --set-env-vars GEMINI_API_KEY=...,FIREBASE_PROJECT_ID=...,...
   ```

4. **Deploy Frontend (Firebase):**
   ```bash
   firebase deploy --only hosting:modern-rhythm-483209-c5
   ```

---

## Tech Stack

- **Frontend/Backend:** JavaScript (99.8%)
- **AI:** Google Gemini API integration
- **Hosting/Realtime:** Firebase
- **Scalable Serverless Deploy:** Google Cloud Run

---

## Team & Skills Management

Full documentation for managing your organization, teams, members, skills, and SLAs is available in the  
[Team Management Guide](https://github.com/Wish0604/Planner_AI/blob/main/TEAM_MANAGEMENT_GUIDE.md).

Key highlights:
- Add team members, set roles & capacities
- Track, add, and visualize skills per member
- SLA dashboard with color-coded project health
- Skill heatmap and capacity utilization tools
- API endpoints for team and skill operations

---

## API Reference

- `POST /api/org/teams` — Create team
- `POST /api/org/team-members` — Add member
- `GET /api/org/team-capacity` — Capacity status
- `GET /api/org/skill-heatmap` — Skill heatmap
- `PUT /api/org/member-skills` — Update member skills
- `GET /api/org/sla-health` — SLA status
- `POST /api/org/slas` — Create SLA

---

## Support

For issues, check your browser console, ensure all environment variables are set up, and consult the [Team Management Guide](https://github.com/Wish0604/Planner_AI/blob/main/TEAM_MANAGEMENT_GUIDE.md).  
If problems persist, open an issue or contact the development team.
