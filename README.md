# DAVID_AI Stabilized v4

Files:
- index.html — complete frontend
- api/index.js — secure Vercel backend
- vercel.json — deployment routing
- package.json
- .env.example

## Vercel
1. Upload/push the whole folder to GitHub.
2. Import the repository into Vercel.
3. In Vercel Project Settings -> Environment Variables, add OPENAI_API_KEY.
4. Optionally set OPENAI_MODEL.
5. Redeploy.
6. Open the deployed URL and test `/api` health through the application.

Do NOT put the API key inside index.html.

## Voice
Say “David” once, then one command. Final transcripts are deduplicated and only one recognition instance is allowed to restart.

## Gestures
Hold a defined gesture for about 0.45 seconds. One finger = split/select, two fingers = next component, five fingers = split all, fist = reassemble. Open-hand left/right swipe = undo/redo.

## Drawing
Open CAD Engine -> Enable Drawing. The central canvas is directly drawable with mouse, touch, or pen input.

## AI Analyze & Split
Open Visual Engine -> AI Analyze & Split. It calls `/api/analyze-split`. If the backend is not configured, the UI shows the real configuration error and does not modify the model.
