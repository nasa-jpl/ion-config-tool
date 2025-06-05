import { createRoot } from "react-dom/client";
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import './index.css';

const root = createRoot(document.getElementById('root'));
root.render(<App />);
registerServiceWorker();
