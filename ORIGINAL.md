<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AutoSecure - Next-Gen AI Security Planning</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #0a0a0a;
            color: #fff;
            overflow: hidden;
            height: 100vh;
        }

        /* Header */
        .header {
            background: linear-gradient(180deg, rgba(10,10,10,0.98) 0%, rgba(10,10,10,0.9) 100%);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(0, 255, 136, 0.2);
            padding: 1rem 2rem;
            position: fixed;
            width: 100%;
            top: 0;
            z-index: 1000;
            animation: slideDown 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        @keyframes slideDown {
            from {
                transform: translateY(-100%);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        .header-content {
            max-width: 1600px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 1rem;
            font-size: 1.8rem;
            font-weight: 800;
            letter-spacing: -0.5px;
        }

        .logo-icon {
            width: 45px;
            height: 45px;
            background: linear-gradient(135deg, #00ff88 0%, #00d4ff 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 30px rgba(0, 255, 136, 0.4);
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }

        .logo-text {
            background: linear-gradient(135deg, #fff 0%, #00ff88 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .nav-buttons {
            display: flex;
            gap: 1rem;
        }

        .nav-btn {
            padding: 0.75rem 1.5rem;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            color: rgba(255, 255, 255, 0.8);
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 0.9rem;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .nav-btn:hover {
            background: rgba(0, 255, 136, 0.1);
            border-color: rgba(0, 255, 136, 0.5);
            color: #00ff88;
            transform: translateY(-2px);
        }

        .nav-btn.primary {
            background: linear-gradient(135deg, #00ff88 0%, #00d4ff 100%);
            border: none;
            color: #000;
            font-weight: 600;
        }

        /* Main Layout */
        .main-container {
            display: flex;
            height: 100vh;
            padding-top: 75px;
        }

        /* Sidebar */
        .sidebar {
            width: 380px;
            background: linear-gradient(180deg, rgba(15,15,15,0.98) 0%, rgba(10,10,10,0.98) 100%);
            border-right: 1px solid rgba(255, 255, 255, 0.05);
            overflow-y: auto;
            overflow-x: hidden;
            padding: 1.5rem;
            animation: slideInLeft 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        @keyframes slideInLeft {
            from {
                transform: translateX(-100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        /* Mode Selector */
        .mode-selector {
            display: flex;
            gap: 0.5rem;
            padding: 0.4rem;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 14px;
            margin-bottom: 1.5rem;
        }

        .mode-btn {
            flex: 1;
            padding: 0.9rem;
            background: transparent;
            border: none;
            color: rgba(255, 255, 255, 0.5);
            cursor: pointer;
            border-radius: 10px;
            transition: all 0.3s ease;
            font-size: 0.85rem;
            font-weight: 600;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.3rem;
        }

        .mode-btn i {
            font-size: 1.2rem;
        }

        .mode-btn.active {
            background: linear-gradient(135deg, #00ff88 0%, #00d4ff 100%);
            color: #000;
            box-shadow: 0 4px 15px rgba(0, 255, 136, 0.3);
        }

        /* Step Cards */
        .step-card {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            padding: 1.2rem;
            margin-bottom: 1rem;
            transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            cursor: pointer;
            position: relative;
            overflow: hidden;
        }

        .step-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 2px;
            background: linear-gradient(90deg, transparent, #00ff88, transparent);
            animation: none;
        }

        .step-card.active::before {
            animation: scanLine 2s linear infinite;
        }

        @keyframes scanLine {
            from { left: -100%; }
            to { left: 100%; }
        }

        .step-card.active {
            background: rgba(0, 255, 136, 0.05);
            border-color: rgba(0, 255, 136, 0.3);
            transform: translateX(5px);
        }

        .step-card.completed {
            border-color: rgba(0, 255, 136, 0.5);
        }

        .step-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 0.75rem;
        }

        .step-number {
            width: 35px;
            height: 35px;
            background: linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(0, 212, 255, 0.2));
            border: 2px solid rgba(0, 255, 136, 0.5);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 1rem;
        }

        .step-card.active .step-number,
        .step-card.completed .step-number {
            background: linear-gradient(135deg, #00ff88, #00d4ff);
            color: #000;
            border-color: transparent;
        }

        .step-title {
            flex: 1;
            font-weight: 600;
            font-size: 1.05rem;
        }

        .step-status {
            padding: 0.3rem 0.8rem;
            background: rgba(0, 255, 136, 0.1);
            border: 1px solid rgba(0, 255, 136, 0.3);
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
            color: #00ff88;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .step-description {
            color: rgba(255, 255, 255, 0.5);
            font-size: 0.85rem;
            line-height: 1.4;
            margin-top: 0.5rem;
        }

        /* Progress Bar */
        .progress-container {
            margin-top: 1rem;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
            padding: 0.2rem;
            overflow: hidden;
        }

        .progress-bar {
            height: 6px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #00ff88 0%, #00d4ff 100%);
            border-radius: 10px;
            transition: width 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
        }

        /* Map Container */
        .map-container {
            flex: 1;
            position: relative;
            background: #000;
        }

        #map {
            width: 100%;
            height: 100%;
        }

        /* Floating Controls */
        .floating-controls {
            position: absolute;
            top: 20px;
            right: 20px;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            z-index: 500;
        }

        .control-btn {
            width: 48px;
            height: 48px;
            background: rgba(10, 10, 10, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            color: rgba(255, 255, 255, 0.7);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            font-size: 1.1rem;
        }

        .control-btn:hover {
            background: rgba(0, 255, 136, 0.1);
            border-color: rgba(0, 255, 136, 0.5);
            color: #00ff88;
            transform: scale(1.1);
        }

        .control-btn.active {
            background: linear-gradient(135deg, #00ff88, #00d4ff);
            color: #000;
            border: none;
        }

        /* Info Panel */
        .info-panel {
            position: absolute;
            bottom: 20px;
            left: 20px;
            background: rgba(10, 10, 10, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 1.5rem;
            min-width: 350px;
            z-index: 500;
            animation: slideUp 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        @keyframes slideUp {
            from {
                transform: translateY(100px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        .info-title {
            font-weight: 700;
            font-size: 1.1rem;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .info-title i {
            color: #00ff88;
        }

        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
        }

        .info-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem;
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            transition: all 0.3s ease;
        }

        .info-item:hover {
            background: rgba(0, 255, 136, 0.05);
            border-color: rgba(0, 255, 136, 0.2);
        }

        .info-icon {
            width: 35px;
            height: 35px;
            background: linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(0, 212, 255, 0.2));
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1rem;
        }

        .info-details {
            flex: 1;
        }

        .info-label {
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.4);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .info-value {
            font-weight: 700;
            font-size: 1.1rem;
            color: #fff;
        }

        /* Analysis Modal */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(5px);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .modal {
            background: linear-gradient(180deg, rgba(20,20,20,0.98) 0%, rgba(10,10,10,0.98) 100%);
            border: 1px solid rgba(0, 255, 136, 0.3);
            border-radius: 20px;
            padding: 2rem;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            animation: slideScale 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        @keyframes slideScale {
            from {
                transform: scale(0.8) translateY(50px);
                opacity: 0;
            }
            to {
                transform: scale(1) translateY(0);
                opacity: 1;
            }
        }

        .modal-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .modal-title {
            font-size: 1.5rem;
            font-weight: 700;
            background: linear-gradient(135deg, #00ff88, #00d4ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        /* Risk Items */
        .risk-list {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        .risk-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            transition: all 0.3s ease;
        }

        .risk-item:hover {
            background: rgba(0, 255, 136, 0.05);
            border-color: rgba(0, 255, 136, 0.2);
            transform: translateX(5px);
        }

        .risk-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, rgba(255, 59, 48, 0.2), rgba(255, 149, 0, 0.2));
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
        }

        .risk-details {
            flex: 1;
        }

        .risk-title {
            font-weight: 600;
            margin-bottom: 0.25rem;
        }

        .risk-desc {
            font-size: 0.85rem;
            color: rgba(255, 255, 255, 0.5);
        }

        .risk-level {
            padding: 0.4rem 0.8rem;
            border-radius: 8px;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
        }

        .risk-high {
            background: rgba(255, 59, 48, 0.2);
            color: #ff3b30;
            border: 1px solid rgba(255, 59, 48, 0.5);
        }

        .risk-medium {
            background: rgba(255, 149, 0, 0.2);
            color: #ff9500;
            border: 1px solid rgba(255, 149, 0, 0.5);
        }

        .risk-low {
            background: rgba(52, 199, 89, 0.2);
            color: #34c759;
            border: 1px solid rgba(52, 199, 89, 0.5);
        }

        /* Resources */
        .resource-grid {
            display: grid;
            gap: 0.75rem;
            margin-top: 1rem;
        }

        .resource-card {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            transition: all 0.3s ease;
        }

        .resource-card:hover {
            background: rgba(0, 255, 136, 0.05);
            border-color: rgba(0, 255, 136, 0.2);
            transform: translateX(5px);
        }

        .resource-icon {
            width: 45px;
            height: 45px;
            background: linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(0, 212, 255, 0.2));
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            color: #00ff88;
        }

        .resource-info {
            flex: 1;
        }

        .resource-name {
            font-weight: 600;
            margin-bottom: 0.25rem;
        }

        .resource-count {
            font-size: 0.85rem;
            color: rgba(255, 255, 255, 0.5);
        }

        .resource-status {
            padding: 0.25rem 0.5rem;
            background: rgba(0, 255, 136, 0.1);
            border: 1px solid rgba(0, 255, 136, 0.3);
            border-radius: 6px;
            font-size: 0.7rem;
            font-weight: 600;
            color: #00ff88;
            text-transform: uppercase;
        }

        /* Loading State */
        .loading-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            display: none;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 1500;
        }

        .loading-spinner {
            width: 80px;
            height: 80px;
            border: 3px solid rgba(0, 255, 136, 0.1);
            border-top: 3px solid #00ff88;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 2rem;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .loading-text {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            background: linear-gradient(135deg, #00ff88, #00d4ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .loading-progress {
            width: 300px;
            height: 4px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
            overflow: hidden;
            margin-top: 1rem;
        }

        .loading-progress-bar {
            height: 100%;
            background: linear-gradient(90deg, #00ff88, #00d4ff);
            width: 0%;
            animation: loadProgress 3s ease-in-out;
        }

        @keyframes loadProgress {
            0% { width: 0%; }
            50% { width: 70%; }
            100% { width: 100%; }
        }

        /* Notification */
        .notification {
            position: fixed;
            top: 100px;
            right: 20px;
            background: linear-gradient(135deg, rgba(10,10,10,0.95), rgba(20,20,20,0.95));
            backdrop-filter: blur(20px);
            border: 1px solid rgba(0, 255, 136, 0.5);
            border-radius: 12px;
            padding: 1rem 1.5rem;
            display: none;
            align-items: center;
            gap: 1rem;
            z-index: 3000;
            animation: slideInRight 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            box-shadow: 0 10px 40px rgba(0, 255, 136, 0.2);
        }

        @keyframes slideInRight {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        .notification-icon {
            width: 35px;
            height: 35px;
            background: linear-gradient(135deg, #00ff88, #00d4ff);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #000;
        }

        .notification-content {
            flex: 1;
        }

        .notification-title {
            font-weight: 700;
            margin-bottom: 0.25rem;
        }

        .notification-message {
            font-size: 0.85rem;
            color: rgba(255, 255, 255, 0.7);
        }

        /* Canvas Overlay for Drawing */
        #drawingCanvas {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 400;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
            .sidebar {
                position: absolute;
                transform: translateX(-100%);
                z-index: 600;
                width: 100%;
            }
            
            .sidebar.open {
                transform: translateX(0);
            }
            
            .info-panel {
                left: 10px;
                right: 10px;
                bottom: 10px;
                min-width: auto;
            }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <header class="header">
        <div class="header-content">
            <div class="logo">
                <div class="logo-icon">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <span class="logo-text">AutoSecure</span>
            </div>
            <div class="nav-buttons">
                <button class="nav-btn" onclick="showAIStatus()">
                    <i class="fas fa-brain"></i>
                    <span>AI Analysis</span>
                </button>
                <button class="nav-btn" onclick="toggleSimulation()">
                    <i class="fas fa-users"></i>
                    <span>Simulation</span>
                </button>
                <button class="nav-btn primary" onclick="exportPlan()">
                    <i class="fas fa-download"></i>
                    <span>Export Plan</span>
                </button>
            </div>
        </div>
    </header>

    <!-- Main Container -->
    <div class="main-container">
        <!-- Sidebar -->
        <aside class="sidebar" id="sidebar">
            <!-- Mode Selector -->
            <div class="mode-selector">
                <button class="mode-btn active" onclick="setMode('planning')">
                    <i class="fas fa-map-marked-alt"></i>
                    <span>Planning</span>
                </button>
                <button class="mode-btn" onclick="setMode('simulation')">
                    <i class="fas fa-chart-line"></i>
                    <span>Analytics</span>
                </button>
                <button class="mode-btn" onclick="setMode('operations')">
                    <i class="fas fa-satellite-dish"></i>
                    <span>Live Ops</span>
                </button>
            </div>

            <!-- Planning Steps -->
            <div id="planningPanel">
                <div class="step-card active" id="step1">
                    <div class="step-header">
                        <div class="step-number">1</div>
                        <div class="step-title">Define Perimeter</div>
                        <div class="step-status">Active</div>
                    </div>
                    <p class="step-description">
                        Click on the map to place security pins. Minimum 4 pins required to create event boundary.
                    </p>
                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress-fill" id="perimeterProgress" style="width: 0%"></div>
                        </div>
                    </div>
                </div>

                <div class="step-card" id="step2">
                    <div class="step-header">
                        <div class="step-number">2</div>
                        <div class="step-title">AI Analysis</div>
                        <div class="step-status">Pending</div>
                    </div>
                    <p class="step-description">
                        Automatic risk assessment, topology analysis, and threat identification.
                    </p>
                </div>

                <div class="step-card" id="step3">
                    <div class="step-header">
                        <div class="step-number">3</div>
                        <div class="step-title">Resource Deployment</div>
                        <div class="step-status">Pending</div>
                    </div>
                    <p class="step-description">
                        AI-optimized placement of security personnel and equipment.
                    </p>
                </div>

                <div class="step-card" id="step4">
                    <div class="step-header">
                        <div class="step-number">4</div>
                        <div class="step-title">Operations Order</div>
                        <div class="step-status">Pending</div>
                    </div>
                    <p class="step-description">
                        Generate comprehensive security documentation and briefings.
                    </p>
                </div>
            </div>

            <!-- Resources Panel (Hidden Initially) -->
            <div id="resourcesPanel" style="display: none;">
                <h3 style="margin: 1.5rem 0 1rem; font-size: 1.1rem; font-weight: 700;">
                    <i class="fas fa-shield-alt" style="color: #00ff88; margin-right: 0.5rem;"></i>
                    Deployed Resources
                </h3>
                <div class="resource-grid" id="resourcesList"></div>
            </div>
        </aside>

        <!-- Map Container -->
        <div class="map-container">
            <div id="map"></div>
            <canvas id="drawingCanvas"></canvas>

            <!-- Floating Controls -->
            <div class="floating-controls">
                <button class="control-btn" onclick="toggleView()" title="Toggle View">
                    <i class="fas fa-cube"></i>
                </button>
                <button class="control-btn" onclick="toggleHeatmap()" title="Risk Heatmap">
                    <i class="fas fa-fire"></i>
                </button>
                <button class="control-btn" onclick="runCrowdSimulation()" title="Crowd Simulation">
                    <i class="fas fa-play"></i>
                </button>
                <button class="control-btn" onclick="clearAll()" title="Clear All">
                    <i class="fas fa-redo"></i>
                </button>
            </div>

            <!-- Info Panel -->
            <div class="info-panel">
                <div class="info-title">
                    <i class="fas fa-chart-bar"></i>
                    Event Security Metrics
                </div>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-icon" style="color: #00ff88;">
                            <i class="fas fa-vector-square"></i>
                        </div>
                        <div class="info-details">
                            <div class="info-label">Coverage Area</div>
                            <div class="info-value" id="areaValue">0 m²</div>
                        </div>
                    </div>
                    <div class="info-item">
                        <div class="info-icon" style="color: #00d4ff;">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="info-details">
                            <div class="info-label">Max Capacity</div>
                            <div class="info-value" id="capacityValue">0</div>
                        </div>
                    </div>
                    <div class="info-item">
                        <div class="info-icon" style="color: #ff9500;">
                            <i class="fas fa-user-shield"></i>
                        </div>
                        <div class="info-details">
                            <div class="info-label">Security Staff</div>
                            <div class="info-value" id="guardsValue">0</div>
                        </div>
                    </div>
                    <div class="info-item">
                        <div class="info-icon" style="color: #ff3b30;">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="info-details">
                            <div class="info-label">Risk Points</div>
                            <div class="info-value" id="risksValue">0</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Loading Overlay -->
            <div class="loading-overlay" id="loadingOverlay">
                <div class="loading-spinner"></div>
                <div class="loading-text">Analyzing Location</div>
                <div style="color: rgba(255,255,255,0.5); margin-top: 0.5rem;" id="loadingStatus">
                    Processing satellite imagery...
                </div>
                <div class="loading-progress">
                    <div class="loading-progress-bar"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- Analysis Modal -->
    <div class="modal-overlay" id="analysisModal">
        <div class="modal">
            <div class="modal-header">
                <i class="fas fa-brain" style="font-size: 2rem; color: #00ff88;"></i>
                <h2 class="modal-title">AI Security Analysis Complete</h2>
            </div>
            <div class="risk-list" id="riskList"></div>
            <button class="nav-btn primary" style="width: 100%; margin-top: 1.5rem; justify-content: center;" onclick="acceptAnalysis()">
                <i class="fas fa-check"></i>
                Accept & Deploy Resources
            </button>
        </div>
    </div>

    <!-- Notification -->
    <div class="notification" id="notification">
        <div class="notification-icon">
            <i class="fas fa-check"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title" id="notificationTitle">Success</div>
            <div class="notification-message" id="notificationMessage">Operation completed</div>
        </div>
    </div>

    <script>
        // Global variables
        let map;
        let markers = [];
        let polygon = null;
        let securityMarkers = [];
        let heatmapCircles = [];
        let currentMode = 'planning';
        let canvas, ctx;
        let isDrawing = false;
        let simulationInterval = null;

        // Initialize Google Maps
        function initMap() {
            // Default to Times Square, NYC
            const defaultLocation = { lat: 40.7580, lng: -73.9855 };
            
            map = new google.maps.Map(document.getElementById('map'), {
                center: defaultLocation,
                zoom: 17,
                mapTypeId: 'satellite',
                tilt: 0,
                styles: [
                    {
                        featureType: "all",
                        elementType: "labels",
                        stylers: [{ visibility: "on" }]
                    },
                    {
                        featureType: "poi",
                        elementType: "labels",
                        stylers: [{ visibility: "off" }]
                    }
                ],
                mapTypeControl: true,
                mapTypeControlOptions: {
                    position: google.maps.ControlPosition.TOP_LEFT,
                    mapTypeIds: ['satellite', 'hybrid', 'terrain']
                },
                streetViewControl: true,
                fullscreenControl: false,
                zoomControl: true,
                zoomControlOptions: {
                    position: google.maps.ControlPosition.LEFT_CENTER
                }
            });

            // Add click listener for placing pins
            map.addListener('click', (event) => {
                if (currentMode === 'planning' && markers.length < 8) {
                    addSecurityPin(event.latLng);
                }
            });

            // Show initial instruction
            showNotification('Welcome to AutoSecure', 'Click on the map to define your security perimeter (min 4 points)');

            // Initialize canvas for drawing
            initCanvas();
        }

        // Initialize canvas overlay
        function initCanvas() {
            canvas = document.getElementById('drawingCanvas');
            ctx = canvas.getContext('2d');
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);
        }

        // Resize canvas to match map
        function resizeCanvas() {
            const mapDiv = document.getElementById('map');
            canvas.width = mapDiv.offsetWidth;
            canvas.height = mapDiv.offsetHeight;
        }

        // Add security pin
        function addSecurityPin(location) {
            const marker = new google.maps.Marker({
                position: location,
                map: map,
                draggable: true,
                animation: google.maps.Animation.DROP,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 12,
                    fillColor: '#00ff88',
                    fillOpacity: 0.9,
                    strokeColor: '#fff',
                    strokeWeight: 2
                },
                label: {
                    text: (markers.length + 1).toString(),
                    color: '#000',
                    fontSize: '12px',
                    fontWeight: 'bold'
                }
            });

            markers.push(marker);
            updatePerimeter();
            updateProgress();

            // Auto-complete after 4 pins
            if (markers.length === 4) {
                setTimeout(completePerimeter, 500);
            }

            // Add drag listener
            marker.addListener('dragend', updatePerimeter);
        }

        // Update perimeter polygon
        function updatePerimeter() {
            if (polygon) {
                polygon.setMap(null);
            }

            if (markers.length >= 3) {
                const paths = markers.map(marker => marker.getPosition());
                
                polygon = new google.maps.Polygon({
                    paths: paths,
                    strokeColor: '#00ff88',
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: '#00ff88',
                    fillOpacity: 0.15,
                    editable: false,
                    map: map
                });

                // Calculate area
                const area = google.maps.geometry.spherical.computeArea(paths);
                document.getElementById('areaValue').textContent = Math.round(area).toLocaleString() + ' m²';
                document.getElementById('capacityValue').textContent = Math.round(area / 2).toLocaleString();
            }
        }

        // Update progress bar
        function updateProgress() {
            const progress = Math.min((markers.length / 4) * 100, 100);
            document.getElementById('perimeterProgress').style.width = progress + '%';
        }

        // Complete perimeter and start analysis
        function completePerimeter() {
            if (markers.length < 4) {
                showNotification('Incomplete Perimeter', 'Please add at least 4 points');
                return;
            }

            // Update UI
            document.getElementById('step1').classList.remove('active');
            document.getElementById('step1').classList.add('completed');
            document.getElementById('step1').querySelector('.step-status').textContent = 'Complete';
            
            document.getElementById('step2').classList.add('active');
            document.getElementById('step2').querySelector('.step-status').textContent = 'Processing';

            // Show loading
            document.getElementById('loadingOverlay').style.display = 'flex';

            // Simulate AI analysis
            const loadingMessages = [
                'Analyzing satellite imagery...',
                'Identifying access points...',
                'Calculating risk zones...',
                'Detecting nearby infrastructure...',
                'Processing crowd flow patterns...',
                'Optimizing security positions...'
            ];

            let messageIndex = 0;
            const messageInterval = setInterval(() => {
                if (messageIndex < loadingMessages.length) {
                    document.getElementById('loadingStatus').textContent = loadingMessages[messageIndex];
                    messageIndex++;
                } else {
                    clearInterval(messageInterval);
                    setTimeout(showAnalysisResults, 500);
                }
            }, 500);
        }

        // Show AI analysis results
        function showAnalysisResults() {
            document.getElementById('loadingOverlay').style.display = 'none';

            // Generate risk analysis
            const risks = [
                { 
                    level: 'high', 
                    icon: 'fa-car', 
                    title: 'Vehicle Access Point', 
                    desc: 'Unprotected road access on north perimeter - recommend concrete barriers'
                },
                { 
                    level: 'medium', 
                    icon: 'fa-users', 
                    title: 'Crowd Bottleneck', 
                    desc: 'Main entrance width insufficient for expected flow rate'
                },
                { 
                    level: 'medium', 
                    icon: 'fa-building', 
                    title: 'Adjacent Building', 
                    desc: 'Multi-story structure with direct sightlines - requires monitoring'
                },
                { 
                    level: 'low', 
                    icon: 'fa-eye', 
                    title: 'Surveillance Gap', 
                    desc: 'Limited camera coverage in southeast corner'
                },
                { 
                    level: 'high', 
                    icon: 'fa-door-open', 
                    title: 'Emergency Egress', 
                    desc: 'Insufficient emergency exits for capacity - add 2 more exits'
                }
            ];

            // Build risk HTML
            let riskHTML = '';
            risks.forEach(risk => {
                riskHTML += `
                    <div class="risk-item">
                        <div class="risk-icon">
                            <i class="fas ${risk.icon}"></i>
                        </div>
                        <div class="risk-details">
                            <div class="risk-title">${risk.title}</div>
                            <div class="risk-desc">${risk.desc}</div>
                        </div>
                        <div class="risk-level risk-${risk.level}">${risk.level}</div>
                    </div>
                `;
            });

            document.getElementById('riskList').innerHTML = riskHTML;
            document.getElementById('risksValue').textContent = risks.length;
            document.getElementById('analysisModal').style.display = 'flex';

            // Add risk markers on map
            addRiskMarkers();

            // Update step status
            document.getElementById('step2').classList.remove('active');
            document.getElementById('step2').classList.add('completed');
            document.getElementById('step2').querySelector('.step-status').textContent = 'Complete';
        }

        // Add risk markers to map
        function addRiskMarkers() {
            if (!polygon) return;

            const bounds = polygon.getPath();
            const center = getPolygonCenter(bounds);

            // Add risk indicators at strategic points
            const riskPositions = [
                { lat: center.lat() + 0.0003, lng: center.lng() - 0.0003 },
                { lat: center.lat() - 0.0003, lng: center.lng() + 0.0003 },
                { lat: center.lat() + 0.0002, lng: center.lng() + 0.0004 }
            ];

            riskPositions.forEach(pos => {
                new google.maps.Marker({
                    position: pos,
                    map: map,
                    icon: {
                        path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                        scale: 8,
                        fillColor: '#ff3b30',
                        fillOpacity: 0.8,
                        strokeColor: '#fff',
                        strokeWeight: 2,
                        rotation: 45
                    }
                });
            });
        }

        // Get polygon center
        function getPolygonCenter(path) {
            let lat = 0, lng = 0;
            for (let i = 0; i < path.getLength(); i++) {
                lat += path.getAt(i).lat();
                lng += path.getAt(i).lng();
            }
            return new google.maps.LatLng(lat / path.getLength(), lng / path.getLength());
        }

        // Accept analysis and deploy resources
        function acceptAnalysis() {
            document.getElementById('analysisModal').style.display = 'none';
            
            document.getElementById('step3').classList.add('active');
            document.getElementById('step3').querySelector('.step-status').textContent = 'Deploying';

            setTimeout(() => {
                deploySecurityResources();
            }, 500);
        }

        // Deploy security resources
        function deploySecurityResources() {
            if (!polygon) return;

            const path = polygon.getPath();
            const area = google.maps.geometry.spherical.computeArea(path);
            const perimeter = google.maps.geometry.spherical.computeLength(path);
            
            // Calculate required resources
            const guardsNeeded = Math.ceil(perimeter / 50); // 1 guard per 50m
            const camerasNeeded = Math.ceil(perimeter / 75); // 1 camera per 75m
            const checkpointsNeeded = Math.max(3, Math.ceil(area / 5000)); // Min 3 checkpoints

            // Deploy guards around perimeter
            for (let i = 0; i < guardsNeeded; i++) {
                const position = interpolatePosition(path, i / guardsNeeded);
                const guardMarker = new google.maps.Marker({
                    position: position,
                    map: map,
                    icon: {
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                            <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="15" cy="15" r="12" fill="#00a8ff" opacity="0.8"/>
                                <text x="15" y="20" text-anchor="middle" fill="white" font-size="16" font-weight="bold">G</text>
                            </svg>
                        `),
                        scaledSize: new google.maps.Size(30, 30)
                    },
                    title: `Guard Position ${i + 1}`
                });
                securityMarkers.push(guardMarker);
            }

            // Deploy cameras
            for (let i = 0; i < camerasNeeded; i++) {
                const position = interpolatePosition(path, (i + 0.5) / camerasNeeded);
                const cameraMarker = new google.maps.Marker({
                    position: position,
                    map: map,
                    icon: {
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                            <svg width="25" height="25" viewBox="0 0 25 25" xmlns="http://www.w3.org/2000/svg">
                                <rect x="5" y="8" width="15" height="10" fill="#ff9500" opacity="0.8" rx="2"/>
                                <circle cx="18" cy="13" r="3" fill="#333"/>
                            </svg>
                        `),
                        scaledSize: new google.maps.Size(25, 25)
                    },
                    title: `CCTV Camera ${i + 1}`
                });
                securityMarkers.push(cameraMarker);
            }

            // Update UI
            document.getElementById('guardsValue').textContent = guardsNeeded;
            showResourcesPanel(guardsNeeded, camerasNeeded, checkpointsNeeded);
            
            // Update steps
            document.getElementById('step3').classList.remove('active');
            document.getElementById('step3').classList.add('completed');
            document.getElementById('step3').querySelector('.step-status').textContent = 'Complete';
            
            document.getElementById('step4').classList.add('active');
            document.getElementById('step4').querySelector('.step-status').textContent = 'Ready';

            showNotification('Deployment Complete', `${guardsNeeded} guards and ${camerasNeeded} cameras positioned`);
        }

        // Interpolate position along polygon perimeter
        function interpolatePosition(path, fraction) {
            const totalLength = google.maps.geometry.spherical.computeLength(path);
            const targetLength = totalLength * fraction;
            
            let accumulatedLength = 0;
            for (let i = 0; i < path.getLength(); i++) {
                const start = path.getAt(i);
                const end = path.getAt((i + 1) % path.getLength());
                const segmentLength = google.maps.geometry.spherical.computeDistanceBetween(start, end);
                
                if (accumulatedLength + segmentLength >= targetLength) {
                    const segmentFraction = (targetLength - accumulatedLength) / segmentLength;
                    return google.maps.geometry.spherical.interpolate(start, end, segmentFraction);
                }
                accumulatedLength += segmentLength;
            }
            return path.getAt(0);
        }

        // Show resources panel
        function showResourcesPanel(guards, cameras, checkpoints) {
            const resources = [
                { icon: 'fa-user-shield', name: 'Security Guards', count: guards, status: 'deployed' },
                { icon: 'fa-video', name: 'CCTV Cameras', count: cameras, status: 'active' },
                { icon: 'fa-door-open', name: 'Entry Checkpoints', count: checkpoints, status: 'ready' },
                { icon: 'fa-broadcast-tower', name: 'Metal Detectors', count: checkpoints * 2, status: 'standby' },
                { icon: 'fa-medkit', name: 'Medical Stations', count: Math.ceil(checkpoints / 2), status: 'ready' },
                { icon: 'fa-walkie-talkie', name: 'Radio Units', count: guards + 5, status: 'distributed' }
            ];

            let resourceHTML = '';
            resources.forEach(resource => {
                resourceHTML += `
                    <div class="resource-card">
                        <div class="resource-icon">
                            <i class="fas ${resource.icon}"></i>
                        </div>
                        <div class="resource-info">
                            <div class="resource-name">${resource.name}</div>
                            <div class="resource-count">${resource.count} units</div>
                        </div>
                        <div class="resource-status">${resource.status}</div>
                    </div>
                `;
            });

            document.getElementById('resourcesList').innerHTML = resourceHTML;
            document.getElementById('resourcesPanel').style.display = 'block';
        }

        // Toggle heatmap
        function toggleHeatmap() {
            if (heatmapCircles.length > 0) {
                heatmapCircles.forEach(circle => circle.setMap(null));
                heatmapCircles = [];
                showNotification('Heatmap', 'Risk heatmap disabled');
            } else {
                if (!polygon) {
                    showNotification('No Perimeter', 'Please define a perimeter first');
                    return;
                }

                const bounds = polygon.getPath();
                const center = getPolygonCenter(bounds);

                // Create heatmap circles
                const heatPoints = [
                    { center: center, radius: 50, color: '#ff0000', opacity: 0.3 },
                    { center: { lat: center.lat() + 0.0002, lng: center.lng() }, radius: 40, color: '#ff9500', opacity: 0.25 },
                    { center: { lat: center.lat() - 0.0002, lng: center.lng() + 0.0002 }, radius: 35, color: '#ffcc00', opacity: 0.2 },
                    { center: { lat: center.lat(), lng: center.lng() - 0.0002 }, radius: 30, color: '#34c759', opacity: 0.15 }
                ];

                heatPoints.forEach(point => {
                    const circle = new google.maps.Circle({
                        center: point.center,
                        radius: point.radius,
                        fillColor: point.color,
                        fillOpacity: point.opacity,
                        strokeWeight: 0,
                        map: map
                    });
                    heatmapCircles.push(circle);
                });

                showNotification('Heatmap', 'Risk heatmap enabled');
            }
        }

        // Run crowd simulation
        function runCrowdSimulation() {
            if (!polygon) {
                showNotification('No Perimeter', 'Please define a perimeter first');
                return;
            }

            if (simulationInterval) {
                clearInterval(simulationInterval);
                simulationInterval = null;
                showNotification('Simulation', 'Crowd simulation stopped');
                return;
            }

            showNotification('Simulation', 'Running crowd flow simulation...');

            const bounds = polygon.getPath();
            const crowdMarkers = [];

            // Create crowd dots
            for (let i = 0; i < 30; i++) {
                const position = getRandomPointInPolygon(bounds);
                const marker = new google.maps.Marker({
                    position: position,
                    map: map,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 3,
                        fillColor: '#00ff88',
                        fillOpacity: 0.6,
                        strokeWeight: 0
                    }
                });
                crowdMarkers.push(marker);
            }

            // Animate crowd movement
            simulationInterval = setInterval(() => {
                crowdMarkers.forEach(marker => {
                    const pos = marker.getPosition();
                    const newLat = pos.lat() + (Math.random() - 0.5) * 0.0001;
                    const newLng = pos.lng() + (Math.random() - 0.5) * 0.0001;
                    marker.setPosition(new google.maps.LatLng(newLat, newLng));
                });
            }, 100);

            // Stop after 10 seconds
            setTimeout(() => {
                if (simulationInterval) {
                    clearInterval(simulationInterval);
                    simulationInterval = null;
                    crowdMarkers.forEach(marker => marker.setMap(null));
                    showNotification('Simulation', 'Crowd simulation complete');
                }
            }, 10000);
        }

        // Get random point in polygon
        function getRandomPointInPolygon(path) {
            const bounds = new google.maps.LatLngBounds();
            for (let i = 0; i < path.getLength(); i++) {
                bounds.extend(path.getAt(i));
            }
            
            let point;
            do {
                const lat = bounds.getSouthWest().lat() + Math.random() * (bounds.getNorthEast().lat() - bounds.getSouthWest().lat());
                const lng = bounds.getSouthWest().lng() + Math.random() * (bounds.getNorthEast().lng() - bounds.getSouthWest().lng());
                point = new google.maps.LatLng(lat, lng);
            } while (!google.maps.geometry.poly.containsLocation(point, new google.maps.Polygon({ paths: path })));
            
            return point;
        }

        // Toggle view (2D/3D)
        function toggleView() {
            const currentTilt = map.getTilt();
            if (currentTilt === 0) {
                map.setTilt(45);
                showNotification('View Mode', '3D view activated');
            } else {
                map.setTilt(0);
                showNotification('View Mode', '2D view activated');
            }
        }

        // Clear all
        function clearAll() {
            // Clear markers
            markers.forEach(marker => marker.setMap(null));
            securityMarkers.forEach(marker => marker.setMap(null));
            heatmapCircles.forEach(circle => circle.setMap(null));
            
            if (polygon) polygon.setMap(null);
            
            // Reset arrays
            markers = [];
            securityMarkers = [];
            heatmapCircles = [];
            polygon = null;

            // Reset UI
            document.querySelectorAll('.step-card').forEach(card => {
                card.classList.remove('active', 'completed');
                card.querySelector('.step-status').textContent = 'Pending';
            });
            document.getElementById('step1').classList.add('active');
            document.getElementById('step1').querySelector('.step-status').textContent = 'Active';

            document.getElementById('perimeterProgress').style.width = '0%';
            document.getElementById('areaValue').textContent = '0 m²';
            document.getElementById('capacityValue').textContent = '0';
            document.getElementById('guardsValue').textContent = '0';
            document.getElementById('risksValue').textContent = '0';
            document.getElementById('resourcesPanel').style.display = 'none';

            showNotification('Reset', 'All data cleared - ready to start new plan');
        }

        // Set mode
        function setMode(mode) {
            currentMode = mode;
            document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            
            showNotification('Mode Changed', `${mode.charAt(0).toUpperCase() + mode.slice(1)} mode activated`);
        }

        // Show AI status
        function showAIStatus() {
            showNotification('AI Status', 'Neural networks online - 12 models active');
        }

        // Toggle simulation
        function toggleSimulation() {
            runCrowdSimulation();
        }

        // Export plan
        function exportPlan() {
            showNotification('Export', 'Generating operations order document...');
            setTimeout(() => {
                showNotification('Export Complete', 'SecPlan_2024.pdf ready for download');
            }, 2000);
        }

        // Show notification
        function showNotification(title, message) {
            const notification = document.getElementById('notification');
            document.getElementById('notificationTitle').textContent = title;
            document.getElementById('notificationMessage').textContent = message;
            
            notification.style.display = 'flex';
            
            setTimeout(() => {
                notification.style.display = 'none';
            }, 4000);
        }

        // Load Google Maps API
        function loadGoogleMaps() {
            const script = document.createElement('script');
            script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyBIwzALxUPNbatRBj3Xi1Uhp0fFzwWNBkE&libraries=geometry,drawing,places&callback=initMap';
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        }

        // Initialize on load
        window.addEventListener('load', loadGoogleMaps);
    </script>
</body>
</html>