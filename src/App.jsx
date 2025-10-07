import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
function CategoryPage(props) {
  const { categoryName } = useParams();
  return <MainContent {...props} selectedCategory={decodeURIComponent(categoryName)} />;
}
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import BranchPage from './components/BranchPage';
import BranchesListPage from './components/BranchesListPage';
import CategoryManager from './components/CategoryManager';
import ExpenseTable from './components/ExpenseTable';
import ExpenseForm from './components/ExpenseForm';
import Modal from './components/Modal';
import ExpenseEditModal from './components/ExpenseEditModal';
import DailyTotals from './components/DailyTotals';
import axios from 'axios';



const months = [
  'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'
];

// Table for daily totals by category
function CategoryDailyTotals({ categories, selectedMonth, expenses }) {
  // Use expenses prop directly instead of fetching from backend
  // Group by day and category
  const grouped = {};
  expenses.forEach(exp => {
    if (!exp.date || !exp.amount || !exp.category) return;
    const day = new Date(exp.date).toISOString().slice(0, 10);
    if (!grouped[day]) grouped[day] = { total: 0 };
    categories.forEach(cat => {
      if (grouped[day][cat] === undefined) grouped[day][cat] = 0;
    });
    const matchedCat = categories.find(c => c.toLowerCase() === exp.category.toLowerCase());
    if (matchedCat) {
      grouped[day][matchedCat] += exp.amount;
      grouped[day].total += exp.amount;
    }
  });

  const days = Object.keys(grouped).sort();
  const hasExpenses = expenses && expenses.length > 0;

  return (
    <main className="flex-1 p-8 ml-56">
      <div className="bg-white rounded-2xl shadow p-3 flex items-center gap-6 mb-6 border border-gray-200 min-h-[48px]">
  <h1 className="text-base font-normal text-gray-500">{selectedCategory}</h1>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-600">Month</label>
          <select
            className="border rounded-lg px-3 py-2 focus:outline-blue-400 text-lg"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
          >
            {months.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div className="flex-1" />
        {selectedCategory !== 'Total' && (
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-blue-700"
            onClick={() => setAddOpen(true)}
          >
            Add New Expense
          </button>
        )}
      </div>
      {selectedCategory === 'Total' && (
        <CategoryDailyTotals
          categories={categories.filter(cat => cat !== 'Total')}
          selectedMonth={selectedMonth}
          expenses={expenses}
        />
      )}
      {selectedCategory === 'Indirect Exp' && Array.isArray(expenses) && (
        <CategoryManager
          categories={categories}
          setCategories={setCategories}
          expenses={expenses}
          months={months}
          selectedMonth={selectedMonth}
          setReload={setReload}
        />
      )}
      {selectedCategory !== 'Total' && selectedCategory !== 'Indirect Exp' && (
        <>
          <Modal open={addOpen} onClose={() => setAddOpen(false)}>
            <ExpenseForm
              categories={categories}
              months={months}
              defaultCategory={selectedCategory}
              defaultMonth={selectedMonth}
              onAdded={() => {
                setReload(r => !r);
                setAddOpen(false);
              }}
            />
          </Modal>
          <ExpenseTable
            expenses={expenses}
            onDelete={exp => {
              if (window.confirm('Delete this expense?')) {
                axios.delete(`/api/expenses/${exp._id}`)
                  .then(() => setReload(r => !r));
              }
            }}
            onEdit={exp => {
              setEditExpense(exp);
              setEditOpen(true);
            }}
          />
          <ExpenseEditModal
            expense={editExpense}
            open={editOpen}
            onClose={() => setEditOpen(false)}
            onSave={updated => {
              axios.put(`/api/expenses/${updated._id}`, { amount: updated.amount })
                .then(() => {
                  setEditOpen(false);
                  setReload(r => !r);
                });
            }}
          />
        </>
      )}
    </main>
  );
}


function CategoryManager({ categories, setCategories, expenses, months, selectedMonth, setReload }) {
  const [showAllDays, setShowAllDays] = useState(false);
  const [catModal, setCatModal] = useState(null);
  const [editCat, setEditCat] = useState(null);
  const [newCat, setNewCat] = useState('');
  const [editCatName, setEditCatName] = useState('');
  const [showTotalModal, setShowTotalModal] = useState(false);
  const [totalMonth, setTotalMonth] = useState(months[0]);
  const [totalDate, setTotalDate] = useState('');
  const [totalAmount, setTotalAmount] = useState(null);

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
  return (
    <>
      <div>
        <div className="flex gap-4 mb-6 items-center">
          <input
            className="border rounded-lg px-3 py-2"
            placeholder="New category name"
            value={newCat}
            onChange={e => setNewCat(e.target.value)}
          />
          <button
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-green-700"
            onClick={handleAddCategory}
          >
            Add Category
          </button>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-blue-700"
            onClick={() => setShowTotalModal(true)}
          >
            Total
          </button>
        </div>
        <div className="space-y-4">
          {categories.map(cat => (
            <div key={cat} className="bg-white rounded shadow p-4 flex items-center justify-between">
              <div className="flex-1 cursor-pointer" onClick={() => setCatModal(cat)}>
                <h2 className="text-lg font-bold mb-2">{cat}</h2>
                <div className="text-gray-500 text-sm">{expenses.find(e => e.cat === cat)?.data.length || 0} entries</div>
              </div>
              <div className="flex gap-2">
                <button title="Edit" className="p-2" onClick={() => { setEditCat(cat); setEditCatName(cat); }}>
                  {/* Pencil icon, more visually appealing */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 hover:text-blue-800" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.414 2.586a2 2 0 00-2.828 0l-9.5 9.5A2 2 0 004 14.5V17a1 1 0 001 1h2.5a2 2 0 001.414-.586l9.5-9.5a2 2 0 000-2.828l-2-2zM5 16v-1.5a.5.5 0 01.146-.354l9.5-9.5a.5.5 0 01.708.708l-9.5 9.5A.5.5 0 015 16z" />
                  </svg>
                </button>
                <button title="Delete" className="p-2" onClick={() => handleDeleteCategory(cat)}>
                  {/* Trash bin icon for delete */}
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
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-6xl mx-auto" style={{ minHeight: '70vh' }}>
          <div className="flex justify-end mb-4">
            <label className="flex items-center gap-2 text-blue-700 font-semibold cursor-pointer">
              <input type="checkbox" checked={showAllDays} onChange={e => setShowAllDays(e.target.checked)} />
              Show all days of month
            </label>
          </div>
          <h2 className="text-2xl font-bold mb-6 text-blue-700 tracking-wide">Total by Category</h2>
          <div className="mb-8 flex gap-8 w-full justify-center">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Month</label>
              <select
                className="border-2 border-blue-200 rounded-xl px-4 py-2 w-40 focus:outline-blue-400 text-lg bg-gray-50"
                value={totalMonth}
                onChange={e => setTotalMonth(e.target.value)}
              >
                {months.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Date</label>
              <input
                type="date"
                className="border-2 border-blue-200 rounded-xl px-4 py-2 w-40 focus:outline-blue-400 text-lg bg-gray-50"
                value={totalDate}
                onChange={e => setTotalDate(e.target.value)}
              />
            </div>
            <button
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-8 py-2 rounded-xl font-bold shadow hover:from-blue-600 hover:to-blue-800 transition-all duration-200 self-end mt-6"
              onClick={() => {
                // If expenses is an array of {cat, data}, aggregate from there
                if (Array.isArray(expenses) && expenses.length && expenses[0].cat && expenses[0].data) {
                  const catTotals = {};
                  categories.filter(cat => cat !== 'Total').forEach(cat => { catTotals[cat] = 0; });
                  expenses.forEach(({ cat, data }) => {
                    if (!catTotals.hasOwnProperty(cat)) return;
                    let filtered = data;
                    if (totalMonth) {
                      filtered = filtered.filter(exp => exp.month === totalMonth);
                    }
                    if (totalDate) {
                      filtered = filtered.filter(exp => exp.date && new Date(exp.date).toISOString().slice(0,10) === totalDate);
                    }
                    catTotals[cat] += filtered.reduce((acc, exp) => acc + (exp.amount || 0), 0);
                  });
                  setTotalAmount(catTotals);
                  return;
                }
                // Otherwise, fallback to API
                (async () => {
                  let url = `/api/expenses/all/${totalMonth}`;
                  try {
                    const res = await axios.get(url);
                    let filtered = res.data;
                    if (totalDate) {
                      filtered = filtered.filter(exp => exp.date && new Date(exp.date).toISOString().slice(0,10) === totalDate);
                    }
                    const catTotals = {};
                    categories.filter(cat => cat !== 'Total').forEach(cat => { catTotals[cat] = 0; });
                    filtered.forEach(exp => {
                      const cat = categories.find(c => c.toLowerCase() === exp.category.toLowerCase());
                      if (cat) catTotals[cat] += exp.amount || 0;
                    });
                    setTotalAmount(catTotals);
                  } catch {
                    setTotalAmount({});
                  }
                })();
              }}
            >Show Table</button>
          </div>
          {showAllDays && totalMonth && (
            <AllDaysTable
              categories={categories.filter(cat => cat !== 'Total')}
              month={totalMonth}
              expenses={expenses}
            />
          )}
          {!showAllDays && totalAmount && typeof totalAmount === 'object' && Object.keys(totalAmount).length > 0 && (
            <div className="overflow-x-auto w-full mt-6">
              <table className="min-w-full border border-blue-200 rounded-xl shadow">
                <thead className="bg-blue-50">
                  <tr>
                    {categories.filter(cat => cat !== 'Total').map(cat => (
                      <th key={cat} className="border px-4 py-2 text-blue-700 font-semibold text-base">{cat}</th>
                    ))}
                    <th className="border px-4 py-2 bg-blue-100 text-blue-900 font-bold text-base">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white hover:bg-blue-50">
                    {categories.filter(cat => cat !== 'Total').map(cat => (
                      <td key={cat} className="border px-4 py-2 text-right text-gray-800 font-medium">{totalAmount[cat]?.toFixed(2) || '0.00'}</td>
                    ))}
                    <td className="border px-4 py-2 text-right font-bold bg-blue-100 text-blue-900">{Object.values(totalAmount).reduce((a,b)=>a+b,0).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          {/* AllDaysTable is defined below, outside JSX */}
        </div>
      </Modal>
    </>
  );
}

// Table for all days of the month with category totals
function AllDaysTable({ categories, month, expenses }) {
  let allExpenses = [];
  if (Array.isArray(expenses) && expenses.length && expenses[0].cat && expenses[0].data) {
    expenses.forEach(({ data }) => {
      allExpenses = allExpenses.concat(data.filter(exp => exp.month === month));
    });
  }
  const grouped = {};
  allExpenses.forEach(exp => {
    if (!exp.date || !exp.amount || !exp.category) return;
    const day = new Date(exp.date).toISOString().slice(0, 10);
    if (!grouped[day]) grouped[day] = { total: 0 };
    categories.forEach(cat => {
      if (grouped[day][cat] === undefined) grouped[day][cat] = 0;
    });
    const matchedCat = categories.find(c => c.toLowerCase() === exp.category.toLowerCase());
    if (matchedCat) {
      grouped[day][matchedCat] += exp.amount;
      grouped[day].total += exp.amount;
    }
  });
  const days = Object.keys(grouped).sort();
  const hasExpenses = allExpenses && allExpenses.length > 0;
  return (
    <div className="overflow-x-auto w-full mt-6">
      <table className="min-w-full border border-blue-200 rounded-xl shadow">
        <thead className="bg-blue-50">
          <tr>
            <th className="border px-4 py-2 text-blue-700 font-semibold text-base">Date</th>
            {categories.map(cat => (
              <th key={cat} className="border px-4 py-2 text-blue-700 font-semibold text-base">{cat}</th>
            ))}
            <th className="border px-4 py-2 bg-blue-100 text-blue-900 font-bold text-base">Total</th>
          </tr>
        </thead>
        <tbody>
          {!hasExpenses ? (
            <tr><td colSpan={categories.length + 2} className="text-center py-4">No data found</td></tr>
          ) : (
            days.map(day => (
              <tr key={day} className="bg-white hover:bg-blue-50">
                <td className="border px-4 py-2 text-right text-gray-800 font-semibold">{day}</td>
                {categories.map(cat => (
                  <td key={cat} className="border px-4 py-2 text-right text-gray-800 font-medium">{grouped[day][cat]?.toFixed(2) || '0.00'}</td>
                ))}
                <td className="border px-4 py-2 text-right font-bold bg-blue-100 text-blue-900">{grouped[day].total ? grouped[day].total.toFixed(2) : '0.00'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}


export default function App() {
  const [categories, setCategories] = useState([
    'Petrol', 'Other Exp.', 'Hotel Exp', 'Office Exp.', 'Vehicle Maint.',
    'Commission', 'Office Rent', 'Telephone Exp.', 'Stationery', 'Bank',
    'Personal Exp.', 'House Exp.', 'Recvd. Cash', 'Vargani', 'Salary', 'Professional Fees', 'Total'
  ]);
  const [selectedCategory, setSelectedCategory] = useState('Indirect Exp');
  const [selectedMonth, setSelectedMonth] = useState(months[0]);
  const [expenses, setExpenses] = useState([]);
  const [reload, setReload] = useState(false);
  const [dailyTotals, setDailyTotals] = useState([]);
  const [editExpense, setEditExpense] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    axios.get('/api/branches')
      .then(res => setBranches(res.data.map(b => b.name)))
      .catch(() => setBranches([]));
  }, []);

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar categories={categories} selected={selectedCategory} onSelect={setSelectedCategory} branches={branches} />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={
              <MainContent
                categories={categories}
                setCategories={setCategories}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                expenses={expenses}
                setExpenses={setExpenses}
                reload={reload}
                setReload={setReload}
                dailyTotals={dailyTotals}
                setDailyTotals={setDailyTotals}
                editExpense={editExpense}
                setEditExpense={setEditExpense}
                editOpen={editOpen}
                setEditOpen={setEditOpen}
                branches={branches}
                setBranches={setBranches}
                months={months}
              />
            } />
            <Route path="/branches" element={
              <BranchesListPage branches={branches} setBranches={setBranches} />
            } />
            <Route path="/branches/:branchId" element={<BranchPage />} />
            <Route path="/indirect" element={
              <CategoryManager
                categories={categories}
                setCategories={setCategories}
                expenses={expenses}
                months={months}
                selectedMonth={selectedMonth}
                setReload={setReload}
              />
            } />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

