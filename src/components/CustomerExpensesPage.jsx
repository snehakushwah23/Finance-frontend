import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from './Modal';
import { api } from '../config/api';

function CustomerExpensesPage({ categories = [] }) {
  const [customerExpenses, setCustomerExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [formData, setFormData] = useState({
    customerName: '',
    date: '',
    amount: '',
    category: ''
  });

  // Filter out system categories and use the categories from Indirect Expenses
  const availableCategories = categories.filter(cat => 
    cat !== 'Total' && cat !== 'Indirect Exp'
  );

  // Load customer expenses on component mount
  useEffect(() => {
    loadCustomerExpenses();
  }, []);

  const loadCustomerExpenses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(api.get('/api/customer-expenses'));
      // Sort by date descending (newest first)
      const sortedExpenses = response.data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setCustomerExpenses(sortedExpenses);
    } catch (error) {
      console.error('Error loading employee expenses:', error);
      alert('Error loading employee expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!formData.customerName || !formData.date || !formData.amount || !formData.category) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      await axios.post(api.post('/api/customer-expenses'), formData);
      setAddFormOpen(false);
      setFormData({ customerName: '', date: '', amount: '', category: '', description: '' });
      // Reload expenses to maintain proper sorting
      loadCustomerExpenses();
    } catch (error) {
      console.error('Error adding employee expense:', error);
      alert('Error adding employee expense');
    } finally {
      setLoading(false);
    }
  };

  const handleEditExpense = async (e) => {
    e.preventDefault();
    if (!formData.customerName || !formData.date || !formData.amount || !formData.category) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      await axios.put(api.put(`/api/customer-expenses/${editingExpense._id}`), formData);
      setEditFormOpen(false);
      setEditingExpense(null);
      setFormData({ customerName: '', date: '', amount: '', category: '', description: '' });
      // Reload expenses to maintain proper sorting
      loadCustomerExpenses();
    } catch (error) {
      console.error('Error updating employee expense:', error);
      alert('Error updating employee expense');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee expense?')) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(api.delete(`/api/customer-expenses/${id}`));
      // Reload expenses to maintain proper sorting
      loadCustomerExpenses();
    } catch (error) {
      console.error('Error deleting employee expense:', error);
      alert('Error deleting employee expense');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (expense) => {
    setEditingExpense(expense);
    setFormData({
      customerName: expense.customerName,
      date: new Date(expense.date).toISOString().split('T')[0],
      amount: expense.amount,
      category: expense.category
    });
    setEditFormOpen(true);
  };

  const closeModals = () => {
    setAddFormOpen(false);
    setEditFormOpen(false);
    setDetailModalOpen(false);
    setEditingExpense(null);
    setSelectedExpense(null);
    setFormData({ customerName: '', date: '', amount: '', category: '' });
  };

  // Handle eye icon click to show expense details
  const handleViewDetails = (expense) => {
    setSelectedExpense(expense);
    setDetailModalOpen(true);
  };

  // Filter expenses by date
  const getFilteredExpenses = () => {
    if (!selectedDate) return customerExpenses;
    return customerExpenses.filter(expense => {
      const expenseDate = new Date(expense.date).toISOString().split('T')[0];
      return expenseDate === selectedDate;
    });
  };

  return (
    <div className="flex-1 p-8 ml-56">
      <div className="bg-white rounded-2xl shadow p-6 mb-6 border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Employee Expenses</h1>
          <div className="flex gap-3">
            <button
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-green-700"
              onClick={() => setAddFormOpen(true)}
              disabled={loading}
            >
              Add Employee Expense
            </button>
          </div>
        </div>

        {/* Employee Expenses Table */}
        {loading && customerExpenses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : customerExpenses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No employee expenses found</div>
        ) : (
          <div>
            {/* Date Filter */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-4">
                <label className="text-sm font-semibold text-gray-700">Filter by Date:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  onClick={() => setSelectedDate('')}
                  className="bg-gray-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-600"
                >
                  Clear Filter
                </button>
              </div>
            </div>
            
            {/* Employee Expenses Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Employee Name</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Category</th>
                    <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-700">Amount (₹)</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredExpenses().map((expense) => (
                    <tr key={expense._id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3">
                        {new Date(expense.date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 font-medium">
                        {expense.customerName}
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          expense.category === 'Travel' ? 'bg-blue-100 text-blue-800' :
                          expense.category === 'Food' ? 'bg-green-100 text-green-800' :
                          expense.category === 'Office' ? 'bg-purple-100 text-purple-800' :
                          expense.category === 'Transport' ? 'bg-yellow-100 text-yellow-800' :
                          expense.category === 'Medical' ? 'bg-red-100 text-red-800' :
                          expense.category === 'Entertainment' ? 'bg-pink-100 text-pink-800' :
                          expense.category === 'Utilities' ? 'bg-indigo-100 text-indigo-800' :
                          expense.category === 'Other' ? 'bg-gray-100 text-gray-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {expense.category}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-right font-medium">
                        ₹{expense.amount.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleViewDetails(expense)}
                            className="p-1 hover:bg-blue-200 rounded-full transition-colors"
                            title="View details"
                          >
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                            onClick={() => openEditModal(expense)}
                            disabled={loading}
                          >
                            Edit
                          </button>
                          <button
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                            onClick={() => handleDeleteExpense(expense._id)}
                            disabled={loading}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Employee Expense Modal */}
      <Modal open={addFormOpen} onClose={closeModals}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 mx-auto" style={{ width: '600px', maxWidth: '90vw' }}>
          <h2 className="text-xl font-bold mb-4 text-blue-700">Add Employee Expense</h2>
          <form onSubmit={handleAddExpense}>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Employee Name</label>
                <input
                  type="text"
                  name="customerName"
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Date</label>
                <input
                  type="date"
                  name="date"
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Category</label>
                <select
                  name="category"
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Category</option>
                  {availableCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Amount (₹)</label>
                <input
                  type="number"
                  name="amount"
                  min="0"
                  step="0.01"
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold flex-1 hover:bg-green-700 transition-colors"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Employee Expense'}
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

      {/* Edit Employee Expense Modal */}
      <Modal open={editFormOpen} onClose={closeModals}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 mx-auto" style={{ width: '600px', maxWidth: '90vw' }}>
          <h2 className="text-xl font-bold mb-4 text-blue-700">Edit Employee Expense</h2>
          <form onSubmit={handleEditExpense}>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Employee Name</label>
                <input
                  type="text"
                  name="customerName"
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Date</label>
                <input
                  type="date"
                  name="date"
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Category</label>
                <select
                  name="category"
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Category</option>
                  {availableCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Amount (₹)</label>
                <input
                  type="number"
                  name="amount"
                  min="0"
                  step="0.01"
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold flex-1 hover:bg-blue-700 transition-colors"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Employee Expense'}
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

      {/* Employee Expense Details Modal */}
      <Modal open={detailModalOpen} onClose={closeModals}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 mx-auto" style={{ width: '600px', maxWidth: '90vw' }}>
          <h2 className="text-xl font-bold mb-4 text-blue-700">Employee Expense Details</h2>
          
          {selectedExpense && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Employee Name</label>
                  <p className="text-gray-900 font-medium">{selectedExpense.customerName}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                  <p className="text-gray-900">{new Date(selectedExpense.date).toLocaleDateString('en-IN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    selectedExpense.category === 'Travel' ? 'bg-blue-100 text-blue-800' :
                    selectedExpense.category === 'Food' ? 'bg-green-100 text-green-800' :
                    selectedExpense.category === 'Office' ? 'bg-purple-100 text-purple-800' :
                    selectedExpense.category === 'Transport' ? 'bg-yellow-100 text-yellow-800' :
                    selectedExpense.category === 'Medical' ? 'bg-red-100 text-red-800' :
                    selectedExpense.category === 'Entertainment' ? 'bg-pink-100 text-pink-800' :
                    selectedExpense.category === 'Utilities' ? 'bg-indigo-100 text-indigo-800' :
                    selectedExpense.category === 'Other' ? 'bg-gray-100 text-gray-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {selectedExpense.category}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Amount</label>
                  <p className="text-gray-900 font-bold text-lg">₹{selectedExpense.amount.toLocaleString()}</p>
                </div>
              </div>
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

export default CustomerExpensesPage;