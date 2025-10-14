import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { api } from '../config/api';

export default function BranchLogin({ onBranchLogin }) {
  const location = useLocation();
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Load branches on component mount
  useEffect(() => {
    loadBranches();
    
    // Pre-select branch if passed from sidebar
    if (location.state?.selectedBranch) {
      const branch = location.state.selectedBranch;
      setSelectedBranch(branch);
      setUsername(branch.toLowerCase());
    }
  }, [location.state]);

  const loadBranches = async () => {
    try {
      const response = await axios.get(api.get('/api/branches'));
      setBranches(response.data.map(b => b.name));
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  };

  // Branch-specific login credentials
  // Format: branch_username / branch_password
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate login delay
    setTimeout(() => {
      if (!selectedBranch) {
        setError('Please select a branch');
        setLoading(false);
        return;
      }

      // Simple validation: username should match branch name and password should be "123"
      // You can customize this logic as needed
      const branchLowerCase = selectedBranch.toLowerCase();
      if (username === branchLowerCase && password === '123') {
        // Store branch login state in localStorage
        localStorage.setItem('branchLoggedIn', 'true');
        localStorage.setItem('branchName', selectedBranch);
        localStorage.setItem('branchLoginTime', new Date().toISOString());
        
        if (onBranchLogin) {
          onBranchLogin(selectedBranch);
        }
        
        // Navigate to branch-specific dashboard
        navigate(`/branch-dashboard/${selectedBranch.toLowerCase()}`);
      } else {
        setError('Invalid credentials. Use branch name as username and "123" as password');
      }
      setLoading(false);
    }, 500);
  };

  const handleLogout = () => {
    localStorage.removeItem('branchLoggedIn');
    localStorage.removeItem('branchName');
    localStorage.removeItem('branchLoginTime');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Finance Manager</h1>
          <p className="text-gray-600 mt-2">Sign in to your branch</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Branch
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent capitalize"
              required
            >
              <option value="">Choose a branch</option>
              {branches.map(branch => (
                <option key={branch} value={branch} className="capitalize">
                  {branch}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            ← Back to Admin Login
          </button>
        </div>
      </div>
    </div>
  );
}

