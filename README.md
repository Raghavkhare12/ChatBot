````markdown
# ChatBot

A clean, minimal **Next.js** web application that lets you chat with multiple large language models (LLMs).  
Switch between models in real-time, compare responses, and deploy easily.

---

## ✨ Features
- 🎨 Vibrant, colorful UI with distinct chat bubbles for a clear conversation flow  
- 💬 Simple, user-friendly chat interface  
- 🔄 Ability to select and switch between multiple models via **OpenRouter**  
- ⚡ Real-time utility icons to instantly fetch:
  - Current weather (via browser location)  
  - Current date and time  
- 🔐 Serverless backend proxy so your API keys are never exposed to the browser  
- 💾 Chat history stored in your browser's **localStorage**  
- 🚀 Simple to deploy  

---

## 🌐 Live Website
👉 [Visit ChatBot here](https://chat-bot-git-main-raghavkhare12s-projects.vercel.app/)

---

## 🛠️ Tech Stack
- **Frontend / Fullstack Framework**: Next.js (React)  
- **API Services**:
  - OpenRouter API for accessing multiple LLMs  
  - WeatherAPI.com for real-time weather data  
- **State / Storage**: localStorage for persisting chat history on client  

---

## 🚀 Quick Start (Local Development)

1. **Clone the repository**
   ```bash
   git clone https://github.com/Raghavkhare12/ChatBot.git
   cd ChatBot
````

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Setup environment variables**

   * Copy `.env.local.example` → `.env.local`
   * Add your API keys:

     ```bash
     OPENROUTER_API_KEY=sk-youropenrouterkey
     WEATHER_API_KEY=yourweatherapikey
     ```

4. **Run locally**

   ```bash
   npm run dev
   ```

5. **Visit in browser**
   [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
/components        → React components (UI, chat bubbles, model selector, etc.)
/pages             → Next.js pages (chat interface, etc.)
/lib               → Tool definitions for API integrations
/styles            → CSS / styling files
.env.local.example → Example environment variables file
models.json        → Configuration / info about supported LLM models
next.config.js     → Next.js configuration
package.json       → Dependencies, scripts, etc.
```

---

## 🔐 Security & Secrets

* Never commit your `OPENROUTER_API_KEY` or `WEATHER_API_KEY` to the repo.
* Use `.env.local` (ignored by Git) to safely store secrets.

---

## 🧪 Future Improvements / To-Do

* 👤 Add user authentication (separate chat histories per user)
* 🗄️ Persist chat history on a backend (database) instead of only localStorage
* 🧩 Add more model options, configurable by user
* ⚠️ Improve error handling & retry logic

---

## ℹ️ About

* **Author**: [Raghav Khare](https://github.com/Raghavkhare12)
* **Source Code**: [GitHub Repo](https://github.com/Raghavkhare12/ChatBot)

```
```
