import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Landing from '@/pages/Landing';
import Register from '@/pages/auth/Register';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth/register" element={<Register />} />
      {/* Ajouter d'autres routes ici */}
    </Routes>
  );
};

export default AppRoutes;
