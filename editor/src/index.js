import { createRoot } from "react-dom/client";
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
