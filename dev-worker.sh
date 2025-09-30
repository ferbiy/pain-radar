#!/bin/bash

# Development worker simulator
# Triggers the queue processor every 60 seconds (like Vercel Cron does in production)

echo "🚀 Starting development queue worker..."
echo "📝 This simulates Vercel Cron (which only runs in production)"
echo "⏰ Processing queue every 60 seconds..."
echo ""

while true; do
  echo "[$(date +%T)] Triggering queue processor..."
  
  curl -s -X POST http://localhost:3000/api/queue/process \
    -H "x-cron-secret: IYYmOOfVFC" | jq '.'
  
  echo ""
  sleep 60
done
