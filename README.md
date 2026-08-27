
Team : Tech4Built CTP 

# DeadlineRadar

> **Know when your deadlines don't fit. Plan before you fall behind.**

DeadlineRadar is a hackathon MVP that helps students understand whether their academic workload fits within the time they actually have available.

Unlike a traditional calendar that only shows **when** assignments are due, DeadlineRadar analyzes **how much work is required**, compares it against available study time, detects workload collisions, and uses **Claude AI** to generate a realistic day-by-day preparation plan.

---

## 🚨 The Problem

Students often have multiple assignments, exams, projects, and other obligations due around the same time.

A calendar might show:

* Data Structures project — Friday
* Math exam — Saturday
* Operating Systems assignment — Monday

But it doesn't answer the most important question:

> **"Do I actually have enough time to complete all of this?"**

DeadlineRadar turns deadlines into a workload analysis.

---

## 💡 The Solution

DeadlineRadar takes:

* 📚 Course and assignment information
* 📅 Due dates
* ⏱️ Estimated effort hours
* 📊 Difficulty
* 📝 Obligation type
* 🕐 Available study hours

It then:

1. Calculates the student's required workload.
2. Compares required hours against available hours.
3. Detects high-risk workload periods.
4. Assigns a risk level: **Low, Medium, or High**.
5. Sends structured workload information to Claude.
6. Generates a realistic daily preparation plan.

# Core Development Team

| **Name**         | **Role**              | **Key Contributions**                                            | **Expertise**                               |
| ---------------- | --------------------- | ---------------------------------------------------------------- | ------------------------------------------- |
| [@Hisey Dolma]  | Lead Developer        | Core architecture & backend implementation                       | Python, Backend Systems, Database Design    |
| [@Ratul] | Project Architect     | Project initialization, technical strategy & Feature development | Systems Design, Project Management, Backend |
| [@La-Lhakpa]     | Technical Writer      | Feature development & developer guides                           | Technical Documentation, Frontend, Testing  |
| [@KMubasshir]     | Full-Stack Engineer   | Feature development, bug fixes & performance optimization        | Frontend, Backend, Testing                  |
|           |
### Example

```text
High-Risk Week

Required: 17 hours
Available: 10 hours
Deficit: 7 hours

Risk Level: HIGH

Recommendation:
Start the Data Structures project today,
study for the Math exam tomorrow,
and reserve Friday for final review.
```

---

## ✨ MVP Features

### 1. Add Obligations

Users can add one obligation at a time.

Each obligation contains:

| Field           | Description                                    |
| --------------- | ---------------------------------------------- |
| Course          | Course associated with the task                |
| Assignment Name | Name of the assignment, exam, or task          |
| Due Date        | Deadline                                       |
| Estimated Hours | Expected time required                         |
| Difficulty      | Low / Medium / High                            |
| Type            | Exam / Project / Homework / Work Shift / Other |

### 2. Available Hours

Users enter how many hours they can realistically work each day.

Example:

```text
Monday:    2 hours
Tuesday:   3 hours
Wednesday: 2 hours
Thursday:  1 hour
Friday:    2 hours
Saturday:  0 hours
Sunday:    3 hours
```

### 3. Collision Detection

DeadlineRadar compares:

```text
Required Work
      ↓
Available Time
      ↓
   Difference
      ↓
Risk Level
```

This identifies periods where the student's workload exceeds their available capacity.

### 4. Risk Levels

| Risk      | Meaning                                    |
| --------- | ------------------------------------------ |
| 🟢 Low    | Workload comfortably fits available time   |
| 🟡 Medium | Workload is approaching available capacity |
| 🔴 High   | Required work exceeds available time       |

### 5. Claude Preparation Plan

Claude receives structured workload information and produces:

* Daily task breakdown
* Specific preparation actions
* Prioritization reasoning
* Workload warnings
* Suggested adjustments

---

# 🖥️ Application Flow

