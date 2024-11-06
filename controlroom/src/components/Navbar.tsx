'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface UserData {
  username?: string;
  name?: string;
}

export default function Navbar() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkAuth();
  }, [pathname]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        setUser(null);
        router.push('/login');
        router.refresh();
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === '/') {
      e.preventDefault();
      router.refresh();
    }
  };

  if (isLoading) {
    return <nav className="bg-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <Link href="/" className="flex items-center py-4 px-2">
            ControlRoom
          </Link>
        </div>
      </div>
    </nav>;
  }

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Left section */}
          <Link 
            href="/" 
            className="text-black flex items-center rounded-md hover:bg-blue-100 py-4 px-2"
            onClick={handleHomeClick}
          >
            ControlRoom
          </Link>

          {/* Center section */}
          <div className="flex space-x-4">
            {user && (
              <>
                <Link
                  href="/diary"
                  className="text-gray-500 flex items-center rounded-md hover:bg-gray-100 hover:text-black py-4 px-2"
                >
                  Diary
                </Link>
                <Link
                  href="/finance"
                  className="text-gray-500 flex items-center rounded-md hover:bg-gray-100 hover:text-black py-4 px-2"
                >
                  Finance
                </Link>
                <Link
                  href="/notes"
                  className="text-gray-500 flex items-center rounded-md hover:bg-gray-100 hover:text-black py-4 px-2"
                >
                  Notes
                </Link>
              </>
            )}
          </div>

          {/* Right section */}
          <div className="flex space-x-4">
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="text-gray-500 flex items-center rounded-md hover:bg-gray-100 hover:text-black py-4 px-2"
                >
                  <span className="mr-2">👤</span>
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-500 flex items-center rounded-md hover:bg-red-100 hover:text-black py-4 px-2"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-500 flex items-center rounded-md hover:bg-green-100 hover:text-black py-4 px-2"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="text-gray-500 flex items-center rounded-md hover:bg-blue-100 hover:text-black py-4 px-2"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 