# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Test Commands
- **Start development server**: `npm start` (runs on http://localhost:3000)
- **Build for production**: `npm run build` (creates optimized build in `build/` directory)
- **Run tests**: `npm test` (runs tests in watch mode)
- **Run single test**: Create test files with pattern `*.test.tsx` or `*.test.ts` and run `npm test -- --testNamePattern="<test-name>"`

## Architecture Overview

### Tech Stack
- **Framework**: React 18 with TypeScript
- **State Management**: Redux Toolkit with typed slices
- **Styling**: Tailwind CSS with custom dark theme configuration
- **Maps**: Google Maps JavaScript API with TypeScript types
- **Animations**: Framer Motion for smooth transitions
- **Build Tool**: Create React App (react-scripts)

### Core Architecture
The application follows a Redux-based architecture with three main state slices:
- **securitySlice**: Manages security plans, resources, and risk assessments
- **mapSlice**: Handles Google Maps instance and marker management
- **uiSlice**: Controls UI state (modals, notifications, loading states, sidebar)

### Component Structure
Components are organized by functionality:
- **Container Components**: `MapContainer`, `MapboxContainer` - Handle map rendering and interactions
- **UI Components**: `Header`, `Sidebar`, `FloatingControls`, `InfoPanel` - Main layout structure
- **Feature Components**: `ThreatAssessment`, `SecurityDeployment`, `PlanningSteps`, `ResourcePalette` - Domain-specific functionality
- **Utility Components**: `LoadingOverlay`, `NotificationManager`, `ModalManager` - Reusable UI elements

## Code Style Guidelines
- **TypeScript**: Strict mode enabled, always define types for props and state
- **Component Structure**: Functional components with hooks, use typed selectors with Redux
- **Imports**: Order: React/libraries → Redux/store → Components → Types/utils
- **Styling**: Use Tailwind classes, custom styles in `index.css` for animations
- **State Updates**: Use Redux actions for global state, local state for component-specific UI

## Key Development Patterns
- **Redux Integration**: Use typed hooks from store (`RootState`, `AppDispatch`)
- **Map Handling**: Non-serializable Google Maps objects are handled with custom middleware configuration
- **Animations**: Framer Motion for component transitions, CSS animations for micro-interactions
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints (sm, md, lg, xl)

## Google Maps Configuration
- API key is embedded in `MapContainer.tsx` (replace for production)
- Required Google APIs: Maps JavaScript API, Geometry Library, Drawing Library
- Custom map styling with dark theme to match application design

## Testing Approach
- Component tests go in `src/components/__tests__/`
- Store tests in `src/store/__tests__/`
- Use React Testing Library for component testing
- Mock Google Maps API for map-related tests

## UI/UX Design System

### Color Palette
- **Primary**: Green gradient (#00ff88) - Used for primary actions, success states, active elements
- **Secondary**: Blue gradient (#00d4ff) - Used for secondary actions, info states
- **Dark Theme**: Dark grays (#0a0a0a to #1e293b) - Base background colors
- **Danger**: Red shades (#ff3b30) - Error states, high-risk zones
- **Warning**: Orange shades (#ff9500) - Warning states, medium-risk zones

### Visual Effects
- **Glassmorphism**: `.glass-effect` class - Semi-transparent backgrounds with backdrop blur
- **Gradient Text**: `.gradient-text` class - Primary to secondary color gradient
- **Custom Animations**:
  - `pulse-slow`, `bounce-slow`, `spin-slow` - Loading and attention states
  - `slide-down`, `slide-up`, `slide-in-left`, `slide-in-right` - Component entry animations
  - `fade-in`, `scale-in` - Modal and overlay transitions
  - `scan-line`, `glow` - Special effects for AI processing visualization

### Component Styling Patterns
- **Buttons**: 
  - `.btn-primary` - Gradient background with hover scale effect
  - `.btn-secondary` - Glass effect with border highlight on hover
- **Cards**: `.card` class - Glass effect with rounded corners
- **Input Fields**: `.input-field` class - Dark background with focus state
- **Custom Scrollbar**: Gradient thumb matching primary/secondary colors

### Layout Structure
- **Header**: Fixed top bar with logo, navigation, and notifications
- **Sidebar**: Collapsible left panel (396px width) with planning steps
- **Map Container**: Central area with full-screen map view
- **Right Panel**: Threat assessment and analysis results (396px width)
- **Bottom Panel**: Info panel with metrics and statistics
- **Floating Controls**: Overlay buttons for map interactions

### Responsive Breakpoints
- Mobile: < 640px - Stack layout, bottom sheet navigation
- Tablet: 640px - 1024px - Collapsible sidebar
- Desktop: > 1024px - Full layout with all panels visible

### Animation Library
- **Framer Motion**: Used for component transitions and micro-interactions
- Spring animations for sidebar toggle
- Stagger animations for list items
- Exit animations for smooth component removal

### Notification System
- Toast-style notifications with react-hot-toast
- Color-coded by type (success/error/warning/info)
- Auto-dismiss with manual close option
- Positioned top-right of viewport

### Interactive Elements
- **Map Pins**: Click to place, drag to move, animated placement
- **Perimeter Lines**: Auto-connect with smooth path animations
- **Resource Drag & Drop**: From palette to map placement
- **Progress Indicators**: Multi-step visual progress tracking

## Deployment Notes
- Build outputs to `build/` directory
- Static site deployment ready (Netlify, Vercel, etc.)
- Environment variables not currently used (add `.env` for API keys in production)
- All assets are bundled, no external CDN dependencies except Google Maps