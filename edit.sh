#!/bin/bash

DOWNLOAD_DIR=~/Downloads
TARGET=./js/data.js

# 1. Open login page
echo "🔐 Opening login page..."
xdg-open ./login.html

echo "👀 Waiting for NEW download..."

# Get current timestamp
start_time=$(date +%s)

while true; do
    for file in $DOWNLOAD_DIR/data*.js; do
        [ -e "$file" ] || continue

        # Get file modification time
        file_time=$(stat -c %Y "$file")

        # Only accept files created AFTER script started
        if [ "$file_time" -gt "$start_time" ]; then
            echo "📥 New download detected: $file"

            cp "$file" "$TARGET"
            echo "✅ data.js updated"

            # Open updated site
            xdg-open ./index.html
            exit 0
        fi
    done

    sleep 2
done
