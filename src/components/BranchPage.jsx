
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import Modal from './Modal';
import axios from 'axios';
import { api } from '../config/api';


export default function BranchPage() {
  const { branchId } = useParams();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    date: '',
    customer: '',
    place: '',
    mobile: '',
    loan: '',
    interest: '',
    emi: ''
  });
  const [addOpen, setAddOpen] = useState(false);
  const [data, setData] = useState([]);
  // Fetch branch entries from backend on mount/branch change
  useEffect(() => {
    async function fetchEntries() {
      try {
        const res = await axios.get(api.get(`/api/branch-entries/${branchId}`));
        setData(res.data);
      } catch {
        setData([]);
      }
    }
    fetchEntries();
  }, [branchId]);
  const [editIdx, setEditIdx] = useState(null);
  const [error, setError] = useState('');

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!/^\d{10}$/.test(form.mobile)) {
      setError('Mobile No must be 10 digits');
      return;
    }
    setError('');
    const entryData = {
      branch: branchId,
      date: form.date,
      customer: form.customer,
      place: form.place,
      mobile: form.mobile,
      loan: Number(form.loan),
      interest: Number(form.interest),
      emi: Number(form.emi)
    };
    if (editIdx !== null) {
      // Update entry in backend
      const entryId = data[editIdx]._id;
      try {
        const res = await axios.put(api.put(`/api/branch-entries/${entryId}`), entryData);
        setData(data.map((row, i) => i === editIdx ? res.data : row));
        setEditIdx(null);
      } catch (err) {
        setError('Error updating entry');
        return;
      }
    } else {
      // Add entry to backend
      try {
        const res = await axios.post(api.post('/api/branch-entries'), entryData);
        setData([res.data, ...data]);
      } catch (err) {
        setError('Error adding entry');
        return;
      }
    }
    setForm({ date: '', customer: '', place: '', mobile: '', loan: '', interest: '', emi: '' });
    setAddOpen(false);
  }

  function handleEdit(idx) {
  setForm({ ...data[idx], date: data[idx].date ? data[idx].date.slice(0, 10) : '' });
  setEditIdx(idx);
  setAddOpen(true);
  }

  function handleDelete(idx) {
    const entryId = data[idx]._id;
    axios.delete(api.delete(`/api/branch-entries/${entryId}`))
      .then(() => {
        setData(data.filter((_, i) => i !== idx));
        if (editIdx === idx) setEditIdx(null);
      })
      .catch(() => {
        setError('Error deleting entry');
      });
  }

  return (
    <main className="flex-1 min-h-screen bg-gray-50 ml-56">
      {/* Header space */}
      <div className="h-16" />
      {/* Header bar */}
      <header className="fixed left-56 top-0 right-0 h-16 bg-white shadow flex items-center px-8 z-40">
        <div className="flex-1 flex items-center gap-4">
          <span className="text-xl font-bold capitalize">{branchId} Branch</span>
        </div>
        <form className="flex items-center bg-gray-100 rounded px-2 py-1 mr-4" onSubmit={e => e.preventDefault()} style={{ minWidth: 200 }}>
          <FaSearch className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent outline-none w-32"
          />
        </form>
        <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={() => {
              setForm({ date: '', customer: '', place: '', mobile: '', loan: '', interest: '', emi: '' });
              setEditIdx(null);
              setError('');
              setAddOpen(true);
            }}
          >
            New Entry
          </button>
      </header>
      {/* Main content below header */}
      <div className="p-6 pt-4">
        <Modal open={addOpen} onClose={() => { setAddOpen(false); setEditIdx(null); }}>
          <form className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col gap-6 max-w-5xl mx-auto border border-gray-200" onSubmit={handleSubmit}>
            <h2 className="text-2xl font-bold mb-2 text-center text-blue-700">{editIdx !== null ? 'Edit Entry' : 'New Entry'}</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-gray-700">Date</label>
                <input type="date" name="date" value={form.date} onChange={handleChange} className="border rounded-lg px-3 py-2 focus:outline-blue-400" required />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-gray-700">Customer Name</label>
                <input type="text" name="customer" value={form.customer} onChange={handleChange} placeholder="Customer Name" className="border rounded-lg px-3 py-2 focus:outline-blue-400" required />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-gray-700">Place</label>
                <input type="text" name="place" value={form.place} onChange={handleChange} placeholder="Place" className="border rounded-lg px-3 py-2 focus:outline-blue-400" required />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-gray-700">Mobile No</label>
                <input type="text" name="mobile" value={form.mobile} onChange={handleChange} placeholder="Mobile No" className="border rounded-lg px-3 py-2 focus:outline-blue-400" required maxLength={10} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-gray-700">Loan Amount</label>
                <input type="number" name="loan" value={form.loan} onChange={handleChange} placeholder="Loan Amount" className="border rounded-lg px-3 py-2 focus:outline-blue-400" required />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-gray-700">Interest Rate</label>
                <input type="number" name="interest" value={form.interest} onChange={handleChange} placeholder="Interest Rate" className="border rounded-lg px-3 py-2 focus:outline-blue-400" required />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-gray-700">EMI Rate</label>
                <input type="number" name="emi" value={form.emi} onChange={handleChange} placeholder="EMI Rate" className="border rounded-lg px-3 py-2 focus:outline-blue-400" required />
              </div>
            </div>
            <div className="flex gap-4 justify-center mt-4">
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 disabled:opacity-50">
                {editIdx !== null ? 'Update' : 'Add'}
              </button>
              <button type="button" className="bg-gray-300 text-black px-6 py-2 rounded-lg font-semibold shadow" onClick={() => { setAddOpen(false); setEditIdx(null); }}>
                Cancel
              </button>
            </div>
            {error && <div className="text-red-600 text-sm text-center mt-2">{error}</div>}
          </form>
        </Modal>
        <div className="bg-white rounded shadow p-4 overflow-x-auto mt-4">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Customer Name</th>
                <th className="px-4 py-2 text-left">Place</th>
                <th className="px-4 py-2 text-left">Mobile No</th>
                <th className="px-4 py-2 text-right">Loan Amt</th>
                <th className="px-4 py-2 text-right">Int Rate</th>
                <th className="px-4 py-2 text-right">EMI Rate</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-4">No data</td></tr>
              ) : data
                .filter(row =>
                  search === "" ||
                  Object.values(row).some(val =>
                    String(val).toLowerCase().includes(search.toLowerCase())
                  )
                )
                .map((row, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2">{row.date ? new Date(row.date).toLocaleDateString('en-GB') : ''}</td>
                  <td className="px-4 py-2">{row.customer}</td>
                  <td className="px-4 py-2">{row.place}</td>
                  <td className="px-4 py-2">{row.mobile}</td>
                  <td className="px-4 py-2 text-right">{row.loan}</td>
                  <td className="px-4 py-2 text-right">{row.interest}</td>
                  <td className="px-4 py-2 text-right">{row.emi}</td>
                  <td className="px-4 py-2 text-center">
                    <button className="text-blue-600 hover:underline mr-2" onClick={() => handleEdit(idx)}>Edit</button>
                    <button className="text-red-600 hover:underline" onClick={() => handleDelete(idx)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

