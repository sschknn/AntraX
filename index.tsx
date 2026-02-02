import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Verbesserte Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return React.createElement('div', {
        style: {
          minHeight: '100vh',
          backgroundColor: '#020617',
          color: '#e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          padding: '20px',
          textAlign: 'center',
          fontFamily: 'Inter, system-ui, sans-serif'
        }
      }, [
        React.createElement('h1', { 
          key: 'title',
          style: { fontSize: '24px', marginBottom: '16px', color: '#f87171' }
        }, '⚠️ AntraX-AI Fehler'),
        React.createElement('p', { 
          key: 'message',
          style: { marginBottom: '20px', color: '#94a3b8' }
        }, 'Die App ist auf einen Fehler gestoßen.'),
        React.createElement('button', {
          key: 'reload',
          onClick: () => window.location.reload(),
          style: {
            backgroundColor: '#6366f1',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }
        }, 'App neu laden')
      ]);
    }

    return this.props.children;
  }
}

// App rendern mit StrictMode
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  React.createElement(React.StrictMode, null,
    React.createElement(ErrorBoundary, null,
      React.createElement(App)
    )
  )
);
