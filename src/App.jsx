import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MainContent from './components/MainContent';
import BranchPage from './components/BranchPage';
import BranchesListPage from './components/BranchesListPage';
import CategoryManager from './components/CategoryManager';
import CustomerExpensesPage from './components/CustomerExpensesPage';
import EmployeeMasterPage from './components/EmployeeMasterPage';
import LoansToCustomerPage from './components/LoansToCustomerPage';

const months = [
  'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'
];

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

  // Test API connection and load initial data on startup
  useEffect(() => {
    axios.get('/api/test')
      .then(res => {
        if (res.data.status === 'Database connected') {
          setReload(prev => !prev);
        }
      })
      .catch(err => {
        console.error('Backend Test - Error:', err.message);
      });
  }, []);

  // Load expenses data
  useEffect(() => {
    const loadExpenses = async () => {
      try {
        const allResponse = await axios.get('/api/expenses/all');
        
        if (allResponse.data && allResponse.data.length >= 0) {
          setExpenses(allResponse.data);
        } else {
          setExpenses([]);
        }
      } catch (err) {
        console.error('Error loading expenses:', err);
        setExpenses([]);
      }
    };

    loadExpenses();
  }, [reload]);

  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}
