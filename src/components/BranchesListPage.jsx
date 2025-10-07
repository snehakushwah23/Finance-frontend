import React, { useState } from 'react';
import axios from 'axios';
import Modal from './Modal';
import { useNavigate } from 'react-router-dom';

function BranchesListPage({ branches, setBranches }) {
  const navigate = useNavigate();
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editBranch, setEditBranch] = useState(null);
  const [editName, setEditName] = useState('');
  const [newBranch, setNewBranch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAddBranch(e) {
    e.preventDefault();
    if (!newBranch.trim()) {
      setError('Branch name required');
      return;xxx
    }
    if (branches.includes(newBranch.trim())) {
      setError('Branch already exists');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('/api/branches', { name: newBranch.trim() });
      setBranches([...branches, res.data.name]);
      setNewBranch('');
      setError('');
      setAddOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Error adding branch');
    } finally {
      setLoading(false);
    }
  }

  function openEdit(branch) {
    setEditBranch(branch);
    setEditName(branch);
    setEditOpen(true);
    setError('');
  }

  async function handleEditBranch(e) {
    e.preventDefault();
    if (!editName.trim()) {
      setError('Branch name required');
      return;
    }
    if (branches.includes(editName.trim()) && editName.trim() !== editBranch) {
      setError('Branch already exists');
      return;
    }
    setLoading(true);
    try {
      // Get branch id from backend
      const resList = await axios.get('/api/branches');
      const branchObj = resList.data.find(b => b.name === editBranch);
      if (!branchObj) throw new Error('Branch not found');
      const res = await axios.put(`/api/branches/${branchObj._id}`, { name: editName.trim() });
      setBranches(branches.map(b => (b === editBranch ? res.data.name : b)));
      setEditOpen(false);
      setEditBranch(null);
      setEditName('');
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Error editing branch');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteBranch(branch) {
    if (!window.confirm('Delete this branch?')) return;
    setLoading(true);
    try {
      // Get branch id from backend
      const resList = await axios.get('/api/branches');
      const branchObj = resList.data.find(b => b.name === branch);
      if (!branchObj) throw new Error('Branch not found');
      await axios.delete(`/api/branches/${branchObj._id}`);
      setBranches(branches.filter(b => b !== branch));
    } catch (err) {
      alert(err.response?.data?.error || 'Error deleting branch');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 p-8 ml-56">
      <div className="bg-white rounded-2xl shadow p-6 mb-6 border border-gray-200">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Branch Manager</h1>
        </div>
        <div className="mt-4 flex items-center gap-3 max-w-3xl">
          <input
            className="border rounded-lg px-3 py-2 flex-1"
            placeholder="New branch name"
            value={newBranch}
            onChange={e => setNewBranch(e.target.value)}
          />
        <button
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-green-700"
          onClick={() => setAddOpen(true)}
        >
            Add Branch
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map(branch => (
          <div key={branch} className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-900 font-semibold text-lg">{branch}</div>
                <button className="text-sm text-blue-600 mt-1" onClick={() => navigate(`/branches/${branch.toLowerCase()}`)}>View entries</button>
              </div>
              <div className="flex items-center gap-3">
                <button title="View" onClick={() => navigate(`/branches/${branch.toLowerCase()}`)}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                </button>
                <button title="Edit" onClick={() => openEdit(branch)}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0l-9.5 9.5A2 2 0 004 14.5V17a1 1 0 001 1h2.5a2 2 0 001.414-.586l9.5-9.5a2 2 0 000-2.828l-2-2zM5 16v-1.5a.5.5 0 01.146-.354l9.5-9.5a.5.5 0 01.708.708l-9.5 9.5A.5.5 0 015 16z" /></svg>
                </button>
                <button title="Delete" onClick={() => handleDeleteBranch(branch)}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8zM4 6a1 1 0 011-1h10a1 1 0 011 1v1H4V6zm2-3a1 1 0 011-1h6a1 1 0 011 1v1H6V3zm9 2V6a2 2 0 01-2 2v7a2 2 0 01-2 2H7a2 2 0 01-2-2V8a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2z" clipRule="evenodd" /></svg>
        </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Branch Modal */}
        <Modal open={addOpen} onClose={() => { setAddOpen(false); setError(''); }}>
          <form className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col gap-6 max-w-xl mx-auto border border-gray-200" onSubmit={handleAddBranch}>
            <h2 className="text-2xl font-bold mb-2 text-center text-blue-700">Add New Branch</h2>
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-gray-700">Branch Name</label>
              <input
                type="text"
                placeholder="Enter branch name"
                value={newBranch}
                onChange={e => setNewBranch(e.target.value)}
                className="border rounded-lg px-3 py-2 focus:outline-blue-400"
                required
              />
            </div>
            {error && <div className="text-red-600 text-sm text-center mt-2">{error}</div>}
            <div className="flex gap-4 justify-center mt-4">
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 disabled:opacity-50" disabled={loading}>{loading ? 'Adding...' : 'Add'}</button>
              <button type="button" className="bg-gray-300 text-black px-6 py-2 rounded-lg font-semibold shadow" onClick={() => setAddOpen(false)}>Cancel</button>
            </div>
          </form>
        </Modal>

      {/* Edit Branch Modal */}
          <Modal open={editOpen} onClose={() => setEditOpen(false)}>
            <form className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col gap-6 max-w-xl mx-auto border border-gray-200" onSubmit={handleEditBranch}>
              <h2 className="text-2xl font-bold mb-2 text-center text-yellow-700">Edit Branch</h2>
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-gray-700">Branch Name</label>
                <input
                  type="text"
                  placeholder="Branch Name"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="border rounded-lg px-3 py-2 focus:outline-yellow-400"
                  required
                />
              </div>
              {error && <div className="text-red-600 text-sm text-center mt-2">{error}</div>}
              <div className="flex gap-4 justify-center mt-4">
                <button type="submit" className="bg-yellow-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-yellow-700 disabled:opacity-50" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
                <button type="button" className="bg-gray-300 text-black px-6 py-2 rounded-lg font-semibold shadow" onClick={() => setEditOpen(false)}>Cancel</button>
              </div>
            </form>
          </Modal>
    </main>
  );
}

export default BranchesListPage;
