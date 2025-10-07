
import React from 'react';

interface StepProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}

export const Step: React.FC<StepProps> = ({ icon, title, description, children }) => {
  return (
    <div className="glass-card p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 animate-scaleIn">
      <div className="flex items-start space-x-5 mb-5">
        <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg">
          {icon}
        </div>
        <div className="flex-grow">
          <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
      <div className="pl-0">
        {children}
      </div>
    </div>
  );
};
