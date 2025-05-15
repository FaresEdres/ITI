'use client';

import {useEffect, useState} from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <nav className='bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm sticky top-0 z-50'>
      <div className='max-w-7xl mx-auto px-6 py-4 flex justify-between items-center'>
        <Link
          href='/'
          className='text-3xl font-bold text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition'
        >
          Blog Center
        </Link>

        <div className='flex items-center space-x-4'>
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className='px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition'
            >
              Logout
            </button>
          ) : (
            <Link
              href='/login'
              className='px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition'
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
