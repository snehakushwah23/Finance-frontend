import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { api } from '../config/api';
import Modal from './Modal';

function BranchesListPage({ branches, setBranches }) {
  const location = useLocation();
  const [editOpen, setEditOpen] = useState(false);
  const [editBranch, setEditBranch] = useState(null);
  const [editName, setEditName] = useState('');
  const [newBranch, setNewBranch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [branchModal, setBranchModal] = useState(null);
  const [branchData, setBranchData] = useState([]);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    branch: '',
    customer: '',
    date: '',
    amount: ''
  });
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerPayments, setCustomerPayments] = useState([]);

  function openEdit(branch) {
    setEditBranch(branch);
    setEditName(branch);
    setEditOpen(true);
    setError('');
  }

  async function openBranchModal(branch) {
    setBranchModal(branch);
    try {
      const res = await axios.get(api.get(`/api/branch-entries/${branch.toLowerCase()}`));
      // Show only loan entries, filter out payments
      const loanEntries = (res.data || []).filter(entry => entry.place !== 'Payment');
      setBranchData(loanEntries);
    } catch (err) {
      console.error('Error loading branch data:', err);
      setBranchData([]);
    }
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
        mobile: '0000000000',
        loan: paymentForm.amount,
        interest: '0',
        emi: '0',
        date: paymentForm.date
      };
      await axios.post(api.post('/api/branch-entries'), payload);
      setPaymentOpen(false);
      setPaymentForm({ branch: '', customer: '', date: '', amount: '' });
      alert('Payment recorded successfully');
      // Reload data for the selected branch if modal is open
      if (branchModal) {
        const res = await axios.get(api.get(`/api/branch-entries/${branchModal.toLowerCase()}`));
        const loanEntries = (res.data || []).filter(entry => entry.place !== 'Payment');
        setBranchData(loanEntries);
      }
      // Also reload the main branch data
      const res = await axios.get(api.get('/api/branches'));
      setBranches(res.data.map(b => b.name));
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to record payment');
    }
  }



  async function loadCustomerPayments(customer, branch) {
    try {
      const res = await axios.get(api.get(`/api/branch-entries/${branch.toLowerCase()}`));
      // Load ONLY payment entries for this customer
      const paymentEntries = (res.data || []).filter(entry => 
        entry.customer === customer && entry.place === 'Payment'
      );
      setCustomerPayments(paymentEntries);
    } catch (e) {
      console.error('Error loading customer data:', e);
      setCustomerPayments([]);
    }
  }

  function openCustomerDetails(entry) {
    setSelectedCustomer(entry);
    loadCustomerPayments(entry.customer, branchModal);
    setDetailsOpen(true);
  }

  function closeModals() {
    setPaymentOpen(false);
    setDetailsOpen(false);
    setSelectedCustomer(null);
    setPaymentForm({ branch: '', customer: '', date: '', amount: '' });
  }

  async function handleDeleteEntry(id) {
    if (!window.confirm('Delete this entry?')) return;
    try {
      await axios.delete(api.delete(`/api/branch-entries/${id}`));
      // Reload data and filter out payments
      const res = await axios.get(api.get(`/api/branch-entries/${branchModal.toLowerCase()}`));
      const loanEntries = (res.data || []).filter(entry => entry.place !== 'Payment');
      setBranchData(loanEntries);
    } catch (err) {
      alert(err.response?.data?.error || 'Error deleting entry');
    }
  }

  // Auto-open branch modal if coming from search
  useEffect(() => {
    if (location.state?.openBranch) {
      openBranchModal(location.state.openBranch);
      // Clear the state to prevent reopening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

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
      const resList = await axios.get(api.get('/api/branches'));
      const branchObj = resList.data.find(b => b.name === editBranch);
      if (!branchObj) throw new Error('Branch not found');
      const res = await axios.put(api.put(`/api/branches/${branchObj._id}`), { name: editName.trim() });
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
      const resList = await axios.get(api.get('/api/branches'));
      const branchObj = resList.data.find(b => b.name === branch);
      if (!branchObj) throw new Error('Branch not found');
      await axios.delete(api.delete(`/api/branches/${branchObj._id}`));
      setBranches(branches.filter(b => b !== branch));
    } catch (err) {
      alert(err.response?.data?.error || 'Error deleting branch');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 p-8 ml-56">
      <div className="bg-white rounded-2xl shadow p-6 mb-6 border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Branch Manager</h1>
        
        <div className="flex gap-4 mb-6 items-center">
          <input
            className="border rounded-lg px-3 py-2 flex-1"
            placeholder="New branch name"
            value={newBranch}
            onChange={e => setNewBranch(e.target.value)}
          />
          <button
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-green-700"
            onClick={(e) => {
              e.preventDefault();
              if (!newBranch.trim()) {
                alert('Branch name required');
                return;
              }
              if (branches.includes(newBranch.trim())) {
                alert('Branch already exists');
                return;
              }
              setLoading(true);
              axios.post(api.post('/api/branches'), { name: newBranch.trim() })
                .then(res => {
                  setBranches([...branches, res.data.name]);
                  setNewBranch('');
                })
                .catch(err => alert(err.response?.data?.error || 'Error adding branch'))
                .finally(() => setLoading(false));
            }}
          >
            Add Branch
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map(branch => (
            <div key={branch} className="bg-gray-50 rounded-lg shadow p-4 flex items-center justify-between border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-1 text-gray-800 capitalize">{branch}</h2>
                <div className="text-gray-500 text-sm">View entries</div>
              </div>
              <div className="flex gap-2">
                <button
                  title="View"
                  className="p-2 hover:bg-gray-200 rounded"
                  onClick={() => openBranchModal(branch)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 hover:text-gray-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <button 
                  title="Edit" 
                  className="p-2 hover:bg-gray-200 rounded" 
                  onClick={() => openEdit(branch)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 hover:text-blue-800" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.414 2.586a2 2 0 00-2.828 0l-9.5 9.5A2 2 0 004 14.5V17a1 1 0 001 1h2.5a2 2 0 001.414-.586l9.5-9.5a2 2 0 000-2.828l-2-2zM5 16v-1.5a.5.5 0 01.146-.354l9.5-9.5a.5.5 0 01.708.708l-9.5 9.5A.5.5 0 015 16z" />
                  </svg>
                </button>
                <button 
                  title="Delete" 
                  className="p-2 hover:bg-gray-200 rounded" 
                  onClick={() => handleDeleteBranch(branch)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600 hover:text-red-800" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8zM4 6a1 1 0 011-1h10a1 1 0 011 1v1H4V6zm2-3a1 1 0 011-1h6a1 1 0 011 1v1H6V3zm9 2V6a2 2 0 01-2 2v7a2 2 0 01-2 2H7a2 2 0 01-2-2V8a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Branch Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)}>
        {editBranch && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4 text-blue-700">Edit Branch</h2>
            <input
              className="border rounded-lg px-3 py-2 w-full mb-4"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              placeholder="Branch name"
            />
            {error && <div className="text-red-600 text-sm mb-4">{error}</div>}
            <div className="flex gap-4">
              <button 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700" 
                onClick={handleEditBranch}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button 
                className="bg-gray-300 px-4 py-2 rounded-lg font-semibold" 
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Branch Details Modal */}
      <Modal open={!!branchModal} onClose={() => setBranchModal(null)}>
        {branchModal && (
          <div className="bg-white rounded-2xl shadow-2xl p-6 mx-auto" style={{ width: '90vw', maxWidth: '1200px', height: '85vh', maxHeight: '800px', display: 'flex', flexDirection: 'column' }}>
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
              <h2 className="text-xl font-bold text-blue-700 capitalize">{branchModal} Entries</h2>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-auto">
              {branchData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No entries found</div>
              ) : (
                <table className="w-full border-collapse">
                  <thead className="bg-blue-50 sticky top-0">
                    <tr>
                      <th className="border px-4 py-2 text-left">Date</th>
                      <th className="border px-4 py-2 text-left">Customer</th>
                      <th className="border px-4 py-2 text-left">Place</th>
                      <th className="border px-4 py-2 text-left">Mobile</th>
                      <th className="border px-4 py-2 text-right">Loan Amount</th>
                      <th className="border px-4 py-2 text-right">Interest</th>
                      <th className="border px-4 py-2 text-right">EMI</th>
                      <th className="border px-4 py-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branchData.map((entry) => (
                      <tr key={entry._id} className="hover:bg-gray-50">
                        <td className="border px-4 py-2">{new Date(entry.date).toLocaleDateString()}</td>
                        <td className="border px-4 py-2">{entry.customer}</td>
                        <td className="border px-4 py-2">{entry.place}</td>
                        <td className="border px-4 py-2">{entry.mobile}</td>
                        <td className="border px-4 py-2 text-right font-medium">₹{Number(entry.loan).toLocaleString()}</td>
                        <td className="border px-4 py-2 text-right">₹{Number(entry.interest).toLocaleString()}</td>
                        <td className="border px-4 py-2 text-right">₹{Number(entry.emi).toLocaleString()}</td>
                        <td className="border px-4 py-2 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                              onClick={() => openCustomerDetails(entry)}
                              title="View payment history"
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
                              className="text-red-600 hover:text-red-800"
                              onClick={() => handleDeleteEntry(entry._id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </Modal>


      {/* Make Payment Modal */}
      <Modal open={paymentOpen} onClose={closeModals}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 mx-auto" style={{ width: '600px', maxWidth: '90vw' }}>
          <h2 className="text-xl font-bold mb-4 text-blue-700">Make Payment</h2>
          <form onSubmit={handlePayment}>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
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
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Customer</label>
                <input
                  type="text"
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={paymentForm.customer}
                  onChange={e => setPaymentForm({ ...paymentForm, customer: e.target.value })}
                  placeholder="Enter customer name"
                  required
                />
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
              <button type="submit" className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold flex-1 hover:bg-purple-700 transition-colors">Record Payment</button>
              <button type="button" className="bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold flex-1 hover:bg-gray-500 transition-colors" onClick={closeModals}>Cancel</button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Customer Payment Details Modal */}
      <Modal open={detailsOpen} onClose={closeModals}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 mx-auto" style={{ width: '800px', maxWidth: '90vw' }}>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-blue-700">
              Payment History - {selectedCustomer?.customer}
            </h2>
            <p className="text-gray-600">
              Branch: {branchModal} | Mobile: {selectedCustomer?.mobile}
            </p>
          </div>
          
          {customerPayments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No payment records found for this customer</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                    <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-700">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {customerPayments.map((entry, index) => (
                    <tr key={index} className="hover:bg-gray-50 bg-green-50">
                      <td className="border border-gray-300 px-4 py-3">
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-right font-medium">
                        <span className="text-green-600 font-semibold">₹{Number(entry.loan).toLocaleString()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-green-50">
                  <tr>
                    <td className="border border-gray-300 px-4 py-3 font-bold text-gray-700">
                      Total Payments: {customerPayments.length}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-right font-bold text-green-600">
                      ₹{customerPayments.reduce((sum, entry) => sum + Number(entry.loan), 0).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
          
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

export default BranchesListPage;
