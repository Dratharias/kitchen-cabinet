#!/bin/bash

# Authenticate and get token
TOKEN=$(curl -s -X POST http://127.0.0.1:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"dratharias","password":"Ch4ng3m3!"}' | jq -r '.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "Authentication failed"
  exit 1
fi

# Post all JSON files
for file in *.json; do
  [ -f "$file" ] || continue
  echo "Posting $file..."
  curl -X POST http://127.0.0.1:3001/api/publicate \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d @"$file"
  echo ""
done