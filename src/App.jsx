import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useParams, Navigate } from 'react-router-dom';
import { api } from './config/api';
function CategoryPage(props) {
  const { categoryName } = useParams();
  return <MainContent {...props} selectedCategory={decodeURIComponent(categoryName)} />;
}
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MainContent from './components/MainContent';
import BranchPage from './components/BranchPage';
import BranchesListPage from './components/BranchesListPage';
import CategoryManager from './components/CategoryManager';
import ExpenseTable from './components/ExpenseTable';
import ExpenseForm from './components/ExpenseForm';
import Modal from './components/Modal';
import ExpenseEditModal from './components/ExpenseEditModal';
import DailyTotals from './components/DailyTotals';
import CustomerExpensesPage from './components/CustomerExpensesPage';
import EmployeeMasterPage from './components/EmployeeMasterPage';
import LoansToCustomerPage from './components/LoansToCustomerPage';
import Login from './components/Login';
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
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });

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
    axios.get(api.get('/api/branches'))
      .then(res => setBranches(res.data.map(b => b.name)))
      .catch(() => setBranches([]));
  }, []);

  // Test API connection and load initial data on startup
  useEffect(() => {
    // First test basic backend connection
    axios.get(api.get('/api/test'))
      .then(res => {
        // If backend is working, trigger initial load by toggling reload
        if (res.data.status === 'Database connected') {
          setReload(prev => !prev);
        }
      })
      .catch(err => {
        console.error('Backend Test - Error:', err.message);
        console.error('Backend Test - Error details:', err.response?.data || err.message);
        console.error('Backend Test - Error status:', err.response?.status);
      });
  }, []);

  // Load expenses data - Combined single effect
  useEffect(() => {
    const loadExpenses = async () => {
      try {
        // Load all expenses from API
        const allResponse = await axios.get(api.get('/api/expenses/all'));
        
        if (allResponse.data && allResponse.data.length >= 0) {
          setExpenses(allResponse.data);
        } else {
          setExpenses([]);
        }
      } catch (err) {
        console.error('Error loading expenses:', err);
        console.error('Error details:', err.response?.data || err.message);
        console.error('Error status:', err.response?.status);
        setExpenses([]);
      }
    };

    loadExpenses();
  }, [reload]); // Only depend on reload, not selectedMonth


  // Protected Route component
  const ProtectedRoute = ({ children }) => {
    if (!isLoggedIn) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Login Route */}
        <Route 
          path="/login" 
          element={
            isLoggedIn ? 
            <Navigate to="/" replace /> : 
            <Login onLogin={() => setIsLoggedIn(true)} />
          } 
        />

        {/* Protected Routes */}
        <Route path="*" element={
          <ProtectedRoute>
            <div className="flex min-h-screen bg-gray-100">
              <Sidebar categories={categories} selected={selectedCategory} onSelect={setSelectedCategory} branches={branches} />
              <Header />
              <div className="flex-1 pt-16">
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
                  <Route path="/branches/loans" element={
                    <div className="flex min-h-screen bg-gray-100">
                      <Sidebar categories={categories} selected="Branches" onSelect={setSelectedCategory} branches={branches} />
                      <LoansToCustomerPage branches={branches} />
                    </div>
                  } />
                  <Route path="/indirect" element={
                    <div className="flex min-h-screen bg-gray-100">
                      <Sidebar categories={categories} selected="Indirect Exp" onSelect={setSelectedCategory} branches={branches} />
                      <CategoryManager
                        categories={categories}
                        setCategories={setCategories}
                        expenses={expenses}
                        months={months}
                        selectedMonth={selectedMonth}
                        setReload={setReload}
                      />
                    </div>
                  } />
                  <Route path="/customer-expenses" element={
                    <div className="flex min-h-screen bg-gray-100">
                      <Sidebar categories={categories} selected="Indirect Exp" onSelect={setSelectedCategory} branches={branches} />
                      <CustomerExpensesPage categories={categories} />
                    </div>
                  } />
                  <Route path="/employee-master" element={
                    <div className="flex min-h-screen bg-gray-100">
                      <Sidebar categories={categories} selected="Indirect Exp" onSelect={setSelectedCategory} branches={branches} />
                      <EmployeeMasterPage categories={categories} />
                    </div>
                  } />
                </Routes>
              </div>
            </div>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

