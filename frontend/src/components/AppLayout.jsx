import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const AppLayout = () => {
  return (
    <div className="app-container">
      {/* Shared Application Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="main-wrapper">
        {/* Shared Application Header */}
        <Header />

        {/* Dynamic Page Container */}
        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
