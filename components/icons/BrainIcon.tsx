// This file defines the BrainIcon SVG component.
import React from 'react';

export const BrainIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className="h-6 w-6"
    {...props}
  >
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v1a2.5 2.5 0 0 1-4 2" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v1a2.5 2.5 0 0 0 4 2" />
    <path d="M5 14a2.5 2.5 0 0 0-2.5 2.5c0 3.52 3.52 4.5 5.5 4.5" />
    <path d="M19 14a2.5 2.5 0 0 1 2.5 2.5c0 3.52-3.52 4.5-5.5 4.5" />
    <path d="M12 11.5a2.5 2.5 0 0 0-2.5 2.5c0 1.5-1.5 1.5-1.5 3" />
    <path d="M12 11.5a2.5 2.5 0 0 1 2.5 2.5c0 1.5 1.5 1.5 1.5 3" />
    <path d="M2 13.5c0-3 3-3.5 4-4" />
    <path d="M22 13.5c0-3-3-3.5-4-4" />
    <path d="M12 4.5a2.5 2.5 0 0 0-2.5 2.5" />
    <path d="M12 4.5a2.5 2.5 0 0 1 2.5 2.5" />
  </svg>
);
