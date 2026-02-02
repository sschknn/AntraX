
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App';
import './src/index.css';

// Ensure body has correct background immediately
document.body.style.backgroundColor = '#020617';
document.body.style.color = '#e2e8f0';
document.body.style.fontFamily = 'Inter, system-ui, sans-serif';
document.body.style.margin = '0';
document.body.style.padding = '0';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
