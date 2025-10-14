import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from './Modal';
import { api } from '../config/api';

function EmployeeExpensesPage({ categories = [] }) {
  const [employeeExpenses, setEmployeeExpenses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [employeeHistoryModal, setEmployeeHistoryModal] = useState(false);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState('');
  const [employeeHistory, setEmployeeHistory] = useState([]);
  const [formData, setFormData] = useState({
    customerName: '',
    date: '',
    amount: '',
    category: ''
  });

  // Load employee expenses and employees on component mount
  useEffect(() => {
    loadEmployeeExpenses();
    loadEmployees();
  }, []);

  // Filter expenses when category or date changes
  useEffect(() => {
    let filtered = employeeExpenses;

    if (selectedCategory) {
      filtered = filtered.filter(exp => exp.category === selectedCategory);
    }

    if (selectedDate) {
      const filterDate = new Date(selectedDate).toISOString().split('T')[0];
      filtered = filtered.filter(exp => {
        const expDate = new Date(exp.date).toISOString().split('T')[0];
        return expDate === filterDate;
      });
    }

    setFilteredExpenses(filtered);
  }, [employeeExpenses, selectedCategory, selectedDate]);

  const loadEmployeeExpenses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(api.get('/api/customer-expenses'));
      // Sort by date descending (newest first)
      const sortedExpenses = response.data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setEmployeeExpenses(sortedExpenses);
    } catch (error) {
      console.error('Error loading employee expenses:', error);
      alert('Error loading employee expenses');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await axios.get(api.get('/api/employees'));
      setEmployees(response.data);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleExpenseClick = (expense) => {
    setSelectedExpense(expense);
    setDetailModalOpen(true);
  };

  const handleViewEmployeeHistory = (employeeName) => {
    // Filter all expenses for this employee
    const history = employeeExpenses.filter(exp => exp.customerName === employeeName);
    // Sort by date descending (newest first)
    const sortedHistory = history.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    setSelectedEmployeeName(employeeName);
    setEmployeeHistory(sortedHistory);
    setEmployeeHistoryModal(true);
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      customerName: expense.customerName || '',
      date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : '',
      amount: expense.amount || '',
      category: expense.category || ''
    });
    setEditModalOpen(true);
  };

  const handleDelete = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this employee expense?')) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`/api/customer-expenses/${expenseId}`);
      await loadEmployeeExpenses(); // Reload the list
      alert('Employee expense deleted successfully');
    } catch (error) {
      console.error('Error deleting employee expense:', error);
      alert('Error deleting employee expense');
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

  const handleUpdateExpense = async (e) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.date || !formData.amount || !formData.category) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await axios.put(`/api/customer-expenses/${editingExpense._id}`, formData);
      await loadEmployeeExpenses(); // Reload the list
      setEditModalOpen(false);
      setEditingExpense(null);
      setFormData({ customerName: '', date: '', amount: '', category: '', description: '' });
      alert('Employee expense updated successfully');
    } catch (error) {
      console.error('Error updating employee expense:', error);
      alert('Error updating employee expense');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.date || !formData.amount || !formData.category) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await axios.post('/api/customer-expenses', formData);
      await loadEmployeeExpenses(); // Reload the list
      setAddModalOpen(false);
      setFormData({ customerName: '', date: '', amount: '', category: '' });
      alert('Employee expense added successfully');
    } catch (error) {
      console.error('Error adding employee expense:', error);
      alert('Error adding employee expense');
    } finally {
      setLoading(false);
    }
  };

  const closeModals = () => {
    setDetailModalOpen(false);
    setEditModalOpen(false);
    setAddModalOpen(false);
    setEmployeeHistoryModal(false);
    setSelectedExpense(null);
    setEditingExpense(null);
    setSelectedEmployeeName('');
    setEmployeeHistory([]);
    setFormData({ customerName: '', date: '', amount: '', category: '' });
  };

  // Get unique dates for date filter
  const uniqueDates = [...new Set(employeeExpenses.map(exp => 
    new Date(exp.date).toISOString().split('T')[0]
  ))].sort().reverse();

  // Filter out system categories
  const availableCategories = categories.filter(cat => 
    cat !== 'Total' && cat !== 'Indirect Exp'
  );

  return (
    <div className="flex-1 p-8 ml-56">
      <div className="bg-white rounded-2xl shadow p-6 mb-6 border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Employee Expenses </h1>
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
            onClick={() => setAddModalOpen(true)}
          >
            <svg 
              className="w-5 h-5" 
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
            Add Employee Expense
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-semibold mb-2 text-gray-700">Filter by Category</label>
            <select
              className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold mb-2 text-gray-700">Filter by Date</label>
            <input
              type="date"
              className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button
              className="bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
              onClick={() => {
                setSelectedCategory('');
                setSelectedDate('');
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-600">Total Entries</h3>
            <p className="text-2xl font-bold text-blue-900">{filteredExpenses.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-600">Total Amount</h3>
            <p className="text-2xl font-bold text-green-900">
              ₹{filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-purple-600">Unique Employees</h3>
            <p className="text-2xl font-bold text-purple-900">
              {new Set(filteredExpenses.map(exp => exp.customerName)).size}
            </p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-orange-600">Categories</h3>
            <p className="text-2xl font-bold text-orange-900">
              {new Set(filteredExpenses.map(exp => exp.category)).size}
            </p>
          </div>
        </div>

        {/* Content based on loading and data */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No employee expenses found</div>
        ) : (
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
                {filteredExpenses.map(expense => (
                  <tr key={expense._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleExpenseClick(expense)}>
                    <td className="border border-gray-300 px-4 py-3">
                      {expense.date ? new Date(expense.date).toLocaleDateString() : ''}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 font-medium">{expense.customerName}</td>
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
                      ₹{Number(expense.amount).toLocaleString()}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          className="p-1 hover:bg-blue-200 rounded-full transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewEmployeeHistory(expense.customerName);
                          }}
                          title="View employee history"
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(expense);
                          }}
                          title="Edit expense"
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
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
                            />
                          </svg>
                        </button>
                        <button
                          className="p-1 hover:bg-red-200 rounded-full transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(expense._id);
                          }}
                          title="Delete expense"
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Expense Detail Modal */}
      <Modal open={detailModalOpen} onClose={closeModals}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 mx-auto" style={{ width: '600px', maxWidth: '90vw' }}>
          <h2 className="text-xl font-bold mb-4 text-blue-700">Employee Expense Details</h2>
          {selectedExpense && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600">Employee Name</label>
                  <p className="text-lg font-medium text-gray-800">{selectedExpense.customerName}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600">Date</label>
                  <p className="text-lg font-medium text-gray-800">
                    {selectedExpense.date ? new Date(selectedExpense.date).toLocaleDateString() : ''}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600">Category</label>
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
                  <label className="block text-sm font-semibold text-gray-600">Amount</label>
                  <p className="text-lg font-bold text-green-600">₹{Number(selectedExpense.amount).toLocaleString()}</p>
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

      {/* Edit Employee Expense Modal */}
      <Modal open={editModalOpen} onClose={closeModals}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 mx-auto" style={{ width: '600px', maxWidth: '90vw' }}>
          <h2 className="text-xl font-bold mb-4 text-blue-700">Edit Employee Expense</h2>
          <form onSubmit={handleUpdateExpense}>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Employee Name *</label>
                <input
                  type="text"
                  name="customerName"
                  list="employee-list-edit"
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  placeholder="Type or select employee name"
                  required
                />
                <datalist id="employee-list-edit">
                  {employees.map(emp => (
                    <option key={emp._id} value={emp.name} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Date *</label>
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
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Amount (₹) *</label>
                <input
                  type="number"
                  name="amount"
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={formData.amount}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Category *</label>
                <select
                  name="category"
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.filter(cat => cat !== 'Total' && cat !== 'Indirect Exp').map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
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

      {/* Add Employee Expense Modal */}
      <Modal open={addModalOpen} onClose={closeModals}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 mx-auto" style={{ width: '600px', maxWidth: '90vw' }}>
          <h2 className="text-xl font-bold mb-4 text-blue-700">Add Employee Expense</h2>
          <form onSubmit={handleAddExpense}>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Employee Name *</label>
                <input
                  type="text"
                  name="customerName"
                  list="employee-list-add"
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  placeholder="Type or select employee name"
                  required
                />
                <datalist id="employee-list-add">
                  {employees.map(emp => (
                    <option key={emp._id} value={emp.name} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Date *</label>
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
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Amount (₹) *</label>
                <input
                  type="number"
                  name="amount"
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={formData.amount}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Category *</label>
                <select
                  name="category"
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.filter(cat => cat !== 'Total' && cat !== 'Indirect Exp').map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold flex-1 hover:bg-blue-700 transition-colors"
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

      {/* Employee History Modal */}
      <Modal open={employeeHistoryModal} onClose={closeModals}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 mx-auto" style={{ width: '800px', maxWidth: '95vw' }}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-blue-700">Employee Expense History</h2>
            <button
              onClick={closeModals}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Employee Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl mb-6 border border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-blue-600 mb-1">Employee Name</label>
                <p className="text-2xl font-bold text-gray-800">{selectedEmployeeName}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-blue-600 mb-1">Total Expenses</label>
                <p className="text-2xl font-bold text-green-600">
                  ₹{employeeHistory.reduce((sum, exp) => sum + Number(exp.amount), 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-blue-600 mb-1">Total Transactions</label>
                <p className="text-2xl font-bold text-purple-600">{employeeHistory.length}</p>
              </div>
            </div>
          </div>

          {/* History Table */}
          <style>{`
            .history-scroll::-webkit-scrollbar {
              width: 6px;
            }
            .history-scroll::-webkit-scrollbar-track {
              background: #f3f4f6;
            }
            .history-scroll::-webkit-scrollbar-thumb {
              background: #9ca3af;
              border-radius: 3px;
            }
            .history-scroll::-webkit-scrollbar-thumb:hover {
              background: #6b7280;
            }
          `}</style>
          <div 
            className={`history-scroll ${employeeHistory.length > 3 ? 'max-h-80 overflow-y-auto' : ''}`}
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#9ca3af #f3f4f6' }}
          >
            {employeeHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No expense history found</div>
            ) : (
              <table className="w-full border-collapse">
                <thead className="bg-blue-100 sticky top-0">
                  <tr>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">#</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Category</th>
                    <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-700">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeHistory.map((expense, index) => (
                    <tr key={expense._id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 text-gray-600">{index + 1}</td>
                      <td className="border border-gray-300 px-4 py-3">
                        {expense.date ? new Date(expense.date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        }) : ''}
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
                      <td className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-800">
                        ₹{Number(expense.amount).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-blue-50 sticky bottom-0">
                  <tr>
                    <td colSpan="3" className="border border-gray-300 px-4 py-3 text-right font-bold text-gray-800">
                      Total Amount:
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-right font-bold text-green-600">
                      ₹{employeeHistory.reduce((sum, exp) => sum + Number(exp.amount), 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              </table>
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

export default EmployeeExpensesPage;

