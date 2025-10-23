import React, { useState } from 'react';
import './App.css';
import PresentationApp from './components/PresentationApp';
import TextContainerDemo from './components/TextContainerDemo';

/**
 * App wrapper with toggle between main app and text container demo
 * 
 * To use this:
 * 1. Rename your current App.js to App.backup.js
 * 2. Rename this file to App.js
 * 3. Run npm start
 * 
 * OR just import TextContainerDemo directly where you need it
 */
function AppWithDemo() {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <div className="App">
      {/* Toggle Button */}
      <button
        onClick={() => setShowDemo(!showDemo)}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 10000,
          padding: '12px 24px',
          background: showDemo 
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : '#2d3748',
          color: '#ffffff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          transition: 'all 0.3s ease',
          fontFamily: 'Inter, sans-serif'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        }}
      >
        {showDemo ? '← Back to Presentation' : '📦 View Text Container Demo'}
      </button>

      {/* Render either demo or main app */}
      {showDemo ? <TextContainerDemo /> : <PresentationApp />}
    </div>
  );
}

export default AppWithDemo;
