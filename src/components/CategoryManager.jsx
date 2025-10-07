import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Modal from './Modal';
import ExpenseTable from './ExpenseTable';
import axios from 'axios';
import { api } from '../config/api';

export default function CategoryManager({ categories, setCategories, expenses, months, selectedMonth, setReload }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showAllDays, setShowAllDays] = useState(false);
  const [catModal, setCatModal] = useState(null);
  const [editCat, setEditCat] = useState(null);
  const [newCat, setNewCat] = useState('');
  const [editCatName, setEditCatName] = useState('');
  const [showTotalModal, setShowTotalModal] = useState(false);
  const [totalMonth, setTotalMonth] = useState(months[0]);
  const [totalDate, setTotalDate] = useState('');
  const [totalAmount, setTotalAmount] = useState(null);
  const [totalCategory, setTotalCategory] = useState('All');
  const [viewMode, setViewMode] = useState('date'); // 'date', 'month', or 'allDays'
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
  const [customerExpenses, setCustomerExpenses] = useState([]);
  const [customerDetailsModalOpen, setCustomerDetailsModalOpen] = useState(false);
  const [selectedCustomerExpenses, setSelectedCustomerExpenses] = useState(null);
  const [newEntry, setNewEntry] = useState({
    date: '',
    amount: '',
    description: '',
    category: ''
  });
  const [showEmployeeExpenseModal, setShowEmployeeExpenseModal] = useState(false);
  const [employeeExpenseForm, setEmployeeExpenseForm] = useState({
    customerName: '',
    date: '',
    amount: '',
    category: ''
  });

  // Load customer expenses
  const loadCustomerExpenses = async () => {
    try {
      const response = await axios.get(api.get('/api/customer-expenses'));
      const sortedExpenses = response.data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setCustomerExpenses(sortedExpenses);
    } catch (error) {
      console.error('Error loading employee expenses:', error);
      setCustomerExpenses([]);
    }
  };

  // Load customer expenses on component mount and when reload changes
  useEffect(() => {
    loadCustomerExpenses();
  }, [setReload]);

  const handleAddCategory = () => {
    if (newCat && !categories.includes(newCat)) {
      setCategories([...categories, newCat]);
      setNewCat('');
    }
  };

  const handleEditCategory = () => {
    if (editCat && editCatName && editCatName !== editCat) {
      setCategories(categories.map(c => (c === editCat ? editCatName : c)));
      setEditCat(null);
      setEditCatName('');
    }
  };

  const handleDeleteCategory = cat => {
    if (window.confirm(`Delete category "${cat}"? This will not delete expenses.`)) {
      setCategories(categories.filter(c => c !== cat));
    }
  };

  const handleAddEntry = async () => {
    if (newEntry.date && newEntry.amount && newEntry.description && newEntry.category) {
      const entryData = {
        ...newEntry,
        amount: parseFloat(newEntry.amount),
        month: selectedMonth
      };
      
      console.log('Adding entry:', entryData);
      
      try {
        // Add entry to backend
        const response = await axios.post(api.post('/api/expenses'), entryData);
        console.log('✅ Entry added successfully to database:', response.data);
        
        // Close modal and reset form
        setShowAddEntryModal(false);
        setNewEntry({
          date: '',
          amount: '',
          description: '',
          category: ''
        });
        
        // Force immediate reload by toggling state
        console.log('🔄 Triggering reload to fetch fresh data...');
        setTimeout(() => {
          setReload(prev => {
            const newValue = !prev;
            console.log('🔄 Reload state changed:', prev, '->', newValue);
            return newValue;
          });
        }, 100);
        
        // Show success message
        alert('✅ Entry added successfully! Reloading data...');
      } catch (err) {
        console.error('Error adding entry:', err);
        console.error('Error details:', err.response?.data || err.message);
        alert('Error adding entry: ' + (err.response?.data?.error || err.message));
      }
    } else {
      alert('Please fill all fields');
    }
  };

  const openAddEntryModal = (category) => {
    setNewEntry({
      date: new Date().toISOString().slice(0, 10),
      amount: '',
      description: '',
      category: category
    });
    setShowAddEntryModal(true);
  };

  const handleEmployeeExpenseInputChange = (e) => {
    const { name, value } = e.target;
    setEmployeeExpenseForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddEmployeeExpense = async (e) => {
    e.preventDefault();
    if (!employeeExpenseForm.customerName || !employeeExpenseForm.date || !employeeExpenseForm.amount || !employeeExpenseForm.category) {
      alert('Please fill in all fields');
      return;
    }

    try {
      await axios.post(api.post('/api/customer-expenses'), employeeExpenseForm);
      setShowEmployeeExpenseModal(false);
      setEmployeeExpenseForm({ customerName: '', date: '', amount: '', category: '' });
      // Reload expenses to maintain proper sorting
      loadCustomerExpenses();
      setReload(prev => !prev);
    } catch (error) {
      console.error('Error adding employee expense:', error);
      alert('Error adding employee expense');
    }
  };

  // Auto-open category modal if coming from search
  useEffect(() => {
    if (location.state?.openCategory) {
      setCatModal(location.state.openCategory);
      // Clear the state to prevent reopening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Get category expenses count - handle current data structure
  const getCategoryExpenseCount = (cat) => {
    console.log('Getting count for category:', cat, 'expenses array:', expenses);
    
    // Count regular expenses
    let regularCount = 0;
    if (Array.isArray(expenses) && expenses.length > 0) {
      const filtered = expenses.filter(exp => exp.category === cat);
      regularCount = filtered.length;
    }

    // Count unique dates for customer expenses (since we group by date)
    let customerCount = 0;
    if (Array.isArray(customerExpenses) && customerExpenses.length > 0) {
      const customerExpensesForCategory = customerExpenses.filter(exp => exp.category === cat);
      const uniqueDates = new Set(customerExpensesForCategory.map(exp => 
        new Date(exp.date).toISOString().split('T')[0]
      ));
      customerCount = uniqueDates.size;
    }

    const totalCount = regularCount + customerCount;
    console.log('Expense count for', cat, ':', totalCount, '(regular:', regularCount, ', employee:', customerCount, ')');
    return totalCount;
  };

  // Get category expenses for modal
  const getCategoryExpenses = (cat) => {
    console.log('Getting expenses for category:', cat, 'expenses array:', expenses);
    
    // Get regular expenses for this category
    let regularExpenses = [];
    if (Array.isArray(expenses) && expenses.length > 0) {
      regularExpenses = expenses.filter(exp => exp.category === cat);
    }

    // Get customer expenses for this category and calculate daily totals
    let customerExpensesData = [];
    if (Array.isArray(customerExpenses) && customerExpenses.length > 0) {
      const customerExpensesForCategory = customerExpenses.filter(exp => exp.category === cat);
      
      // Group customer expenses by date and calculate daily totals
      const dailyTotals = {};
      customerExpensesForCategory.forEach(expense => {
        const date = new Date(expense.date).toISOString().split('T')[0];
        if (!dailyTotals[date]) {
          dailyTotals[date] = {
            date: new Date(expense.date),
            amount: 0,
            customerNames: []
          };
        }
        dailyTotals[date].amount += expense.amount;
        dailyTotals[date].customerNames.push(expense.customerName);
      });

      // Convert to expense format for display with eye icon functionality
      customerExpensesData = Object.values(dailyTotals).map(dayTotal => ({
        _id: `customer_${dayTotal.date.toISOString().split('T')[0]}`,
        date: dayTotal.date,
        amount: dayTotal.amount,
        category: cat,
        description: cat, // Show category name instead of customer names
        month: dayTotal.date.toLocaleDateString('en-US', { month: 'long' }),
        isCustomerExpense: true, // Flag to identify customer expenses
        customerDetails: {
          date: dayTotal.date,
          category: cat,
          customers: customerExpensesForCategory.filter(exp => {
            const expDate = new Date(exp.date).toISOString().split('T')[0];
            return expDate === dayTotal.date.toISOString().split('T')[0];
          }).map(exp => ({
            name: exp.customerName,
            amount: exp.amount,
            id: exp._id,
            description: exp.description || ''
          })),
          totalAmount: dayTotal.amount
        }
      }));
    }

    // Combine regular expenses and customer expenses data
    const combinedExpenses = [...regularExpenses, ...customerExpensesData];
    
    // Sort by date (newest first)
    combinedExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    console.log('Combined expenses for', cat, ':', combinedExpenses);
    return combinedExpenses;
  };

  // Handle eye icon click to show customer details
  const handleCustomerDetailsClick = (customerDetails) => {
    setSelectedCustomerExpenses(customerDetails);
    setCustomerDetailsModalOpen(true);
  };

  // Handle eye icon click to show category details - opens same page as Petrol click
  const handleCategoryDetailsClick = (category) => {
    // Open the same category modal that opens when clicking on Petrol
    setCatModal(category);
  };

  console.log('=== CATEGORYMANAGER RENDER ===');
  console.log('CategoryManager - expenses prop:', expenses);
  console.log('CategoryManager - expenses length:', expenses?.length || 0);
  console.log('CategoryManager - expenses type:', typeof expenses);
  console.log('CategoryManager - expenses is array:', Array.isArray(expenses));
  if (expenses && expenses.length > 0) {
    console.log('CategoryManager - expenses categories:', expenses.map(exp => exp.category));
    console.log('CategoryManager - unique categories:', [...new Set(expenses.map(exp => exp.category))]);
  } else {
    console.log('CategoryManager - No expenses or empty array');
  }
  console.log('=== END CATEGORYMANAGER RENDER ===');

  return (
    <div className="flex-1 p-8 ml-56">
      <div className="bg-white rounded-2xl shadow p-6 mb-6 border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Category Manager</h1>
        
        <div className="flex gap-4 mb-6 items-center">
          <input
            className="border rounded-lg px-3 py-2 flex-1"
            placeholder="New category name"
            value={newCat}
            onChange={e => setNewCat(e.target.value)}
          />
          <button
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-green-700"
            onClick={handleAddCategory}
          >
            Add Category
          </button>
          <button
            className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-purple-700"
            onClick={() => {
              setEmployeeExpenseForm({
                customerName: '',
                date: new Date().toISOString().slice(0, 10),
                amount: '',
                category: ''
              });
              setShowEmployeeExpenseModal(true);
            }}
          >
            Add Employee Expense
          </button>
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-blue-700"
            onClick={() => setShowTotalModal(true)}
          >
            View Totals
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.filter(cat => cat !== 'Total').map(cat => (
            <div key={cat} className="bg-gray-50 rounded-lg shadow p-4 flex items-center justify-between border border-gray-200">
              <div className="flex-1 cursor-pointer" onClick={() => setCatModal(cat)}>
                <h2 className="text-lg font-bold mb-1 text-gray-800">{cat}</h2>
                <div className="text-gray-500 text-sm">{getCategoryExpenseCount(cat)} entries</div>
              </div>
              <div className="flex gap-2">
                <button 
                  title="View Details" 
                  className="p-2 hover:bg-gray-200 rounded" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCategoryDetailsClick(cat);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 hover:text-green-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <button 
                  title="Edit" 
                  className="p-2 hover:bg-gray-200 rounded" 
                  onClick={() => { setEditCat(cat); setEditCatName(cat); }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 hover:text-blue-800" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.414 2.586a2 2 0 00-2.828 0l-9.5 9.5A2 2 0 004 14.5V17a1 1 0 001 1h2.5a2 2 0 001.414-.586l9.5-9.5a2 2 0 000-2.828l-2-2zM5 16v-1.5a.5.5 0 01.146-.354l9.5-9.5a.5.5 0 01.708.708l-9.5 9.5A.5.5 0 015 16z" />
                  </svg>
                </button>
                <button 
                  title="Delete" 
                  className="p-2 hover:bg-gray-200 rounded" 
                  onClick={() => handleDeleteCategory(cat)}
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

      {/* Total Modal */}
      <Modal open={showTotalModal} onClose={() => setShowTotalModal(false)}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 mx-auto" style={{ width: '85vw', maxWidth: '1100px', height: '80vh', maxHeight: '850px', display: 'flex', flexDirection: 'column' }}>
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h2 className="text-xl font-bold text-blue-700">Total by Category</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-gray-700">View Mode:</label>
                <select
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                  value={viewMode}
                  onChange={e => setViewMode(e.target.value)}
                >
                  <option value="date">Single Date</option>
                  <option value="month">Entire Month</option>
                  <option value="allDays">All Days of Month</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-gray-700">Category:</label>
                <select
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                  value={totalCategory}
                  onChange={e => setTotalCategory(e.target.value)}
                >
                  <option value="All">All</option>
                  {categories.filter(c => c !== 'Total').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4 mb-4 flex-shrink-0">
            <div className="flex gap-4 items-end justify-center flex-wrap">
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Month</label>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                  value={totalMonth}
                  onChange={e => setTotalMonth(e.target.value)}
                >
                  {months.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              {viewMode === 'date' && (
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700">Date</label>
                  <input
                    type="date"
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                    value={totalDate}
                    onChange={e => setTotalDate(e.target.value)}
                  />
                </div>
              )}
              <button
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition-colors min-w-[120px]"
                onClick={() => {
                  if (viewMode === 'date') {
                    // Single date view
                    if (!totalDate) {
                      alert('Please select a date');
                      return;
                    }
                    
                    const catTotals = {};
                    categories.filter(cat => cat !== 'Total').forEach(cat => { catTotals[cat] = 0; });
                    
                    // Add regular expenses
                    if (Array.isArray(expenses) && expenses.length > 0) {
                      expenses.forEach(exp => {
                        if (exp.category && exp.amount) {
                          const matchedCat = categories.find(c => c.toLowerCase() === exp.category.toLowerCase());
                          if (matchedCat && matchedCat !== 'Total') {
                            if ((!totalMonth || exp.month === totalMonth) && 
                                exp.date && new Date(exp.date).toISOString().slice(0,10) === totalDate) {
                              catTotals[matchedCat] += exp.amount;
                            }
                          }
                        }
                      });
                    }
                    
                    // Add customer expenses for the selected date
                    if (Array.isArray(customerExpenses) && customerExpenses.length > 0) {
                      customerExpenses.forEach(exp => {
                        if (exp.category && exp.amount && exp.date) {
                          const matchedCat = categories.find(c => c.toLowerCase() === exp.category.toLowerCase());
                          if (matchedCat && matchedCat !== 'Total') {
                            const expDate = new Date(exp.date).toISOString().slice(0,10);
                            if (expDate === totalDate) {
                              catTotals[matchedCat] += exp.amount;
                            }
                          }
                        }
                      });
                    }
                    
                    setTotalAmount({ [totalDate]: catTotals });
                  } else if (viewMode === 'month') {
                    // Entire month view - show single row with totals for the month
                    if (!totalMonth) {
                      alert('Please select a month');
                      return;
                    }
                    
                    const catTotals = {};
                    categories.filter(cat => cat !== 'Total').forEach(cat => { catTotals[cat] = 0; });
                    
                    // Add regular expenses for the month
                    if (Array.isArray(expenses) && expenses.length > 0) {
                      expenses.forEach(exp => {
                        if (exp.category && exp.amount && exp.month === totalMonth) {
                          const matchedCat = categories.find(c => c.toLowerCase() === exp.category.toLowerCase());
                          if (matchedCat && matchedCat !== 'Total') {
                            catTotals[matchedCat] += exp.amount;
                          }
                        }
                      });
                    }
                    
                    // Add customer expenses for the month
                    if (Array.isArray(customerExpenses) && customerExpenses.length > 0) {
                      customerExpenses.forEach(exp => {
                        if (exp.category && exp.amount && exp.date) {
                          const expMonth = new Date(exp.date).toLocaleDateString('en-US', { month: 'long' });
                          if (expMonth === totalMonth) {
                            const matchedCat = categories.find(c => c.toLowerCase() === exp.category.toLowerCase());
                            if (matchedCat && matchedCat !== 'Total') {
                              catTotals[matchedCat] += exp.amount;
                            }
                          }
                        }
                      });
                    }
                    
                    setTotalAmount({ [`${totalMonth} Total`]: catTotals });
                  } else if (viewMode === 'allDays') {
                    // All days of month view - show each day separately
                    const dateWiseTotals = {};
                    
                    // Add regular expenses
                    if (Array.isArray(expenses) && expenses.length > 0) {
                      expenses.forEach(exp => {
                        if (exp.category && exp.amount && exp.date) {
                          const matchedCat = categories.find(c => c.toLowerCase() === exp.category.toLowerCase());
                          if (matchedCat && matchedCat !== 'Total') {
                            if (!totalMonth || exp.month === totalMonth) {
                              const dateStr = new Date(exp.date).toISOString().slice(0,10);
                              if (!dateWiseTotals[dateStr]) {
                                dateWiseTotals[dateStr] = {};
                                categories.filter(cat => cat !== 'Total').forEach(cat => {
                                  dateWiseTotals[dateStr][cat] = 0;
                                });
                              }
                              dateWiseTotals[dateStr][matchedCat] += exp.amount;
                            }
                          }
                        }
                      });
                    }
                    
                    // Add customer expenses
                    if (Array.isArray(customerExpenses) && customerExpenses.length > 0) {
                      customerExpenses.forEach(exp => {
                        if (exp.category && exp.amount && exp.date) {
                          const matchedCat = categories.find(c => c.toLowerCase() === exp.category.toLowerCase());
                          if (matchedCat && matchedCat !== 'Total') {
                            const expMonth = new Date(exp.date).toLocaleDateString('en-US', { month: 'long' });
                            if (expMonth === totalMonth) {
                              const dateStr = new Date(exp.date).toISOString().slice(0,10);
                              if (!dateWiseTotals[dateStr]) {
                                dateWiseTotals[dateStr] = {};
                                categories.filter(cat => cat !== 'Total').forEach(cat => {
                                  dateWiseTotals[dateStr][cat] = 0;
                                });
                              }
                              dateWiseTotals[dateStr][matchedCat] += exp.amount;
                            }
                          }
                        }
                      });
                    }
                    
                    setTotalAmount(dateWiseTotals);
                  }
                }}
              >
                Show Table
              </button>
            </div>
          </div>
          
          {!showAllDays && totalAmount && typeof totalAmount === 'object' && Object.keys(totalAmount).length > 0 && (
            <div className="flex-1 overflow-auto mt-4">
              <div className="min-w-full">
                <table className="w-full border border-blue-200 rounded-xl shadow">
                  <thead className="bg-blue-50 sticky top-0 z-10">
                    <tr>
                      <th className="border px-4 py-2 text-blue-700 font-semibold text-base">Category</th>
                      {Object.keys(totalAmount).sort().map(date => (
                        <th key={date} className="border px-4 py-2 text-blue-700 font-semibold text-base">{date}</th>
                      ))}
                      <th className="border px-4 py-2 bg-blue-100 text-blue-900 font-bold text-base">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(totalCategory === 'All' ? categories.filter(cat => cat !== 'Total') : [totalCategory]).map(cat => {
                      const catTotal = Object.keys(totalAmount).reduce((sum, date) => {
                        return sum + (totalAmount[date][cat] || 0);
                      }, 0);
                      return (
                        <tr key={cat} className="bg-white hover:bg-blue-50">
                          <td className="border px-4 py-2 text-gray-800 font-semibold">{cat}</td>
                          {Object.keys(totalAmount).sort().map(date => (
                            <td key={date} className="border px-4 py-2 text-right text-gray-800 font-medium">
                              {totalAmount[date][cat]?.toFixed(2) || '0.00'}
                            </td>
                          ))}
                          <td className="border px-4 py-2 text-right font-bold bg-blue-50 text-blue-900">
                            {catTotal.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                    {Object.keys(totalAmount).length > 1 && (
                      <tr className="bg-blue-100 font-bold">
                        <td className="border px-4 py-2 text-blue-900">Grand Total</td>
                        {Object.keys(totalAmount).sort().map(date => {
                          const dateTotal = Object.values(totalAmount[date]).reduce((a, b) => a + b, 0);
                          return (
                            <td key={date} className="border px-4 py-2 text-right text-blue-900">
                              {dateTotal.toFixed(2)}
                            </td>
                          );
                        })}
                        <td className="border px-4 py-2 text-right text-blue-900">
                          {Object.keys(totalAmount).reduce((sum, date) => {
                            return sum + Object.values(totalAmount[date]).reduce((a, b) => a + b, 0);
                          }, 0).toFixed(2)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Category Details Modal */}
      <Modal open={!!catModal} onClose={() => setCatModal(null)}>
        {catModal && (
          <div className="bg-white rounded-2xl shadow-2xl p-6 mx-auto" style={{ width: '90vw', maxWidth: '1200px', height: '85vh', maxHeight: '800px', display: 'flex', flexDirection: 'column' }}>
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
              <h2 className="text-xl font-bold text-blue-700">{catModal} Entries</h2>
            </div>
            
            {/* Summary Cards */}
            {(() => {
              const categoryExpenses = getCategoryExpenses(catModal);
              const regularExpenses = categoryExpenses.filter(exp => !exp.isCustomerExpense);
              const customerExpenses = categoryExpenses.filter(exp => exp.isCustomerExpense);
              const regularTotal = regularExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
              const customerTotal = customerExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
              const grandTotal = regularTotal + customerTotal;
              
              return (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 flex-shrink-0">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h3 className="text-sm font-semibold text-blue-700 mb-1">Total Entries</h3>
                    <p className="text-2xl font-bold text-blue-600">{categoryExpenses.length}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h3 className="text-sm font-semibold text-green-700 mb-1">Regular Expenses</h3>
                    <p className="text-2xl font-bold text-green-600">{regularExpenses.length}</p>
                    <p className="text-sm text-green-600">₹{regularTotal.toLocaleString()}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <h3 className="text-sm font-semibold text-purple-700 mb-1">Employee Expenses</h3>
                    <p className="text-2xl font-bold text-purple-600">{customerExpenses.length}</p>
                    <p className="text-sm text-purple-600">₹{customerTotal.toLocaleString()}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <h3 className="text-sm font-semibold text-orange-700 mb-1">Grand Total</h3>
                    <p className="text-2xl font-bold text-orange-600">₹{grandTotal.toLocaleString()}</p>
                  </div>
                </div>
              );
            })()}
            {/* Enhanced Expenses Table - Same as Eye Icon Modal */}
            <div className="flex-1 overflow-y-auto">
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description/Employee</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(() => {
                        const categoryExpenses = getCategoryExpenses(catModal);
                        const regularExpenses = categoryExpenses.filter(exp => !exp.isCustomerExpense);
                        const customerExpenses = categoryExpenses.filter(exp => exp.isCustomerExpense);
                        const regularTotal = regularExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
                        const customerTotal = customerExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
                        const grandTotal = regularTotal + customerTotal;
                        
                        return (
                          <>
                            {/* Regular Expenses */}
                            {regularExpenses.map((expense, index) => (
                              <tr key={`regular-${index}`} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {new Date(expense.date).toLocaleDateString('en-IN')}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {expense.description || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                                  ₹{expense.amount?.toLocaleString() || 0}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex gap-2 justify-center">
                                    <button
                                      className="hidden"
                                      onClick={() => {}}
                                    >
                                    </button>
                                    <button
                                      className="text-red-600 hover:underline text-sm"
                                      onClick={() => {
                                        if (window.confirm('Delete this expense?')) {
                                          axios.delete(`/api/expenses/${expense._id}`)
                                            .then(() => setReload(prev => !prev))
                                            .catch(err => console.error('Error deleting expense:', err));
                                        }
                                      }}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            
                            {/* Customer Expenses */}
                            {customerExpenses.map((expense, index) => (
                              <tr key={`customer-${index}`} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {new Date(expense.date).toLocaleDateString('en-IN')}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  <div className="flex items-center gap-2">
                                    <span>{expense.customerName || '-'}</span>
                                    {expense.customerDetails && (
                                      <button
                                        onClick={() => handleCustomerDetailsClick(expense.customerDetails)}
                                        className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                                        title="View employee details"
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
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                                  ₹{expense.amount?.toLocaleString() || 0}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex gap-2 justify-center">
                                    <button
                                      className="hidden"
                                      onClick={() => {}}
                                    >
                                    </button>
                                    <button
                                      className="text-red-600 hover:underline text-sm"
                                      onClick={() => {
                                        if (window.confirm('Delete this employee expense?')) {
                                          axios.delete(`/api/customer-expenses/${expense._id}`)
                                            .then(() => setReload(prev => !prev))
                                            .catch(err => console.error('Error deleting employee expense:', err));
                                        }
                                      }}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            
                            {/* Empty state */}
                            {(!regularExpenses.length && !customerExpenses.length) && (
                              <tr>
                                <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                                  No expenses found for this category
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })()}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                      <tr>
                        <td colSpan="3" className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                          Grand Total:
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                          {(() => {
                            const categoryExpenses = getCategoryExpenses(catModal);
                            const regularTotal = categoryExpenses.filter(exp => !exp.isCustomerExpense).reduce((sum, exp) => sum + (exp.amount || 0), 0);
                            const customerTotal = categoryExpenses.filter(exp => exp.isCustomerExpense).reduce((sum, exp) => sum + (exp.amount || 0), 0);
                            const grandTotal = regularTotal + customerTotal;
                            return `₹${grandTotal.toLocaleString()}`;
                          })()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Category Modal */}
      <Modal open={!!editCat} onClose={() => setEditCat(null)}>
        {editCat && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4 text-blue-700">Edit Category</h2>
            <input
              className="border rounded-lg px-3 py-2 w-full mb-4"
              value={editCatName}
              onChange={e => setEditCatName(e.target.value)}
            />
            <div className="flex gap-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold" onClick={handleEditCategory}>Save</button>
              <button className="bg-gray-300 px-4 py-2 rounded-lg font-semibold" onClick={() => setEditCat(null)}>Cancel</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add New Entry Modal */}
      <Modal open={showAddEntryModal} onClose={() => setShowAddEntryModal(false)}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 mx-auto" style={{ width: '600px', maxWidth: '90vw' }}>
          <h2 className="text-xl font-bold mb-4 text-blue-700">Add New Entry</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Category</label>
              <input
                className="border rounded-lg px-3 py-2 w-full bg-gray-100"
                value={newEntry.category}
                onChange={e => setNewEntry({...newEntry, category: e.target.value})}
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Date</label>
              <input
                type="date"
                className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={newEntry.date}
                onChange={e => setNewEntry({...newEntry, date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter amount"
                value={newEntry.amount}
                onChange={e => setNewEntry({...newEntry, amount: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Description</label>
              <textarea
                className="border rounded-lg px-3 py-2 w-full h-16 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter description"
                value={newEntry.description}
                onChange={e => setNewEntry({...newEntry, description: e.target.value})}
              />
            </div>
          </div>
          <div className="flex gap-4 mt-6">
            <button 
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold flex-1 hover:bg-green-700 transition-colors" 
              onClick={handleAddEntry}
            >
              Add Entry
            </button>
            <button 
              className="bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold flex-1 hover:bg-gray-500 transition-colors" 
              onClick={() => setShowAddEntryModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Employee Details Modal */}
      <Modal open={customerDetailsModalOpen} onClose={() => setCustomerDetailsModalOpen(false)}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 mx-auto" style={{ width: '700px', maxWidth: '90vw' }}>
          <h2 className="text-xl font-bold mb-4 text-blue-700">
            Employee Details - {selectedCustomerExpenses?.category}
          </h2>
          <p className="text-gray-600 mb-4">
            Date: {selectedCustomerExpenses?.date ? new Date(selectedCustomerExpenses.date).toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : ''}
          </p>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-blue-50">
                <tr>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Employee Name</th>
                  <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-700">Amount (₹)</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {selectedCustomerExpenses?.customers && selectedCustomerExpenses.customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 font-medium">
                      {customer.name}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-right font-medium">
                      ₹{customer.amount.toLocaleString()}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this employee expense?')) {
                              // Handle delete functionality for employee expenses
                              axios.delete(`/api/customer-expenses/${customer.id}`)
                                .then(() => {
                                  setReload(prev => !prev);
                                  setCustomerDetailsModalOpen(false);
                                })
                                .catch(err => console.error('Error deleting employee expense:', err));
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-green-50">
                <tr>
                  <td className="border border-gray-300 px-4 py-3 font-bold text-gray-700">
                    Total:
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-right font-bold text-green-600">
                    ₹{selectedCustomerExpenses?.totalAmount ? selectedCustomerExpenses.totalAmount.toLocaleString() : 0}
                  </td>
                  <td className="border border-gray-300 px-4 py-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              className="bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
              onClick={() => setCustomerDetailsModalOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Employee Expense Modal */}
      <Modal open={showEmployeeExpenseModal} onClose={() => setShowEmployeeExpenseModal(false)}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 mx-auto" style={{ width: '600px', maxWidth: '90vw' }}>
          <h2 className="text-xl font-bold mb-4 text-blue-700">Add Employee Expense</h2>
          <form onSubmit={handleAddEmployeeExpense}>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Employee Name</label>
                <input
                  type="text"
                  name="customerName"
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={employeeExpenseForm.customerName}
                  onChange={handleEmployeeExpenseInputChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Date</label>
                <input
                  type="date"
                  name="date"
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={employeeExpenseForm.date}
                  onChange={handleEmployeeExpenseInputChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Category</label>
                <select
                  name="category"
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={employeeExpenseForm.category}
                  onChange={handleEmployeeExpenseInputChange}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.filter(cat => cat !== 'Total' && cat !== 'Indirect Exp').map(category => (
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
                  value={employeeExpenseForm.amount}
                  onChange={handleEmployeeExpenseInputChange}
                  required
                />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold flex-1 hover:bg-green-700 transition-colors"
              >
                Add Employee Expense
              </button>
              <button
                type="button"
                className="bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold flex-1 hover:bg-gray-500 transition-colors"
                onClick={() => setShowEmployeeExpenseModal(false)}
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