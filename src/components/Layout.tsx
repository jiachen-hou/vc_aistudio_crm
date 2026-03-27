import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Users } from 'lucide-react';

export function Layout() {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-[#f6f8fa]">
      <nav className="bg-[#24292f] border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                <div className="w-8 h-8 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <span className="font-semibold text-lg text-white">CRM</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <img
                src="/user-avatar.png"
                alt="Avatar"
                className="w-8 h-8 rounded-full border border-gray-400"
                referrerPolicy="no-referrer"
              />
              <span className="text-sm text-gray-300 hidden sm:block">
                {user?.email}
              </span>
              <button
                onClick={signOut}
                className="inline-flex items-center gap-2 px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-300 hover:text-white focus:outline-none transition"
              >
                <LogOut className="w-4 h-4" />
                退出登录
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
