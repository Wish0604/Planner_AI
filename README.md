# 🤖 Planner AI 

An intelligent, multi-agent project planning platform powered by AI that generates comprehensive project roadmaps, risk assessments, timelines, and technical specifications.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![React](https://img.shields.io/badge/react-18.2.0-blue)

## 🌟 Features

### Core Capabilities
- **🎯 Multi-Agent Planning System** - Specialized AI agents for planning, tech stack, timeline, risk assessment, and deliverables
- **💬 Interactive Chat Interface** - ChatGPT-style conversation with your projects
- **📊 Real-Time Telemetry** - Live monitoring of agent performance and system health
- **🔍 XAI (Explainable AI)** - Transparent decision-making with confidence scores and reasoning traces
- **👥 Organization Mode** - Multi-team support with role-based assignment and skill heatmaps

### Advanced Features
- **🧠 Multi-LLM Routing** - Intelligent model selection (Gemini for planning, Llama for code-heavy tasks)
- **📈 Feedback Loop** - Learn from outcomes and auto-tune strategies
- **⚡ SLA Monitoring** - Track deadlines, detect breaches, and send alerts
- **🔐 Audit Trail** - Complete history of all agent decisions and actions
- **📱 Responsive Design** - Works seamlessly on desktop and mobile devices

## 🚀 Live Demo

**Frontend:** [https://modern-rhythm-483209-c5.web.app](https://modern-rhythm-483209-c5.web.app)  
**Backend API:** [https://ai-backend-444418153714.us-central1.run.app](https://ai-backend-444418153714.us-central1.run.app)

## 📸 Screenshots

### Main Chat Interface
![Chat Interface](docs/screenshots/chat.png)

### Telemetry Dashboard
![Telemetry](docs/screenshots/telemetry.png)

### Team Management
![Teams](docs/screenshots/teams.png)

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **Firebase** - Authentication & Firestore database
- **Recharts** - Data visualization
- **React Router** - Navigation

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **Google Gemini AI** - Primary LLM
- **Llama 3** - Code generation (optional)
- **Firebase Admin** - Database & auth
- **Google Cloud Run** - Deployment

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Firebase account
- Google Cloud account (for deployment)
- Gemini API key

## ⚙️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/Wish0604/Planner_AI.git
cd Planner_AI
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
GEMINI_API_KEY=your_gemini_api_key
FIREBASE_PROJECT_ID=your_firebase_project_id

# Optional: Multi-LLM Support
LLAMA_ENDPOINT=http://localhost:8000/v1/chat/completions
LLAMA_API_KEY=your_llama_key
LLAMA_MODEL=llama-3

# Optional: GitHub Integration (Phase 7)
GITHUB_TOKEN=your_github_token
GITHUB_REPO_OWNER=your_username
GITHUB_REPO_NAME=your_repo
REPO_HEALTH_SECRET=your_secret
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:8080
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
```

### 4. Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Download service account key and save as `backend/serviceAccountKey.json`

## 🏃 Running Locally

### Start Backend
```bash
cd backend
npm start
```
Backend runs on `http://localhost:8080`

### Start Frontend
```bash
cd frontend
npm run dev
```
Frontend runs on `http://localhost:5173`

## 🌐 Deployment

### Backend (Google Cloud Run)
```bash
cd backend
gcloud run deploy ai-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=xxx,FIREBASE_PROJECT_ID=xxx
```

### Frontend (Firebase Hosting)
```bash
cd frontend
npm run build
firebase deploy --only hosting
```


## 📚 Project Structure

```
Planner_AI/
├── backend/
│   ├── agents/              # AI agent implementations
│   ├── config/              # Configuration files
│   ├── schemas/             # Data schemas
│   ├── services/            # Business logic
│   │   ├── orchestrator.js  # Multi-agent coordinator
│   │   ├── modelRouter.js   # LLM routing logic
│   │   ├── feedbackService.js
│   │   ├── telemetryTracker.js
│   │   └── explanationService.js
│   ├── index.js             # Express server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── context/         # React context
│   │   ├── services/        # API services
│   │   └── App.jsx
│   ├── public/
│   └── package.json
├── .gitignore
└── README.md
```

## 🎯 Usage

### Creating a Project
1. Click **"+ Create New Project"**
2. Enter project title (e.g., "E-commerce Platform")
3. AI agents automatically generate:
   - Project roadmap
   - Technology stack recommendations
   - Timeline with milestones
   - Risk assessment
   - Deliverables breakdown

### Chat with Your Project
- Ask follow-up questions
- Request modifications
- Get clarifications
- Generate code snippets

### Monitor System Health
- View **Telemetry Dashboard** for real-time metrics
- Check **Audit Trail** for decision explanations
- Review **Team Management** for capacity planning

## 🔧 Configuration

### Model Selection Strategy

Edit `backend/config/models.js`:
```javascript
export const modelConfig = {
  strategy: "auto", // auto | cost-optimized | quality-first
  costLimit: 100,   // Monthly budget in USD
  // ...
};
```

### Custom Agents

Add new agents in `backend/agents/`:
```javascript
export async function customAgent(context) {
  // Your agent logic
  return {
    agent: "Custom Agent",
    output: { /* results */ }
  };
}
```

## 🧪 Testing

### Run Backend Tests
```bash
cd backend
npm test
```

### Run Frontend Tests
```bash
cd frontend
npm test
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini AI for powerful language models
- Firebase for seamless backend infrastructure
- React community for excellent tooling
- All contributors who helped shape this project

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/Wish0604/Planner_AI/issues)
- **Discussions:** [GitHub Discussions](https://github.com/Wish0604/Planner_AI/discussions)
- **Email:** patreomkar0@gmail.com


---

**Built with ❤️ by [Wish0604](https://github.com/Wish0604)**

*Star ⭐ this repo if you find it useful!*
