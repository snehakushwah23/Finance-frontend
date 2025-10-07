import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { api } from '../config/api';
import Modal from './Modal';

export default function LoansToCustomerPage({ branches = [] }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerPayments, setCustomerPayments] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [allCustomers, setAllCustomers] = useState([]);
  const [form, setForm] = useState({
    date: '',
    customer: '',
    place: '',
    mobile: '',
    loan: '',
    interest: '',
    emi: ''
  });
  const [paymentForm, setPaymentForm] = useState({
    branch: '',
    customer: '',
    date: '',
    amount: ''
  });

  useEffect(() => {
    if (branches && branches.length && !selectedBranch) {
      setSelectedBranch(branches[0]);
    }
  }, [branches]);

  useEffect(() => {
    const load = async () => {
      if (!selectedBranch) return;
      setLoading(true);
      try {
        const res = await axios.get(`/api/branch-entries/${selectedBranch.toLowerCase()}`);
        setEntries(res.data || []);
        // Extract unique customers from loan entries (not payments)
        const customers = [...new Set(
          (res.data || [])
            .filter(entry => entry.place !== 'Payment')
            .map(entry => entry.customer)
        )];
        setAllCustomers(customers);
      } catch (e) {
        setEntries([]);
        setAllCustomers([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedBranch]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!selectedBranch) {
      alert('Please select a branch');
      return;
    }
    if (!/^\d{10}$/.test(form.mobile)) {
      alert('Mobile No must be 10 digits');
      return;
    }
    try {
      const payload = { ...form, branch: selectedBranch.toLowerCase() };
      await axios.post(api.post('/api/branch-entries'), payload);
      setAddOpen(false);
      setForm({ date: '', customer: '', place: '', mobile: '', loan: '', interest: '', emi: '' });
      // Reload list
      const res = await axios.get(`/api/branch-entries/${selectedBranch.toLowerCase()}`);
      setEntries(res.data || []);
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to add entry');
    }
  }

  async function handleEdit(e) {
    e.preventDefault();
    if (!selectedBranch) {
      alert('Please select a branch');
      return;
    }
    if (!/^\d{10}$/.test(form.mobile)) {
      alert('Mobile No must be 10 digits');
      return;
    }
    try {
      const payload = { ...form, branch: selectedBranch.toLowerCase() };
      await axios.put(`/api/branch-entries/${editingEntry._id}`, payload);
      setEditOpen(false);
      setEditingEntry(null);
      setForm({ date: '', customer: '', place: '', mobile: '', loan: '', interest: '', emi: '' });
      // Reload list
      const res = await axios.get(`/api/branch-entries/${selectedBranch.toLowerCase()}`);
      setEntries(res.data || []);
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to update entry');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this entry?')) {
      return;
    }
    try {
      await axios.delete(`/api/branch-entries/${id}`);
      // Reload list
      const res = await axios.get(`/api/branch-entries/${selectedBranch.toLowerCase()}`);
      setEntries(res.data || []);
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to delete entry');
    }
  }

  function openEditModal(entry) {
    setEditingEntry(entry);
    setForm({
      date: entry.date ? new Date(entry.date).toISOString().split('T')[0] : '',
      customer: entry.customer || '',
      place: entry.place || '',
      mobile: entry.mobile || '',
      loan: entry.loan || '',
      interest: entry.interest || '',
      emi: entry.emi || ''
    });
    setEditOpen(true);
  }

  function openAddAnotherLoanModal(entry) {
    // Pre-fill customer data for new loan
    setForm({
      date: new Date().toISOString().split('T')[0], // Today's date
      customer: entry.customer || '',
      place: entry.place || '',
      mobile: entry.mobile || '',
      loan: '',
      interest: '',
      emi: ''
    });
    setAddOpen(true);
  }

  async function handlePayment(e) {
    e.preventDefault();
    if (!paymentForm.branch || !paymentForm.customer || !paymentForm.date || !paymentForm.amount) {
      alert('Please fill in all fields');
      return;
    }
    try {
      const payload = { 
        branch: paymentForm.branch.toLowerCase(),
        customer: paymentForm.customer,
        place: 'Payment',
        mobile: '0000000000', // Dummy mobile for payments
        loan: paymentForm.amount,
        interest: '0',
        emi: '0',
        date: paymentForm.date
      };
      await axios.post(api.post('/api/branch-entries'), payload);
      setPaymentOpen(false);
      setPaymentForm({ branch: '', customer: '', date: '', amount: '' });
      alert('Payment recorded successfully');
      // Reload entries if current branch matches
      if (selectedBranch.toLowerCase() === paymentForm.branch.toLowerCase()) {
        const res = await axios.get(`/api/branch-entries/${selectedBranch.toLowerCase()}`);
        setEntries(res.data || []);
      }
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to record payment');
    }
  }

  async function loadCustomerPayments(customer, branch) {
    try {
      const res = await axios.get(`/api/branch-entries/${branch.toLowerCase()}`);
      // Filter payment entries for this customer
      const payments = (res.data || []).filter(entry => 
        entry.customer === customer && 
        entry.place === 'Payment'
      );
      setCustomerPayments(payments);
      console.log('Customer payments loaded:', payments); // Debug log
    } catch (e) {
      console.error('Error loading payments:', e);
      setCustomerPayments([]);
    }
  }

  function openCustomerDetails(entry) {
    setSelectedCustomer(entry);
    loadCustomerPayments(entry.customer, selectedBranch);
    setDetailsOpen(true);
  }

  function closeModals() {
    setAddOpen(false);
    setEditOpen(false);
    setPaymentOpen(false);
    setDetailsOpen(false);
    setEditingEntry(null);
    setSelectedCustomer(null);
    setForm({ date: '', customer: '', place: '', mobile: '', loan: '', interest: '', emi: '' });
    setPaymentForm({ branch: selectedBranch, customer: '', date: '', amount: '' });
  }

  return (
    <div className="flex-1 p-8 ml-56">
      <div className="bg-white rounded-2xl shadow p-6 mb-6 border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Loan to Customer</h1>
          <div className="flex gap-3">
            <select
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
            >
              {branches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <button className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-green-700" onClick={() => setAddOpen(true)} disabled={!selectedBranch}>Add Loan</button>
            <button className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-purple-700" onClick={() => {
              setPaymentForm({ branch: selectedBranch, customer: '', date: '', amount: '' });
              setPaymentOpen(true);
            }} disabled={!selectedBranch}>Make Payment</button>
          </div>
        </div>

        {/* Content based on loading and data */}
        {loading && entries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No loans found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-blue-50">
                <tr>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Customer</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Place</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Mobile</th>
                  <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-700">Loan (₹)</th>
                  <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-700">Interest (₹)</th>
                  <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-700">EMI (₹)</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
            <tbody>
              {entries.filter(entry => entry.place !== 'Payment').map((l, index) => {
                // Get all loans for this customer sorted by date
                const customerLoans = entries
                  .filter(entry => entry.place !== 'Payment' && entry.customer === l.customer)
                  .sort((a, b) => new Date(a.date) - new Date(b.date));
                
                // Find the sequence number of this loan
                const loanSequence = customerLoans.findIndex(loan => loan._id === l._id) + 1;
                const isMultipleLoans = customerLoans.length > 1;
                
                return (
                  <tr key={l._id} className={`hover:bg-gray-50 ${isMultipleLoans ? 'bg-blue-50' : ''}`}>
                    <td className="border border-gray-300 px-4 py-3">{l.date ? new Date(l.date).toLocaleDateString() : ''}</td>
                    <td className="border border-gray-300 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span>{l.customer}</span>
                        {isMultipleLoans && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                            {loanSequence === 1 ? '1st' : loanSequence === 2 ? '2nd' : loanSequence === 3 ? '3rd' : `${loanSequence}th`} loan
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-3">{l.place}</td>
                    <td className="border border-gray-300 px-4 py-3">{l.mobile}</td>
                    <td className="border border-gray-300 px-4 py-3 text-right font-medium">₹{Number(l.loan).toLocaleString()}</td>
                    <td className="border border-gray-300 px-4 py-3 text-right font-medium">₹{Number(l.interest).toLocaleString()}</td>
                    <td className="border border-gray-300 px-4 py-3 text-right font-medium">₹{Number(l.emi).toLocaleString()}</td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                        onClick={() => openCustomerDetails(l)}
                        title="View payment details"
                      >
                        <svg 
                          className="w-4 h-4 text-gray-600 hover:text-gray-800" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                          />
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" 
                          />
                        </svg>
                      </button>
                      <button
                        className="p-1 hover:bg-green-200 rounded-full transition-colors"
                        onClick={() => openAddAnotherLoanModal(l)}
                        title="Add another loan for this customer"
                      >
                        <svg 
                          className="w-4 h-4 text-green-600 hover:text-green-800" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
                          />
                        </svg>
                      </button>
                      <button
                        className="p-1 hover:bg-blue-200 rounded-full transition-colors"
                        onClick={() => openEditModal(l)}
                        title="Edit loan"
                      >
                        <svg 
                          className="w-4 h-4 text-blue-600 hover:text-blue-800" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
                          />
                        </svg>
                      </button>
                      <button
                        className="p-1 hover:bg-red-200 rounded-full transition-colors"
                        onClick={() => handleDelete(l._id)}
                        title="Delete loan"
                      >
                        <svg 
                          className="w-4 h-4 text-red-600 hover:text-red-800" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                          />
                        </svg>
                      </button>
                    </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Loan Modal */}
      <Modal open={addOpen} onClose={closeModals}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 mx-auto" style={{ width: '600px', maxWidth: '90vw' }}>
          <h2 className="text-xl font-bold mb-4 text-blue-700">Add Loan</h2>
          <form onSubmit={handleAdd}>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Branch</label>
                <select
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={selectedBranch}
                  onChange={e => setSelectedBranch(e.target.value)}
                  required
                >
                  <option value="" disabled>Select Branch</option>
                  {branches.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Date</label>
                <input type="date" className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Customer Name</label>
                <input type="text" className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Place</label>
                <input type="text" className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.place} onChange={e => setForm({ ...form, place: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Mobile</label>
                <input type="tel" className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Loan (₹)</label>
                <input type="number" className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.loan} onChange={e => setForm({ ...form, loan: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Interest (₹)</label>
                <input type="number" className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.interest} onChange={e => setForm({ ...form, interest: e.target.value })} required />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">EMI (₹)</label>
                <input type="number" className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.emi} onChange={e => setForm({ ...form, emi: e.target.value })} required />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold flex-1 hover:bg-green-700 transition-colors"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Loan'}
              </button>
              <button
                type="button"
                className="bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold flex-1 hover:bg-gray-500 transition-colors"
                onClick={closeModals}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Edit Loan Modal */}
      <Modal open={editOpen} onClose={closeModals}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 mx-auto" style={{ width: '600px', maxWidth: '90vw' }}>
          <h2 className="text-xl font-bold mb-4 text-blue-700">Edit Loan</h2>
          <form onSubmit={handleEdit}>
            <div className="grid grid-cols-2 gap-4">
              <div className="">
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Branch</label>
                <select
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={selectedBranch}
                  onChange={e => setSelectedBranch(e.target.value)}
                  required
                >
                  <option value="" disabled>Select Branch</option>
                  {branches.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Date</label>
                <input type="date" className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Customer Name</label>
                <input type="text" className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Place</label>
                <input type="text" className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.place} onChange={e => setForm({ ...form, place: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Mobile</label>
                <input type="tel" className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Loan (₹)</label>
                <input type="number" className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.loan} onChange={e => setForm({ ...form, loan: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Interest (₹)</label>
                <input type="number" className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.interest} onChange={e => setForm({ ...form, interest: e.target.value })} required />
              </div>
              <div className="">
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">EMI (₹)</label>
                <input type="number" className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.emi} onChange={e => setForm({ ...form, emi: e.target.value })} required />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold flex-1 hover:bg-blue-700 transition-colors"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Loan'}
              </button>
              <button
                type="button"
                className="bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold flex-1 hover:bg-gray-500 transition-colors"
                onClick={closeModals}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Make Payment Modal */}
      <Modal open={paymentOpen} onClose={closeModals}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 mx-auto" style={{ width: '600px', maxWidth: '90vw' }}>
          <h2 className="text-xl font-bold mb-4 text-blue-700">Make Payment</h2>
          <form onSubmit={handlePayment}>
            <div className="grid grid-cols-2 gap-4">
              <div className="">
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Branch</label>
                <select
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={paymentForm.branch}
                  onChange={e => setPaymentForm({ ...paymentForm, branch: e.target.value })}
                  required
                >
                  <option value="" disabled>Select Branch</option>
                  {branches.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div className="">
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Customer</label>
                <select
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={paymentForm.customer}
                  onChange={e => setPaymentForm({ ...paymentForm, customer: e.target.value })}
                  required
                >
                  <option value="" disabled>Select Customer</option>
                  {allCustomers.map(customer => (
                    <option key={customer} value={customer}>{customer}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Payment Date</label>
                <input
                  type="date"
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={paymentForm.date}
                  onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Amount (₹)</label>
                <input
                  type="number"
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  placeholder="Enter amount"
                  required
                />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                type="submit"
                className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold flex-1 hover:bg-purple-700 transition-colors"
                disabled={loading}
              >
                {loading ? 'Recording...' : 'Record Payment'}
              </button>
              <button
                type="button"
                className="bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold flex-1 hover:bg-gray-500 transition-colors"
                onClick={closeModals}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Customer Details Modal */}
      <Modal open={detailsOpen} onClose={closeModals}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 mx-auto" style={{ width: '900px', maxWidth: '90vw' }}>
          <h2 className="text-xl font-bold mb-4 text-blue-700">
            Customer Profile - {selectedCustomer?.customer}
          </h2>
          <p className="text-gray-600 mb-4">
            Branch: {selectedBranch} | Mobile: {selectedCustomer?.mobile}
          </p>
          
          {/* Customer Loan Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Loan Information</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Loan #</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Place</th>
                    <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-700">Loan Amount (₹)</th>
                    <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-700">Interest (₹)</th>
                    <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-700">EMI (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {entries
                    .filter(entry => entry.place !== 'Payment' && entry.customer === selectedCustomer?.customer)
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map((loan, index) => (
                      <tr key={loan._id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-3">
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                            {index + 1 === 1 ? '1st' : index + 1 === 2 ? '2nd' : index + 1 === 3 ? '3rd' : `${index + 1}th`} loan
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-3">{loan.date ? new Date(loan.date).toLocaleDateString() : ''}</td>
                        <td className="border border-gray-300 px-4 py-3">{loan.place}</td>
                        <td className="border border-gray-300 px-4 py-3 text-right font-medium">₹{Number(loan.loan).toLocaleString()}</td>
                        <td className="border border-gray-300 px-4 py-3 text-right font-medium">₹{Number(loan.interest).toLocaleString()}</td>
                        <td className="border border-gray-300 px-4 py-3 text-right font-medium">₹{Number(loan.emi).toLocaleString()}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Payment History */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Payment History</h3>
            
            {customerPayments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No payments found for this customer</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Payment Date</th>
                      <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-700">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerPayments.map((payment, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-3">
                          {new Date(payment.date).toLocaleDateString()}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-right font-medium">
                          ₹{Number(payment.loan).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-green-50">
                    <tr>
                      <td className="border border-gray-300 px-4 py-3 font-bold text-gray-700">
                        Total Paid:
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-right font-bold text-green-600">
                        ₹{customerPayments.reduce((sum, payment) => sum + Number(payment.loan), 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              className="bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
              onClick={closeModals}
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}


