'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface UserData {
  username: string;
  name?: string;
  surname?: string;
  birthday?: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        router.push('/login');
        return;
      }
      const data = await response.json();
      setUserData(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setMessage('Profile updated successfully!');
        fetchUserData();
      } else {
        setMessage(`Failed to update profile: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      setMessage('An error occurred while updating the profile');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('New passwords do not match');
      return;
    }

    try {
      const response = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Password updated successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        setMessage(result.error || 'Failed to update password');
      }
    } catch (error) {
      setMessage('An error occurred while updating the password');
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      const response = await fetch('/api/auth/me', {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/login');
        router.refresh();
      } else {
        const data = await response.json();
        setMessage(data.error || 'Failed to delete account');
      }
    } catch (error) {
      setMessage('An error occurred while deleting your account');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>
      {message && (
        <div className="mb-4 p-2 bg-blue-100 text-blue-700 rounded">
          {message}
        </div>
      )}

      {/* Profile Information Form */}
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
        <div>
          <label className="block text-sm font-medium mb-1">Username</label>
          <input
            type="text"
            value={userData?.username || ''}
            disabled
            className="w-full p-2 border rounded bg-gray-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={userData?.name || ''}
            onChange={(e) => setUserData({ ...userData!, name: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Surname</label>
          <input
            type="text"
            value={userData?.surname || ''}
            onChange={(e) => setUserData({ ...userData!, surname: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Birthday</label>
          <input
            type="date"
            value={userData?.birthday?.split('T')[0] || ''}
            onChange={(e) => setUserData({ ...userData!, birthday: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Save Changes
        </button>
      </form>

      {/* Password Change Form */}
      <form onSubmit={handlePasswordChange} className="space-y-4 mb-8 pt-6 border-t">
        <h2 className="text-xl font-semibold mb-4">Change Password</h2>
        <div>
          <label className="block text-sm font-medium mb-1">Current Password</label>
          <input
            type="password"
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">New Password</label>
          <input
            type="password"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Confirm New Password</label>
          <input
            type="password"
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
        >
          Update Password
        </button>
      </form>

      {/* Delete Account Section */}
      <div className="mt-8 pt-6 border-t">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Danger Zone</h2>
        <p className="text-sm text-gray-600 mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button
          onClick={handleDeleteAccount}
          className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600"
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}
