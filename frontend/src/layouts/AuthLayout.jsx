import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { WorkTrackLogo } from './PortalShell';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col justify-center bg-[#F8F9FB] px-4 py-10">
      <div className="mx-auto w-full max-w-[400px]">
        <div className="mb-6 flex justify-center">
          <Link to="/" className="focus:outline-none">
            <WorkTrackLogo />
          </Link>
        </div>
        <div className="rounded-[12px] border border-[#E8EAED] bg-white p-6 shadow-xs">
          <Outlet />
        </div>
        <p className="mt-5 text-center text-[12px] text-[#747B87]">
          WorkTrack Enterprise · Employee & Task Performance Platform
        </p>
      </div>
    </div>
  );
}
