'use client';

//import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMovieStats } from '@/hooks/useMovieStats';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useTvShowStats } from '@/hooks/useTvShowStats';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { totalCount, totalSize, isLoading: moviesLoading } = useMovieStats();
  const { totalShows, totalEpisodes, totalSize: tvShowTotalSize, isLoading: tvShowsLoading } = useTvShowStats();

  // Format current date
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Show loading state while authentication is being checked
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-right text-gray-600 mb-4">{currentDate}</div>
        <h1 className="text-3xl font-bold text-center mb-12">Welcome!</h1>
        <LoadingSpinner />
      </div>
    );
  }

  // Show login/register options if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-right text-gray-600 mb-4">{currentDate}</div>
        <h1 className="text-3xl font-bold text-center mb-12">Welcome!</h1>
        <div className="text-center mt-8">
          <p className="text-gray-600 mb-4">Please log in to access your personal dashboard.</p>
          <div className="space-x-4">
            <Link 
              href="/login" 
              className="inline-block bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600"
            >
              Login
            </Link>
            <Link 
              href="/register" 
              className="inline-block bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show authenticated content
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-right text-gray-600 mb-4">{currentDate}</div>
      <h1 className="text-3xl font-bold text-center mb-12">
        {user?.name ? `Welcome ${user.name}!` : 'Welcome!'}
      </h1>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Diary Card */}
        <Link href="/diary" className="block">
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">📔 Diary</h2>
            </div>
            <p className="text-gray-600">
              Record your thoughts, experiences, and daily reflections in your personal diary.
            </p>
          </div>
        </Link>

        {/* Finance Card */}
        <Link href="/finance" className="block">
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">💰 Finance</h2>
            </div>
            <p className="text-gray-600">
              Track your income, expenses, and manage your personal finances effectively.
            </p>
          </div>
        </Link>

        {/* Notes Card */}
        <Link href="/notes" className="block">
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">📝 Notes</h2>
            </div>
            <p className="text-gray-600">
              Keep track of your therapy session notes and important thoughts.
            </p>
          </div>
        </Link>

        {/* Movies Card */}
        <Link href="/media/movie" className="block">
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">🎥 Movies</h2>
            </div>
            <p className="text-gray-600 mb-3">
              Explore and manage your collection of movies.
            </p>
            {!moviesLoading && (
              <div className="text-sm text-gray-500 flex gap-3">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h18M3 16h18" />
                  </svg>
                  {totalCount} movies
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  {totalSize}
                </span>
              </div>
            )}
          </div>
        </Link>

        {/* TV Shows Card */}
        <Link href="/media/tv" className="block">
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">📺 TV Shows</h2>
            </div>
            <p className="text-gray-600 mb-3">
              Explore and manage your collection of TV shows.
            </p>
            {!tvShowsLoading && (
              <div className="text-sm text-gray-500 flex gap-3">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {totalShows} shows
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h18M3 16h18" />
                  </svg>
                  {totalEpisodes} episodes
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  {tvShowTotalSize}
                </span>
              </div>
            )}
          </div>
        </Link>
      </div>
    </div>
  );
}
