import React from 'react';
import { HelpModule } from '@/components/help';

const AdminHelpPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6">
      <HelpModule userType="admin" />
    </div>
  );
};

export default AdminHelpPage;
