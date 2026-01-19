# Quick Start Guide - Team Management Feature

## 🚀 Getting Started in 2 Minutes

### Step 1: Access the Application
Open: **https://modern-rhythm-483209-c5.web.app**

### Step 2: Login
- Click "Login with Google"
- Use your Google account
- You're in!

### Step 3: Go to Team Management
- From the dashboard, click **"Team Management"** button
- Or navigate directly to the team management page

### Step 4: Create Your Team
1. Enter **Organization ID** (e.g., `my-company`)
2. Enter **Team ID** (e.g., `backend-team`)
3. Click **"Load Team"** button
4. If team doesn't exist, the system will create it automatically

---

## 📋 Adding Team Members

1. In the **"📋 Team Members"** tab:
   - **Name:** John Doe
   - **Email:** john@company.com
   - **Role:** Select from dropdown (Frontend Lead, Backend Lead, etc.)
   - Click **"Add Member"**

2. See member appear in the list with:
   - Name and role
   - Workload (hours) vs. Capacity (hours)
   - Utilization percentage

---

## 🎯 Assigning Skills

1. Click the **"🎯 Skills"** tab
2. Click on a team member's name (it will highlight in green)
3. In the form:
   - **Skill Name:** e.g., "React", "Python", "AWS"
   - **Level:** Select 1-5 stars
     - ⭐ = Learning
     - ⭐⭐ = Beginner
     - ⭐⭐⭐ = Intermediate
     - ⭐⭐⭐⭐ = Advanced
     - ⭐⭐⭐⭐⭐ = Expert
   - Click **"Add"** to add the skill

4. Click **"Save Skills"** to save (required!)

5. The **Skill Heatmap** (right side) updates automatically showing:
   - All team members (rows)
   - All skills (columns)
   - Color intensity = proficiency level

---

## ⏰ Monitoring SLAs

Click the **"⏰ SLA"** tab to see:
- **Healthy:** Projects on track
- **At Risk:** Projects needing attention
- **Breached:** Missed deadlines

---

## 💡 Pro Tips

### 1. **For Better AI Roadmaps**
- Assign skills to all team members
- AI will consider team expertise when generating timelines
- More accurate task estimates

### 2. **Track Utilization**
- Keep it under 80% (green)
- Orange = team might be overloaded
- Plan capacity before assigning new projects

### 3. **Skills Naming**
- Use consistent names (React, not ReactJS)
- Include frameworks and languages
- Add soft skills too (Communication, Leadership)

### 4. **Regular Updates**
- Update skills as team grows
- Remove obsolete technologies
- Track learning progress

---

## 🔄 Common Workflows

### Workflow 1: Team Creation
```
1. Go to Team Management
2. Enter Organization ID
3. Enter Team ID
4. Click "Load Team"
5. Team auto-created on first member add
```

### Workflow 2: Build Team Profile
```
1. Add 3-5 team members
2. Assign main 5-7 skills per person
3. Set proficiency levels (be honest!)
4. View skill heatmap
5. Use in project planning
```

### Workflow 3: Generate Smart Roadmap
```
1. Complete team skills assignment
2. Go to Project Planner
3. Describe your project
4. AI sees your team context
5. Get better estimates and recommendations
```

---

## ❓ FAQ

**Q: Can I use any Organization ID?**
A: Yes, any string works. Use your company name or domain.

**Q: How many team members can I add?**
A: Unlimited! System scales with your team size.

**Q: Do skill levels affect anything?**
A: Yes! AI uses skill data to estimate task duration better.

**Q: Can I edit skills later?**
A: Yes, click on member name in Skills tab anytime.

**Q: Where is my data stored?**
A: Securely in Google Firestore (Google's database).

**Q: Can I export team data?**
A: Currently no, but it's on the roadmap.

---

## 🎯 Success Checklist

- [ ] Can access https://modern-rhythm-483209-c5.web.app
- [ ] Can login with Google
- [ ] Can create/load team
- [ ] Can add team members
- [ ] Can assign skills to members
- [ ] Can see skill heatmap populate
- [ ] Can monitor utilization percentages

**Once all checked, you're ready to use Team Management!** ✅

---

## 🆘 Need Help?

### Issue: Skills won't save
- Make sure you clicked "Save Skills" button
- Check organization ID and team ID are correct
- Try refresh button (🔄) in Skills editor

### Issue: Team member not appearing
- Click "Load Team" button again
- Check that member was successfully added
- Verify browser network tab shows success

### Issue: Heatmap is empty
- You need to add skills first!
- Assign at least one skill to a member
- Click "Save Skills"
- Heatmap updates in 1-2 seconds

### Issue: Get 404 or network error
- Check internet connection
- Verify you're logged in
- Try clearing browser cache
- Open DevTools (F12) > Console to see detailed error

---

## 📞 Still Need Help?

See detailed documentation:
- [Team Management Guide](TEAM_MANAGEMENT_GUIDE.md) - Full user guide
- [Application Status](APPLICATION_STATUS.md) - Technical overview
- [Implementation Summary](IMPLEMENTATION_SUMMARY.md) - Architecture details

---

**Ready? Start using Team Management now!** 🚀

**Backend:** https://ai-backend-444418153714.us-central1.run.app  
**Frontend:** https://modern-rhythm-483209-c5.web.app  
**Status:** ✅ Production Ready
