#!/bin/bash

# Script to install Remotion packages at specific versions
echo "Installing Remotion packages..."

# Install @remotion/player at exactly version 4.0.286
npm install @remotion/player@4.0.286

# Make sure other Remotion packages are compatible with this version
npm install remotion@4.0.286
npm install @remotion/cli@4.0.286
npm install @remotion/lambda@4.0.286
npm install @remotion/renderer@4.0.286
npm install @remotion/bundler@4.0.286

echo "Remotion packages installed successfully!"
echo "Please restart your development server if it's running." 