## Screen 1 — Input & Availability

Students enter their obligations and available study hours.

```text
+----------------------------------+
|        DeadlineRadar             |
|                                  |
| Course: [Data Structures       ] |
| Assignment: [AVL Tree Project ] |
| Due Date: [08/30/2026]           |
| Estimated Hours: [6]             |
| Difficulty: [High ▼]             |
| Type: [Project ▼]                |
|                                  |
|       [ Add Obligation ]         |
|                                  |
| Available Hours                  |
| Mon [2] Tue [3] Wed [2] ...      |
|                                  |
|       [ Analyze Workload ]       |
+----------------------------------+
```

---

## Screen 2 — Collision Dashboard

The dashboard summarizes the student's workload.

```text
+----------------------------------+
|       Workload Analysis          |
|                                  |
| Required Hours       17          |
| Available Hours      10          |
| Deficit               7          |
|                                  |
| 🔴 HIGH RISK                     |
| Your workload exceeds available  |
| study time this week.            |
|                                  |
| Upcoming Deadlines               |
|                                  |
| Data Structures     Aug 28       |
| Math Exam           Aug 29       |
| OS Project          Aug 30       |
|                                  |
|       [ Generate Plan ]          |
+----------------------------------+
```

---

## Screen 3 — Claude Preparation Plan

Claude generates a day-by-day sequence.

```text
Monday
────────────────────────
• Complete BST implementation
• Spend 30 min reviewing test cases

Tuesday
────────────────────────
• Finish AVL rotations
• Begin Math Exam review

Wednesday
────────────────────────
• Complete project testing
• Review probability formulas

Thursday
────────────────────────
• Final project submission check
• Practice Math problems

Workload Warning:
You have approximately 2 hours less
capacity than required before Friday.
```

---

```text
Deadlines
├── Due date
├── Estimated hours
├── Difficulty
└── Task type

Availability
├── Hours per day
└── Total available hours

Collision Analysis
├── Required hours
├── Available hours
├── Deficit
└── Risk level
```

### Gemini Returns

```text
Daily task breakdown
Prioritization reasoning
Workload warnings
Suggested adjustments
```

---

# 🔐 Environment Variables

Create a `.env` file in the backend directory:

```env
GEMINI_API_KEY=your_api_key_here
PORT=5000
```

**Never commit `.env` to GitHub.**

Add it to `.gitignore`:

```gitignore
node_modules/
.env
```

---

# 🛠️ Tech Stack

### Frontend

* React
* Tailwind CSS
* JavaScript
* Fetch API

### Backend

* Node.js
* Express
* Anthropic SDK
* CORS
* dotenv

### AI

* GEMINI API

### Development

* Git / GitHub
* npm

---

# 📁 Suggested Project Structure

```text
DeadlineRadar/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ObligationForm.jsx
│   │   │   ├── AvailabilityInput.jsx
│   │   │   ├── CollisionDashboard.jsx
│   │   │   └── PlanDisplay.jsx
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── server.js
│   ├── routes/
│   │   └── plan.js
│   ├── services/
│   │   └── claude.js
│   ├── .env
│   ├── package.json
│   └── ...
│
├── README.md
└── .gitignore
```

---

## 1. Clone the Repository

```bash
git clone <repository-url>
cd DeadlineRadar
```

---

## 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

---

## 3. Install Backend Dependencies

Open another terminal:

```bash
cd backend
npm install
```

Install the required packages:

```bash
npm install express cors dotenv @anthropic-ai/sdk
```

---

## 4. Configure the API Key

Create:

```text
backend/.env
```

Add:

```env
GEMINI_API_KEY=your_api_key_here
PORT=5000
```

---

## 5. Start the Backend

```bash
cd backend
node server.js
```

The backend should run on:

```text
http://localhost:5000
```

---

## 6. Start the Frontend

In another terminal:

```bash
cd frontend
npm run dev
```

Open the local URL provided by Vite.

---
