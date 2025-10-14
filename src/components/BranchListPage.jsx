import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { api } from '../config/api';
import Modal from './Modal';

export default function BranchListPage() {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newBranch, setNewBranch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      setLoading(true);
      const response = await axios.get(api.get('/api/branches'));
      setBranches(response.data.map(b => b.name));
    } catch (error) {
      console.error('Error loading branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBranchClick = (branch) => {
    navigate('/branch-login', { state: { selectedBranch: branch } });
  };

  const handleAddBranch = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!newBranch.trim()) {
      setError('Branch name is required');
      return;
    }
    
    if (branches.includes(newBranch.trim())) {
      setError('Branch already exists');
      return;
    }

    try {
      setLoading(true);
      await axios.post(api.post('/api/branches'), { name: newBranch.trim() });
      await loadBranches();
      setAddModalOpen(false);
      setNewBranch('');
      alert('Branch added successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Error adding branch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-8 ml-56">
      <div className="bg-white rounded-2xl shadow p-6 mb-6 border border-gray-200">
        <div className="mb-6 flex justify-between items-center">
          <div></div>
          <button
            onClick={() => setAddModalOpen(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Branch
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading branches...</p>
          </div>
        ) : branches.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-20 h-20 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No branches found</h3>
            <p className="mt-2 text-gray-500">Add branches from the Branches section to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {branches.map((branch) => (
              <div
                key={branch}
                onClick={() => handleBranchClick(branch)}
                className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-blue-400 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-200 rounded-full -mr-12 -mt-12 opacity-20 group-hover:opacity-40 transition-opacity"></div>
                
                <div className="relative p-6">
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-800 text-center mb-2 capitalize group-hover:text-blue-600 transition-colors">
                    {branch}
                  </h3>
                  
                  <div className="flex items-center justify-center text-sm text-gray-600 mb-4">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Branch Office
                  </div>

                  <button 
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all transform group-hover:scale-105 flex items-center justify-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBranchClick(branch);
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Login to Branch
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      

      {/* Add Branch Modal */}
      <Modal open={addModalOpen} onClose={() => { setAddModalOpen(false); setNewBranch(''); setError(''); }}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 mx-auto" style={{ width: '500px', maxWidth: '90vw' }}>
          <h2 className="text-xl font-bold mb-4 text-green-700">Add New Branch</h2>
          <form onSubmit={handleAddBranch}>
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2 text-gray-700">Branch Name *</label>
              <input
                type="text"
                className="border rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-green-400"
                value={newBranch}
                onChange={(e) => setNewBranch(e.target.value)}
                placeholder="Enter branch name"
                required
              />
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold flex-1 hover:bg-green-700 transition-colors"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Branch'}
              </button>
              <button
                type="button"
                className="bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold flex-1 hover:bg-gray-500 transition-colors"
                onClick={() => { setAddModalOpen(false); setNewBranch(''); setError(''); }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}

