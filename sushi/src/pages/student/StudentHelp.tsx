import React from 'react';
import { HelpModule } from '@/components/help';

const StudentHelpPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6">
      <HelpModule userType="student" />
    </div>
  );
};

export default StudentHelpPage;
