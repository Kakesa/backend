import React from 'react';
import { HelpModule } from '@/components/help';

const TeacherHelpPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6">
      <HelpModule userType="teacher" />
    </div>
  );
};

export default TeacherHelpPage;
