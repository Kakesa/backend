import React from 'react';
import { HelpModule } from '@/components/help';

const ParentHelpPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6">
      <HelpModule userType="parent" />
    </div>
  );
};

export default ParentHelpPage;
