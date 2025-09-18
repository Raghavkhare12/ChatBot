# 🤖 Multi-Model Chatbot Web App

A clean, minimal **Next.js** web application that lets you chat with multiple LLMs.  
Switch between models (via [OpenRouter](https://openrouter.ai/)) in real time, compare responses, and deploy easily.

---

## ✨ Features
- Simple, **user-friendly chat UI** with message bubbles
- **Model selector** to switch between multiple LLMs
- **Serverless backend proxy** to OpenRouter (your API key is never exposed to the browser)
- Chat history stored in browser `localStorage`
- Easy to deploy on **Vercel** with 1-click

---

## 🛠 Tech Stack
- [Next.js](https://nextjs.org/) (React framework)
- [OpenRouter API](https://openrouter.ai/) for multi-model access
- Deployed on [Vercel](https://vercel.com/)

---

## 🚀 Quick Start (Local Development)

1. **Clone this repository**  
   ```bash
   git clone https://github.com/YOUR-USERNAME/multimodel-chatbot.git
   cd multimodel-chatbot
   ```

2. **Install dependencies**  
   ```bash
   npm install
   ```

3. **Set up environment variables**  
   Create a `.env.local` file in the root:
   ```bash
   OPENROUTER_API_KEY=sk-xxxxxx
   ```

   👉 Get your free API key from [OpenRouter](https://openrouter.ai/keys).

4. **Run locally**  
   ```bash
   npm run dev
   ```
   Visit: [http://localhost:3000](http://localhost:3000)

---

## ☁️ Deployment

This project is optimized for **Vercel**.

### Deploy in one click:
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR-USERNAME/multimodel-chatbot&env=OPENROUTER_API_KEY&project-name=multi-model-chatbot&repository-name=multimodel-chatbot)

After deployment, add your `OPENROUTER_API_KEY` in Vercel’s **Project Settings → Environment Variables**.

---

## 📂 Repo & Demo Links

- **GitHub Repo**: [🔗 YOUR REPO LINK HERE](https://github.com/YOUR-USERNAME/multimodel-chatbot)  
- **Live Demo**: [🌐 YOUR DEPLOYED LINK HERE](https://YOUR-PROJECT.vercel.app)  

---

## 📜 License
MIT License © 2025
