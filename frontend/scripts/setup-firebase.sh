#!/bin/bash

# This script copies Firebase config files from EAS Secrets to the correct locations
# EAS automatically places file secrets in the working directory

set -e

echo "Setting up Firebase configuration files..."

# iOS - Copy GoogleService-Info.plist
if [ -f "$GOOGLE_SERVICE_INFO_PLIST" ]; then
  echo "Copying iOS GoogleService-Info.plist..."
  cp "$GOOGLE_SERVICE_INFO_PLIST" ./ios/RivalPicks/GoogleService-Info.plist
  echo "✓ iOS config copied"
elif [ -f "./GoogleService-Info.plist" ]; then
  echo "Copying iOS GoogleService-Info.plist from root..."
  cp ./GoogleService-Info.plist ./ios/RivalPicks/GoogleService-Info.plist
  echo "✓ iOS config copied from root"
else
  echo "⚠ Warning: GoogleService-Info.plist not found"
fi

# Android - Copy google-services.json
if [ -f "$GOOGLE_SERVICES_JSON" ]; then
  echo "Copying Android google-services.json..."
  cp "$GOOGLE_SERVICES_JSON" ./android/app/google-services.json
  echo "✓ Android config copied"
elif [ -f "./google-services.json" ]; then
  echo "Copying Android google-services.json from root..."
  cp ./google-services.json ./android/app/google-services.json
  echo "✓ Android config copied from root"
else
  echo "⚠ Warning: google-services.json not found"
fi

echo "Firebase setup complete!"
