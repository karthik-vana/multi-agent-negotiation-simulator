import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route wrapper that prevents authenticated users from revisiting the login page.
 * Redirects authenticated users to the home dashboard.
 */
const PublicOnlyRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e2e8f0',
            borderTop: '3px solid #4f46e5',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      </div>
    );
  }

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  return children ? children : <Outlet />;
};

export default PublicOnlyRoute;
