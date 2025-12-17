import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Profile } from '../components/Profile';

export function ProfilePage() {
  const navigate = useNavigate();

  return (
    <Profile
      onNavigateToLog={() => {
        navigate('/log');
      }}
    />
  );
}

