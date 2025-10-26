#!/bin/bash

# Easy STEM School Server Management Script

echo "🔍 Checking for existing server processes..."

# Check if server is already running
if pgrep -f "node server.js" > /dev/null; then
    echo "⚠️  Server is already running!"
    echo "🛑 Stopping existing server..."
    pkill -f "node server.js"
    sleep 2
    echo "✅ Existing server stopped."
fi

echo "🚀 Starting Easy STEM School server..."
node server.js

