import React from 'react';
import StyledTextContainer, { TextContainerExamples } from './StyledTextContainer';
import './StyledTextContainer.css';

/**
 * Demo page showcasing all text container implementations
 */
const TextContainerDemo = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        background: '#ffffff',
        borderRadius: '1rem',
        padding: '2rem',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: '700', 
            color: '#1a202c',
            marginBottom: '1rem'
          }}>
            📦 Styled Text Container Demo
          </h1>
          <p style={{ 
            fontSize: '1.25rem', 
            color: '#718096',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            Production-ready subtitle boxes with perfect text containment. 
            Text always stays within boundaries, wraps naturally, and never breaks incorrectly.
          </p>
        </header>

        {/* Quick Feature Highlights */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem',
          padding: '2rem',
          background: '#f7fafc',
          borderRadius: '0.75rem'
        }}>
          <FeatureCard 
            icon="✅" 
            title="Perfect Containment"
            description="Text never overflows the box boundaries"
          />
          <FeatureCard 
            icon="🔤" 
            title="Smart Wrapping"
            description="No mid-word breaks like 'supporti ng'"
          />
          <FeatureCard 
            icon="📱" 
            title="Fully Responsive"
            description="Adapts beautifully to all screen sizes"
          />
          <FeatureCard 
            icon="🎨" 
            title="Highly Customizable"
            description="Multiple themes, sizes, and modes"
          />
        </div>

        {/* Main Examples Component */}
        <TextContainerExamples />

        {/* Technical Details Section */}
        <section style={{
          marginTop: '3rem',
          padding: '2rem',
          background: '#f7fafc',
          borderRadius: '0.75rem'
        }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: '600',
            color: '#2d3748',
            marginBottom: '1.5rem'
          }}>
            🔧 Key CSS Properties
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            <PropertyCard
              property="box-sizing: border-box"
              explanation="Includes padding in total width/height, preventing unexpected overflow"
            />
            <PropertyCard
              property="white-space: normal"
              explanation="Allows text to wrap onto multiple lines instead of extending horizontally"
            />
            <PropertyCard
              property="overflow-wrap: break-word"
              explanation="Breaks long words at arbitrary points if they would overflow"
            />
            <PropertyCard
              property="word-break: normal"
              explanation="Prevents breaking words mid-character (e.g., 'supporti ng')"
            />
            <PropertyCard
              property="hyphens: auto"
              explanation="Adds hyphens when breaking words for better readability"
            />
            <PropertyCard
              property="line-height: 1.4"
              explanation="Provides comfortable spacing between lines"
            />
          </div>
        </section>

        {/* Usage Examples Section */}
        <section style={{
          marginTop: '3rem',
          padding: '2rem',
          background: '#1a202c',
          borderRadius: '0.75rem',
          color: '#ffffff'
        }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: '600',
            marginBottom: '1.5rem'
          }}>
            💻 Usage Examples
          </h2>
          
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: '#90cdf4' }}>
              React Component
            </h3>
            <CodeBlock code={`import StyledTextContainer from './StyledTextContainer';

<StyledTextContainer 
  text="Your subtitle here"
  mode="wrap"
  className="custom-class"
/>`} />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: '#90cdf4' }}>
              With Ellipsis Mode
            </h3>
            <CodeBlock code={`<StyledTextContainer 
  text="Long text that will be truncated..."
  mode="ellipsis"
  maxLines={3}
/>`} />
          </div>

          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: '#90cdf4' }}>
              With Auto-Resize
            </h3>
            <CodeBlock code={`<StyledTextContainer 
  text="Text that adjusts size to fit"
  mode="auto-resize"
  minFontSize={12}
  maxFontSize={24}
  style={{ height: '120px' }}
/>`} />
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          marginTop: '3rem',
          padding: '2rem',
          textAlign: 'center',
          borderTop: '2px solid #e2e8f0'
        }}>
          <p style={{ color: '#718096', marginBottom: '1rem' }}>
            All implementations are production-ready, accessible, and fully responsive.
          </p>
          <p style={{ color: '#a0aec0', fontSize: '0.875rem' }}>
            Check the documentation for more details and customization options.
          </p>
        </footer>
      </div>
    </div>
  );
};

// Helper Components
const FeatureCard = ({ icon, title, description }) => (
  <div style={{
    textAlign: 'center',
    padding: '1.5rem'
  }}>
    <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>{icon}</div>
    <h3 style={{ 
      fontSize: '1.125rem', 
      fontWeight: '600', 
      color: '#2d3748',
      marginBottom: '0.5rem'
    }}>
      {title}
    </h3>
    <p style={{ fontSize: '0.875rem', color: '#718096' }}>
      {description}
    </p>
  </div>
);

const PropertyCard = ({ property, explanation }) => (
  <div style={{
    background: '#ffffff',
    padding: '1.25rem',
    borderRadius: '0.5rem',
    border: '1px solid #e2e8f0'
  }}>
    <code style={{
      display: 'block',
      background: '#1a202c',
      color: '#68d391',
      padding: '0.5rem 0.75rem',
      borderRadius: '0.25rem',
      fontSize: '0.875rem',
      marginBottom: '0.75rem',
      fontFamily: 'monospace'
    }}>
      {property}
    </code>
    <p style={{ fontSize: '0.875rem', color: '#4a5568', lineHeight: '1.5' }}>
      {explanation}
    </p>
  </div>
);

const CodeBlock = ({ code }) => (
  <pre style={{
    background: '#2d3748',
    color: '#e2e8f0',
    padding: '1rem',
    borderRadius: '0.5rem',
    overflow: 'auto',
    fontSize: '0.875rem',
    lineHeight: '1.6',
    fontFamily: 'monospace'
  }}>
    <code>{code}</code>
  </pre>
);

export default TextContainerDemo;
