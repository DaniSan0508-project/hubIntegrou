<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# HubIntegrou - Delivery Hub System

A mobile-first application for a delivery hub system that integrates with iFood and ERP systems to manage orders, products, and merchants efficiently.

## Run Locally with Docker (Recommended)

**Prerequisites:** Docker and Docker Compose

1. Copy the environment file:
   ```bash
   cp .env.example .env.local
   ```
2. Set your `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Build and run the application:
   ```bash
   docker-compose up
   ```
4. Access the application at http://localhost:5173

## Run Locally with Node.js

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Copy the environment file:
   `cp .env.example .env.local`
3. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
4. Run the app:
   `npm run dev`

## Docker Configuration

The Docker setup includes:
- Node.js 20 environment
- Automatic dependency installation
- Live reload for development
- Port mapping (5173)
- Volume mounting for development
