import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../App';
import '../index.css';

// Configure libraries for document export (still needed for frontend)
import { jsPDF } from 'jspdf';
import * as docx from 'docx';

// Attach export libraries to window for use in services
declare global {
    interface Window {
        jspdf: { jsPDF: typeof jsPDF };
        docx: typeof docx;
    }
}

window.jspdf = { jsPDF };
window.docx = docx;

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