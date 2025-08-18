#!/bin/bash

echo "🚀 AutoSecure Demo Setup"
echo "========================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "🔧 Creating .env file..."
    cat > .env << EOF
# AutoSecure Demo Environment Variables
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyBIwzALxUPNbatRBj3Xi1Uhp0fFzwWNBkE
REACT_APP_ENVIRONMENT=development
EOF
    echo "✅ .env file created"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the development server:"
echo "   npm start"
echo ""
echo "To build for production:"
echo "   npm run build"
echo ""
echo "📖 For more information, see README.md"
echo ""
echo "🌐 Open http://localhost:3000 after starting the server"



