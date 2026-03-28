import React from 'react';
import { HelpManagement } from '@/components/help';

const SuperAdminHelpManagement: React.FC = () => {
  console.log('SuperAdminHelpManagement rendu');
  
  return (
    <div className="container mx-auto py-6">
      <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">Debug Info</h3>
        <p className="text-blue-700 dark:text-blue-300">Page HelpManagement chargée</p>
      </div>
      <HelpManagement />
    </div>
  );
};

export default SuperAdminHelpManagement;
