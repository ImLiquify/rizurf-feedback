import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FeedbackWall } from './components/views/FeedbackWall';
import { FEEDBACKS } from './data/mockData';
import App from './App.jsx';
import { RoleProvider } from './context/RoleContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RoleProvider>
      <App />
    </RoleProvider>
  </StrictMode>
);