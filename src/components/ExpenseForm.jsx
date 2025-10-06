import React, { useState } from 'react';
import axios from 'axios';

export default function ExpenseForm({ categories, months, defaultCategory, defaultMonth, onAdded }) {
  const [form, setForm] = useState({
    category: defaultCategory,
    month: defaultMonth,
    amount: '',
    description: '',
    date: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/expenses', {
        ...form,
        amount: Number(form.amount),
        date: form.date || undefined
      });
      setForm({ ...form, amount: '', description: '', date: '' });
      onAdded();
    } catch (err) {
      setError(err.response?.data?.error || 'Error adding expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col gap-6 max-w-3xl mx-auto border border-gray-200" onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold mb-2 text-center text-blue-700">Add New Expense</h2>
      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-gray-700">Category</label>
          <select name="category" value={form.category} onChange={handleChange} className="border rounded-lg px-3 py-2 focus:outline-blue-400">
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-gray-700">Month</label>
          <select name="month" value={form.month} onChange={handleChange} className="border rounded-lg px-3 py-2 focus:outline-blue-400">
            {months.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-gray-700">Date</label>
          <input
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            className="border rounded-lg px-3 py-2 focus:outline-blue-400"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-gray-700">Amount</label>
          <input
            name="amount"
            type="number"
            placeholder="Amount"
            value={form.amount}
            onChange={handleChange}
            className="border rounded-lg px-3 py-2 focus:outline-blue-400"
            required
          />
        </div>
        <div className="flex flex-col gap-2 col-span-2">
          <label className="font-semibold text-gray-700">Description</label>
          <input
            name="description"
            type="text"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
            className="border rounded-lg px-3 py-2 focus:outline-blue-400"
          />
        </div>
      </div>
      {error && <div className="text-red-600 text-sm text-center mt-2">{error}</div>}
      <div className="flex gap-4 justify-center mt-4">
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Adding...' : 'Add'}
        </button>
      </div>
    </form>
  );
}
