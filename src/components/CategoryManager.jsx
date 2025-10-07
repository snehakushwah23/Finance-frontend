import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from './Modal';
import ExpenseTable from './ExpenseTable';

export default function CategoryManager({ categories, setCategories, expenses, months, selectedMonth, setReload }) {
  const [showAllDays, setShowAllDays] = useState(false);
  const [catModal, setCatModal] = useState(null);
  const [editCat, setEditCat] = useState(null);
  const [newCat, setNewCat] = useState('');
  const [editCatName, setEditCatName] = useState('');
  const [showTotalModal, setShowTotalModal] = useState(false);
  const [totalMonth, setTotalMonth] = useState(months[0]);
  const [totalDate, setTotalDate] = useState('');
  const [totalAmount, setTotalAmount] = useState(null);
  const [categoryEntries, setCategoryEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [countsByCategory, setCountsByCategory] = useState({});
  const [sumsByCategory, setSumsByCategory] = useState({});
  const [grandTotalSum, setGrandTotalSum] = useState(0);
  const [totalsCategory, setTotalsCategory] = useState('');
  const [totalsDate, setTotalsDate] = useState('');
  const [totalsExpenses, setTotalsExpenses] = useState([]);
  const [totalsLoading, setTotalsLoading] = useState(false);
  const [totalsMonth, setTotalsMonth] = useState('');

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

  // Load counts and sums per category from customer expenses
  useEffect(() => {
    const loadCounts = async () => {
      try {
        const res = await axios.get('/api/customer-expenses');
        const map = {};
        const sumMap = {};
        let grand = 0;
        (res.data || []).forEach(e => {
          if (!e.category) return;
          map[e.category] = (map[e.category] || 0) + 1;
          const amt = Number(e.amount || 0);
          sumMap[e.category] = (sumMap[e.category] || 0) + amt;
          grand += amt;
        });
        setCountsByCategory(map);
        setSumsByCategory(sumMap);
        setGrandTotalSum(grand);
      } catch (e) {
        setCountsByCategory({});
        setSumsByCategory({});
        setGrandTotalSum(0);
      }
    };
    loadCounts();
  }, []);

  // Load all expenses when totals modal opens
  useEffect(() => {
    const loadTotalsData = async () => {
      if (!showTotalModal) return;
      try {
        setTotalsLoading(true);
        const res = await axios.get('/api/customer-expenses');
        setTotalsExpenses(res.data || []);
      } catch (e) {
        setTotalsExpenses([]);
      } finally {
        setTotalsLoading(false);
      }
    };
    loadTotalsData();
  }, [showTotalModal]);

  // Load entries for selected category from employee/customer expenses
  useEffect(() => {
    const load = async () => {
      if (!catModal) return;
      try {
        setLoadingEntries(true);
        const res = await axios.get('/api/customer-expenses');
        const filtered = (res.data || []).filter(e => e.category === catModal);
        setCategoryEntries(filtered);
      } catch (e) {
        setCategoryEntries([]);
      } finally {
        setLoadingEntries(false);
      }
    };
    load();
  }, [catModal]);
  return (
    <>
      <div className="flex-1 p-8 ml-56">
        <div className="bg-white rounded-2xl shadow p-6 mb-6 border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Category Manager</h1>
          <div className="flex gap-3 items-center">
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
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-blue-700"
            onClick={() => setShowTotalModal(true)}
          >
              View Totals
          </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          {categories
            .filter(c => c !== 'Total' && c !== 'Indirect Exp')
            .map(cat => (
              <div
                key={cat}
                className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:shadow-md transition flex items-center justify-between"
              >
              <div className="flex-1 cursor-pointer" onClick={() => setCatModal(cat)}>
                  <h2 className="text-base font-semibold mb-1.5 text-gray-800">{cat}</h2>
                  <div className="text-gray-500 text-xs">{countsByCategory[cat] || 0} entries</div>
              </div>
              <div className="flex gap-2">
                  <button title="View" className="p-2" onClick={() => setCatModal(cat)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 hover:text-blue-800" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      <circle cx="12" cy="12" r="3" strokeWidth="2" />
                    </svg>
                  </button>
                <button title="Edit" className="p-2" onClick={() => { setEditCat(cat); setEditCatName(cat); }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 hover:text-blue-800" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.414 2.586a2 2 0 00-2.828 0l-9.5 9.5A2 2 0 004 14.5V17a1 1 0 001 1h2.5a2 2 0 001.414-.586l9.5-9.5a2 2 0 000-2.828l-2-2zM5 16v-1.5a.5.5 0 01.146-.354l9.5-9.5a.5.5 0 01.708.708l-9.5 9.5A.5.5 0 015 16z" />
                  </svg>
                </button>
                <button title="Delete" className="p-2" onClick={() => handleDeleteCategory(cat)}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600 hover:text-red-800" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8zM4 6a1 1 0 011-1h10a1 1 0 011 1v1H4V6zm2-3a1 1 0 011-1h6a1 1 0 011 1v1H6V3zm9 2V6a2 2 0 01-2 2v7a2 2 0 01-2 2H7a2 2 0 01-2-2V8a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Modal open={showTotalModal} onClose={() => setShowTotalModal(false)}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-[80vw] max-w-[1200px] h-[85vh] overflow-hidden mx-auto">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Category Totals</h2>

          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-2 text-gray-700">Filter by Category</label>
              <select
                className="border rounded-lg px-3 py-2 w-full"
                value={totalsCategory}
                onChange={e => setTotalsCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.filter(c => c !== 'Indirect Exp' && c !== 'Total').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-2 text-gray-700">Filter by Date</label>
              <input
                type="date"
                className="border rounded-lg px-3 py-2 w-full"
                value={totalsDate}
                onChange={e => setTotalsDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-2 text-gray-700">Filter by Month</label>
              <select
                className="border rounded-lg px-3 py-2 w-full"
                value={totalsMonth}
                onChange={e => setTotalsMonth(e.target.value)}
              >
                <option value="">All Months</option>
                {months.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold"
                onClick={() => { setTotalsCategory(''); setTotalsDate(''); setTotalsMonth(''); }}
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Summary cards based on filters */}
          {(() => {
            const filtered = totalsExpenses.filter(e => {
              if (totalsCategory && e.category !== totalsCategory) return false;
              if (totalsDate) {
                const d = new Date(e.date).toISOString().split('T')[0];
                if (d !== totalsDate) return false;
              }
              if (totalsMonth) {
                const monthName = new Date(e.date).toLocaleString('en-IN', { month: 'long' });
                if (monthName !== totalsMonth) return false;
              }
              return true;
            });
            const totalAmt = filtered.reduce((s, e) => s + Number(e.amount || 0), 0);
            return (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-600">Total Entries</h3>
                  <p className="text-2xl font-bold text-blue-900">{filtered.length}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-purple-600">Selected Category</h3>
                  <p className="text-lg font-semibold text-purple-900">{totalsCategory || 'All'}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-orange-600">Total Amount</h3>
                  <p className="text-2xl font-bold text-orange-900">₹{totalAmt.toLocaleString()}</p>
                </div>
              </div>
            );
          })()}

          {/* Details table */}
          {totalsLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : (
            <div className="overflow-x-auto border rounded-lg h-[60vh] overflow-y-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-200 px-4 py-3 text-left text-gray-700">Date</th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-gray-700">Customer</th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-gray-700">Category</th>
                    <th className="border border-gray-200 px-4 py-3 text-right text-gray-700">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {totalsExpenses.filter(e => {
                    if (totalsCategory && e.category !== totalsCategory) return false;
                    if (totalsDate) {
                      const d = new Date(e.date).toISOString().split('T')[0];
                      if (d !== totalsDate) return false;
                    }
                    if (totalsMonth) {
                      const monthName = new Date(e.date).toLocaleString('en-IN', { month: 'long' });
                      if (monthName !== totalsMonth) return false;
                    }
                    return true;
                  }).map(e => (
                    <tr key={e._id} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-4 py-3">{new Date(e.date).toLocaleDateString('en-IN')}</td>
                      <td className="border border-gray-200 px-4 py-3">{e.customerName}</td>
                      <td className="border border-gray-200 px-4 py-3">{e.category}</td>
                      <td className="border border-gray-200 px-4 py-3 text-right">₹{Number(e.amount).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <button className="bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold" onClick={() => setShowTotalModal(false)}>Close</button>
          </div>
        </div>
      </Modal>
      <Modal open={!!catModal} onClose={() => setCatModal(null)}>
        {catModal && (
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-[80vw] max-w-[1200px] h-[85vh] overflow-hidden mx-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Category Details - <span className="text-blue-700">{catModal}</span></h2>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-600">Total Entries</h3>
                <p className="text-2xl font-bold text-blue-900">{categoryEntries.length}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-600">Regular Expenses</h3>
                <p className="text-2xl font-bold text-green-900">0</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-purple-600">Customer Expenses</h3>
                <p className="text-2xl font-bold text-purple-900">{categoryEntries.length}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-orange-600">Grand Total</h3>
                <p className="text-2xl font-bold text-orange-900">₹{categoryEntries.reduce((s, e) => s + Number(e.amount || 0), 0).toLocaleString()}</p>
              </div>
            </div>

            {loadingEntries ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : (
              <div>
                <div className="text-sm font-semibold text-blue-700 mb-2">All Expenses</div>
                <div className="overflow-x-auto overflow-y-auto border rounded-lg h-[65vh]">
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="border border-gray-200 px-4 py-3 text-left text-gray-700">Type</th>
                        <th className="border border-gray-200 px-4 py-3 text-left text-gray-700">Date</th>
                        <th className="border border-gray-200 px-4 py-3 text-left text-gray-700">Description/Customer</th>
                        <th className="border border-gray-200 px-4 py-3 text-right text-gray-700">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryEntries.length === 0 ? (
                        <tr><td colSpan="4" className="text-center py-6 text-gray-500">No entries</td></tr>
                      ) : categoryEntries.map((e) => (
                        <tr key={e._id} className="hover:bg-gray-50">
                          <td className="border border-gray-200 px-4 py-3">
                            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold">Customer</span>
                          </td>
                          <td className="border border-gray-200 px-4 py-3">{new Date(e.date).toLocaleDateString('en-IN')}</td>
                          <td className="border border-gray-200 px-4 py-3">{e.customerName || '-'}</td>
                          <td className="border border-gray-200 px-4 py-3 text-right">₹{Number(e.amount).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button className="bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold" onClick={() => setCatModal(null)}>Close</button>
            </div>
          </div>
        )}
      </Modal>
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
    </>
  );
}
