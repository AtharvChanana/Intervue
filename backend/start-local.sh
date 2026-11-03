#!/bin/bash
# ============================================================
# Local dev startup script for the backend
# Set your API keys below BEFORE running this script.
# Run: chmod +x start-local.sh && ./start-local.sh
# ============================================================

# ---- SET YOUR API KEYS HERE ----
export GROQ_API_KEY="YOUR_GROQ_API_KEY_HERE"
export GEMINI_API_KEY=""   # optional — leave empty if using Groq
# --------------------------------

export SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/mockinterview_db"
export SPRING_DATASOURCE_USERNAME="postgres"
export SPRING_DATASOURCE_PASSWORD="root"

echo "Starting backend with GROQ_API_KEY=${GROQ_API_KEY:0:10}..."
cd "$(dirname "$0")"
JAVA_HOME=$(/usr/libexec/java_home -v 21) ./mvnw spring-boot:run

