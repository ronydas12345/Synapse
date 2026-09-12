import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import TutorialProvider from './tutorial/TutorialProvider';
import './index.css';

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found.');
  }

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <TutorialProvider>
        <App />
      </TutorialProvider>
    </React.StrictMode>
  );
} catch (error) {
  console.error('Fatal error during initialization:', error);
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    rootElement.innerHTML = `<div style="color: var(--danger, #f07178); padding: 20px; font-family: sans-serif;">
      <h1>Synapse failed to start</h1>
      <p>${message}</p>
    </div>`;
  }
}