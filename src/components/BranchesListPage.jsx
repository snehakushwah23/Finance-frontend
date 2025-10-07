import React, { useState } from 'react';
import axios from 'axios';
import Modal from './Modal';

function BranchesListPage({ branches, setBranches }) {
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
    <main className="flex-1 min-h-screen bg-gray-50 ml-56">
      <div className="h-16" />
      <header className="fixed left-56 top-0 right-0 h-16 bg-white shadow flex items-center px-8 z-40">
        <span className="text-xl font-bold">Branches</span>
        <button
          className="ml-auto bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => setAddOpen(true)}
        >
          Add New Branch
        </button>
      </header>
      <div className="p-6 pt-4">
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
        <div className="bg-white rounded shadow p-4 mt-4">
          <h2 className="text-lg font-bold mb-4">All Branches</h2>
          <ul className="space-y-2">
            {branches.map(branch => (
              <li key={branch} className="flex items-center justify-between px-4 py-2 border-b last:border-b-0">
                <a
                  href={`/branches/${branch.toLowerCase()}`}
                  className="capitalize font-semibold text-blue-600 hover:underline"
                >
                  {branch}
                </a>
                <div className="flex gap-2">
                  <button className="text-yellow-600 hover:underline" onClick={() => openEdit(branch)}>Edit</button>
                  <button className="text-red-600 hover:underline" onClick={() => handleDeleteBranch(branch)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
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
        </div>
      </div>
    </main>
  );
}

export default BranchesListPage;
