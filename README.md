# ChatBot

A clean, minimal Next.js web application that lets you chat with multiple large language models (LLMs). Switch between models in real-time, compare responses, and deploy easily.

---

## ✨ Features

- Simple, user-friendly chat UI with message bubbles  
- Ability to select / switch between multiple models via [OpenRouter](https://openrouter.ai)  
- Serverless backend proxy so your API key is never exposed to the browser  
- Chat history stored in browser `localStorage`  
- Simple to deploy  

---

## 🌐 Live Website

👉 [Visit ChatBot here](https://chat-bot-git-main-raghavkhare12s-projects.vercel.app/)  

---

## 🛠️ Tech Stack

- **Frontend / Fullstack framework**: Next.js (React)  
- **API Services**: OpenRouter API for accessing multiple LLMs  
- **State / Storage**: localStorage for persisting chat history on client  

---

## 🚀 Quick Start (Local Development)

1. Clone the repository  
   ```bash
   git clone https://github.com/Raghavkhare12/ChatBot.git
   cd ChatBot
````

2. Install dependencies

   ```bash
   npm install
   ```

3. Setup environment variables

   * Copy `.env.local.example` to `.env.local`
   * Add your OpenRouter API key:

     ```bash
     OPENROUTER_API_KEY=sk-yourapikey
     ```

4. Run locally

   ```bash
   npm run dev
   ```

5. Visit in browser: `http://localhost:3000`

---

## 📁 Project Structure

Here’s a rough overview of the folders/files:

```
/components     → React components (UI, chat bubbles, model selector, etc.)
/pages          → Next.js pages (chat interface, etc.)
/styles         → CSS / styling files
.env.local.example → Example environment variables file
models.json     → Configuration / info about the LLM models supported
next.config.js  → Next.js configuration
package.json    → dependencies, scripts, etc.
```

---

## 🔐 Security & Secrets

* Your `OPENROUTER_API_KEY` should **never** be committed to the repo.
* Use `.env.local` (ignored by Git) to store secrets.

---

## 🧪 Future Improvements / To-Do

* Add user authentication so different users can maintain separate histories
* Persist chat history on a backend (database), not only localStorage
* UI themes (dark / light mode)
* More model options, maybe configurable by user
* Improved error handling / retry logic

---


## ℹ️ About

* Author: Raghav Khare
* Source Code: [https://github.com/Raghavkhare12/ChatBot](https://github.com/Raghavkhare12/ChatBot)

```

---

```
