# CHAOS ENGINE — AI School Receptionist Assistant

CHAOS ENGINE is a grounded school receptionist web application. Teachers publish official notices with effective and expiry dates. Students ask natural-language questions and receive answers strictly grounded in active school notices, complete with verified source citations and conversation history.

## 1. Prerequisites
- **Node.js**: v20.x LTS or newer (`node -v`)
- **Git**: Installed (`git --version`)
- **MongoDB Atlas**: A free M0 cluster URI with your IP address allowlisted under *Network Access*.
- **Gemini API Key**: Created in Google AI Studio.

## 2. Quick Setup (Windows PowerShell)
```powershell
# 1. Clone or enter project directory
mkdir chaos-engine
cd chaos-engine

# 2. Install required MVP dependencies
npm install

# 3. Create your local .env file from the template
Copy-Item .env.example .env
notepad .env