# Team Management Guide

## Overview
The Team Management Dashboard allows you to manage your team, assign skills, track capacity, and monitor SLAs. This guide walks you through each feature.

## Getting Started

### 1. Access Team Management
- Navigate to the Dashboard and click **"Team Management"** button, or
- Go directly to: `https://modern-rhythm-483209-c5.web.app/team-management`

### 2. Set Up Your Organization
1. Enter your **Organization ID** (e.g., `org-12345`)
2. Enter your **Team ID** (e.g., `team-frontend`) or create a new one
3. Click **"Load Team"** to load team data

## Feature Walkthrough

### Tab 1: 📋 Team Members (Capacity)

#### Adding Team Members
1. Click the **"📋 Team Members"** tab
2. Fill in:
   - **Name**: Team member's full name
   - **Email**: Their email address
   - **Role**: Select from predefined roles:
     - Frontend Lead
     - Backend Lead
     - DevOps Engineer
     - QA Engineer
     - Product Manager
     - Junior Developer
3. Click **"Add Member"** button

#### Viewing Team Capacity
Once members are added, you'll see:
- **Total Capacity**: Combined hours available per week (default 40h per person)
- **Utilization**: Percentage of capacity currently allocated to projects
- **Team Members**: Count of active members
- **Available**: Unallocated capacity hours

Each member card shows:
- Name and role
- Workload vs. capacity (e.g., "25h / 40h")
- Utilization percentage with color coding:
  - 🟢 Green: 0-80% (healthy)
  - 🟠 Orange: >80% (overloaded)

### Tab 2: 🎯 Skills

The Skills tab allows you to track and visualize team member expertise.

#### Adding Skills to Members
1. Click the **"🎯 Skills"** tab
2. On the left panel, click on a **team member's name** to edit their skills
3. The selected member will be highlighted in green
4. Under "Current Skills", you'll see existing skills (if any)

#### Managing Individual Skills
1. **Add a new skill**:
   - Enter skill name (e.g., "React", "Python", "AWS")
   - Select proficiency level (1-5 stars):
     - ⭐ 1 = Learning
     - ⭐⭐ 2 = Beginner
     - ⭐⭐⭐ 3 = Intermediate
     - ⭐⭐⭐⭐ 4 = Advanced
     - ⭐⭐⭐⭐⭐ 5 = Expert
   - Click **"Add"** button

2. **Remove a skill**:
   - Click the **"Remove"** button next to the skill name

3. **Save Changes**:
   - Click **"Save Skills"** to persist changes to database

#### Viewing Skill Heatmap
On the right side, the **Team Skill Heatmap** displays:
- All team members (rows)
- All skills (columns)
- Color intensity representing proficiency:
  - 🔴 Red (1): Learning
  - 🟠 Orange (2): Beginner
  - 🟡 Yellow (3): Intermediate
  - 🟢 Light Green (4): Advanced
  - 🟢 Dark Green (5): Expert

#### Filtering the Heatmap
- **Filter Skills**: Search by skill name to focus on specific expertise areas
- **Min Level**: Adjust the slider to show only members with certain proficiency levels

### Tab 3: ⏰ SLA

The SLA (Service Level Agreement) tab helps you track and manage project deadlines and team commitments.

#### Monitoring SLA Health
The SLA Monitor shows:
- **Healthy SLAs**: Projects on track to meet deadlines
- **At Risk SLAs**: Projects approaching deadline with potential issues
- **Breached SLAs**: Projects that have missed their deadline

Each SLA entry includes:
- Project name
- Milestone/deliverable
- Target deadline
- Current status with color coding
- Days remaining (if not breached)

#### Future: Creating SLAs
(Coming soon) You'll be able to:
1. Set deadlines for project milestones
2. Define priority levels (Low, Medium, High)
3. Add buffer days for planning
4. Assign teams to SLA monitoring

## Integration with Project Planner

When you create a new roadmap in the main Project Planner:
1. It automatically fetches your team context (members, skills, capacity)
2. The AI considers:
   - Your team size
   - Available capacity
   - Skill expertise for estimated duration
   - Current utilization when assigning tasks
3. Generated tasks are better tailored to your team's capabilities

## Tips & Best Practices

### For Skills:
- **Update regularly**: Keep skills current as team members grow
- **Use consistent naming**: Use standard names (e.g., "React" not "ReactJS")
- **Be realistic**: Set honest proficiency levels for accurate project planning
- **Add emerging skills**: Track skills team members are learning

### For Capacity:
- **Adjust capacity**: Modify default 40h if your team works different hours
- **Monitor utilization**: Keep it under 80% for sustainable pace
- **Plan ahead**: Check available capacity before assigning new projects

### For SLAs:
- **Set realistic deadlines**: Account for team capacity and complexity
- **Define priorities**: High-priority projects get more resources
- **Monitor regularly**: Check SLA health weekly

## Troubleshooting

### Members not appearing?
1. Make sure Organization ID and Team ID are correct
2. Click **"Load Team"** button to refresh
3. Check that members were successfully added (no error messages)

### Skills not saving?
1. Click **"Save Skills"** button after making changes
2. Wait for confirmation message
3. If error occurs, check:
   - Organization ID is valid
   - Team ID is valid
   - Member exists in the team

### Heatmap not updating?
1. Click the **"🔄 Refresh"** button in the Skills editor
2. Or navigate away and back to the Skills tab
3. Verify skills were saved successfully

## API Endpoints

For developers integrating with the backend:

```
POST   /api/org/teams                    - Create team
POST   /api/org/team-members             - Add member
GET    /api/org/team-capacity            - Get capacity status
GET    /api/org/skill-heatmap            - Get skill heatmap
PUT    /api/org/member-skills            - Update member skills
GET    /api/org/sla-health               - Get SLA status
POST   /api/org/slas                     - Create SLA
```

## Support

If you encounter issues:
1. Check browser console for error messages (F12)
2. Verify all required fields are filled
3. Ensure Firebase project is properly configured
4. Contact the development team with error details
