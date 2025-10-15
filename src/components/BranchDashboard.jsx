import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { api } from '../config/api';
import Modal from './Modal';
import BranchSidebar from './BranchSidebar';

export default function BranchDashboard() {
  const { branchName } = useParams();
  const navigate = useNavigate();
  const [selectedView, setSelectedView] = useState('dashboard');
  const [branchData, setBranchData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentEntry, setPaymentEntry] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsMode, setDetailsMode] = useState('full'); // 'full' | 'paymentsOnly'
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerPayments, setCustomerPayments] = useState([]);
  const [branchExpenses, setBranchExpenses] = useState([]);
  const [expenseForm, setExpenseForm] = useState({ date: new Date().toISOString().split('T')[0], month: '', category: '', amount: '', description: '' });
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [employeeForm, setEmployeeForm] = useState({ name: '', mobile: '', designation: '', department: '', joiningDate: '', salary: '' });
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [employeeDeptFilter, setEmployeeDeptFilter] = useState('');
  const [employeeDesigFilter, setEmployeeDesigFilter] = useState('');
  // Category master list (derived + manually addable)
  const DEFAULT_CATEGORIES = [
    'Petrol',
    'Other Exp.',
    'Hotel Exp',
    'Office Exp.',
    'Vehicle Maint.',
    'Commission',
    'Office Rent',
    'Telephone Exp.',
    'Stationery',
    'Bank',
    'Personal Exp.',
    'House Exp.',
    'Recvd. Cash',
    'Vargani',
    'Salary',
    'Professional Fees'
  ];
  const [categoryMasterCategories, setCategoryMasterCategories] = useState(DEFAULT_CATEGORIES);
  const [masterCategoryDetail, setMasterCategoryDetail] = useState(null);
  const [showCatEmpTotals, setShowCatEmpTotals] = useState(false);
  const [totalsCategory, setTotalsCategory] = useState('All');
  const [totalsMonth, setTotalsMonth] = useState('');
  const [totalsDate, setTotalsDate] = useState('');
  const [totalsViewMode, setTotalsViewMode] = useState('Single Date');
  const [showEmpTotalsResult, setShowEmpTotalsResult] = useState(false);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  // Employee expenses (per-branch)
  const [branchEmployeeExpenses, setBranchEmployeeExpenses] = useState([]);
  const [filteredBranchEmployeeExpenses, setFilteredBranchEmployeeExpenses] = useState([]);
  const [empExpCategory, setEmpExpCategory] = useState('');
  const [empExpDate, setEmpExpDate] = useState('');
  const [empExpAddOpen, setEmpExpAddOpen] = useState(false);
  const [empExpEditOpen, setEmpExpEditOpen] = useState(false);
  const [editingEmpExpense, setEditingEmpExpense] = useState(null);
  const [empExpenseForm, setEmpExpenseForm] = useState({ employeeName: '', date: new Date().toISOString().split('T')[0], amount: '', category: '' });
  const [employeeDetailOpen, setEmployeeDetailOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeEditOpen, setEmployeeEditOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [employeeEditForm, setEmployeeEditForm] = useState({ name: '', mobile: '', designation: '', department: '', joiningDate: '', salary: '' });
  const [formData, setFormData] = useState({
    date: '',
    customer: '',
    place: '',
    mobile: '',
    loan: '',
    interest: '',
    emi: ''
  });
  const [paymentData, setPaymentData] = useState({
    date: '',
    amount: '',
    customer: ''
  });

  useEffect(() => {
    // Check if branch is logged in
    const branchLoggedIn = localStorage.getItem('branchLoggedIn');
    const storedBranchName = localStorage.getItem('branchName');
    
    if (!branchLoggedIn || storedBranchName?.toLowerCase() !== branchName) {
      navigate('/branch-login');
      return;
    }
    
    loadBranchData();
  }, [branchName, navigate]);

  const loadBranchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(api.get(`/api/branch-entries/${branchName}`));
      // Filter out payments to show only loan entries
      const loanEntries = (res.data || []).filter(entry => entry.place !== 'Payment');
      const paymentEntries = (res.data || []).filter(entry => entry.place === 'Payment');
      setBranchData(loanEntries);
      setFilteredData(loanEntries);
      setAllPayments(paymentEntries);
      setFilteredPayments(paymentEntries);
    } catch (err) {
      console.error('Error loading branch data:', err);
      setBranchData([]);
      setFilteredData([]);
      setAllPayments([]);
      setFilteredPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadBranchExpenses = async () => {
    try {
      const res = await axios.get(api.get(`/api/branch-expenses/${branchName.toLowerCase()}`));
      setBranchExpenses(res.data || []);
      // derive categories whenever branch expenses fetched
      const expCats = new Set((res.data || []).map(e => e.category).filter(Boolean));
      const empCats = new Set((branchEmployeeExpenses || []).map(e => e.category).filter(Boolean));
      setCategoryMasterCategories(Array.from(new Set([...expCats, ...empCats, ...categoryMasterCategories])));
    } catch (e) {
      console.error('Error loading branch expenses:', e);
      setBranchExpenses([]);
    }
  };

  const loadBranchEmployees = async () => {
    try {
      const res = await axios.get(api.get(`/api/branch-employees/${branchName.toLowerCase()}`));
      setEmployees(res.data || []);
    } catch (e) {
      console.error('Error loading employees:', e);
      setEmployees([]);
    }
  };

  useEffect(() => {
    if (selectedView === 'expenses') {
      loadBranchExpenses();
    } else if (selectedView === 'employees') {
      loadBranchEmployees();
    } else if (selectedView === 'empExpenses') {
      loadBranchEmployees();
      loadBranchEmployeeExpenses();
    } else if (selectedView === 'categoryMaster') {
      loadBranchExpenses();
      loadBranchEmployeeExpenses();
    }
  }, [selectedView]);

  // Recompute Category Master list when data or view changes
  useEffect(() => {
    if (selectedView !== 'categoryMaster') return;
    const expCats = new Set((branchExpenses || []).map(e => e.category).filter(Boolean));
    const empCats = new Set((branchEmployeeExpenses || []).map(e => e.category).filter(Boolean));
    const merged = Array.from(new Set([
      ...DEFAULT_CATEGORIES,
      ...Array.from(expCats),
      ...Array.from(empCats),
      ...categoryMasterCategories
    ].filter(Boolean)));
    setCategoryMasterCategories(merged);
  }, [selectedView, branchExpenses, branchEmployeeExpenses]);

  // Filter employees by search
  useEffect(() => {
    const term = employeeSearch.toLowerCase();
    const dept = employeeDeptFilter.toLowerCase();
    const desig = employeeDesigFilter.toLowerCase();

    const next = (employees || []).filter(em => {
      const matchesSearch = !term ||
        em?.name?.toLowerCase().includes(term) ||
        em?.mobile?.toLowerCase?.().includes(term) ||
        em?.designation?.toLowerCase?.().includes(term) ||
        em?.department?.toLowerCase?.().includes(term);
      const matchesDept = !dept || em?.department?.toLowerCase() === dept;
      const matchesDesig = !desig || em?.designation?.toLowerCase() === desig;
      return matchesSearch && matchesDept && matchesDesig;
    });
    setFilteredEmployees(next);
  }, [employeeSearch, employees, employeeDeptFilter, employeeDesigFilter]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.category || !expenseForm.amount || !expenseForm.month || !expenseForm.date) {
      alert('Please fill category, amount, month and date');
      return;
    }
    try {
      setLoading(true);
      const payload = {
        branch: branchName.toLowerCase(),
        category: expenseForm.category,
        amount: Number(expenseForm.amount),
        month: expenseForm.month,
        description: expenseForm.description || '',
        date: expenseForm.date
      };
      await axios.post(api.post('/api/branch-expenses'), payload);
      setExpenseForm({ date: new Date().toISOString().split('T')[0], month: '', category: '', amount: '', description: '' });
      await loadBranchExpenses();
      alert('Expense added');
    } catch (err) {
      console.error('Error adding expense:', err);
      alert('Error adding expense');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      setLoading(true);
      await axios.delete(api.delete(`/api/branch-expenses/${id}`));
      await loadBranchExpenses();
    } catch (e) {
      alert('Error deleting expense');
    } finally {
      setLoading(false);
    }
  };

  // Branch Employee Expenses
  const loadBranchEmployeeExpenses = async () => {
    try {
      const res = await axios.get(api.get(`/api/employee-expenses/${branchName.toLowerCase()}`));
      // newest first
      const sorted = (res.data || []).sort((a, b) => new Date(b.date) - new Date(a.date));
      setBranchEmployeeExpenses(sorted);
      setFilteredBranchEmployeeExpenses(sorted);
      // derive categories whenever employee expenses fetched
      const expCats = new Set((branchExpenses || []).map(e => e.category).filter(Boolean));
      const empCats = new Set(sorted.map(e => e.category).filter(Boolean));
      setCategoryMasterCategories(Array.from(new Set([...expCats, ...empCats, ...categoryMasterCategories])));
    } catch (e) {
      console.error('Error loading employee expenses:', e);
      setBranchEmployeeExpenses([]);
      setFilteredBranchEmployeeExpenses([]);
    }
  };

  useEffect(() => {
    let data = branchEmployeeExpenses;
    if (empExpCategory) data = data.filter(e => e.category === empExpCategory);
    if (empExpDate) {
      const d = new Date(empExpDate).toISOString().split('T')[0];
      data = data.filter(e => new Date(e.date).toISOString().split('T')[0] === d);
    }
    setFilteredBranchEmployeeExpenses(data);
  }, [branchEmployeeExpenses, empExpCategory, empExpDate]);

  const handleEmpExpenseFormChange = (e) => {
    const { name, value } = e.target;
    setEmpExpenseForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddEmpExpense = async (e) => {
    e.preventDefault();
    if (!empExpenseForm.employeeName || !empExpenseForm.date || !empExpenseForm.amount || !empExpenseForm.category) {
      alert('Please fill all fields');
      return;
    }
    try {
      setLoading(true);
      const payload = {
        branch: branchName.toLowerCase(),
        employeeName: empExpenseForm.employeeName,
        date: empExpenseForm.date,
        amount: Number(empExpenseForm.amount),
        category: empExpenseForm.category
      };
      await axios.post(api.post('/api/employee-expenses'), payload);
      setEmpExpAddOpen(false);
      setEmpExpenseForm({ employeeName: '', date: new Date().toISOString().split('T')[0], amount: '', category: '' });
      await loadBranchEmployeeExpenses();
      alert('Employee expense added');
    } catch (err) {
      alert('Error adding employee expense');
    } finally {
      setLoading(false);
    }
  };

  const handleEditEmpExpense = (expense) => {
    setEditingEmpExpense(expense);
    setEmpExpenseForm({
      employeeName: expense.employeeName,
      date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : '',
      amount: expense.amount,
      category: expense.category
    });
    setEmpExpEditOpen(true);
  };

  const handleUpdateEmpExpense = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        branch: branchName.toLowerCase(),
        employeeName: empExpenseForm.employeeName,
        date: empExpenseForm.date,
        amount: Number(empExpenseForm.amount),
        category: empExpenseForm.category
      };
      await axios.put(api.put(`/api/employee-expenses/${editingEmpExpense._id}`), payload);
      setEmpExpEditOpen(false);
      setEditingEmpExpense(null);
      await loadBranchEmployeeExpenses();
      alert('Employee expense updated');
    } catch (err) {
      alert('Error updating employee expense');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmpExpense = async (id) => {
    if (!window.confirm('Delete this employee expense?')) return;
    try {
      setLoading(true);
      await axios.delete(api.delete(`/api/employee-expenses/${id}`));
      await loadBranchEmployeeExpenses();
    } catch (e) {
      alert('Error deleting expense');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!employeeForm.name) {
      alert('Name is required');
      return;
    }
    try {
      setLoading(true);
      const payload = {
        branch: branchName.toLowerCase(),
        name: employeeForm.name,
        mobile: employeeForm.mobile || '',
        designation: employeeForm.designation || '',
        department: employeeForm.department || '',
        joiningDate: employeeForm.joiningDate || null,
        salary: employeeForm.salary ? Number(employeeForm.salary) : undefined
      };
      await axios.post(api.post('/api/branch-employees'), payload);
      setEmployeeForm({ name: '', mobile: '', designation: '', department: '', joiningDate: '', salary: '' });
      await loadBranchEmployees();
      alert('Employee added');
    } catch (err) {
      console.error('Error adding employee:', err);
      alert('Error adding employee');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (!window.confirm('Delete this employee?')) return;
    try {
      setLoading(true);
      await axios.delete(api.delete(`/api/branch-employees/${id}`));
      await loadBranchEmployees();
    } catch (e) {
      alert('Error deleting employee');
    } finally {
      setLoading(false);
    }
  };

  const openEmployeeDetails = (employee) => {
    setSelectedEmployee(employee);
    setEmployeeDetailOpen(true);
  };

  const openEmployeeEdit = (employee) => {
    setEditingEmployee(employee);
    setEmployeeEditForm({
      name: employee?.name || '',
      mobile: employee?.mobile || '',
      designation: employee?.designation || '',
      department: employee?.department || '',
      joiningDate: employee?.joiningDate ? new Date(employee.joiningDate).toISOString().split('T')[0] : '',
      salary: employee?.salary || ''
    });
    setEmployeeEditOpen(true);
  };

  const handleEmployeeEditInput = (e) => {
    const { name, value } = e.target;
    setEmployeeEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    if (!editingEmployee?._id) return;
    try {
      setLoading(true);
      const payload = {
        branch: branchName.toLowerCase(),
        ...employeeEditForm,
        salary: employeeEditForm.salary ? Number(employeeEditForm.salary) : undefined
      };
      await axios.put(api.put(`/api/branch-employees/${editingEmployee._id}`), payload);
      setEmployeeEditOpen(false);
      setEditingEmployee(null);
      await loadBranchEmployees();
      alert('Employee updated');
    } catch (err) {
      console.error('Error updating employee:', err);
      alert('Error updating employee');
    } finally {
      setLoading(false);
    }
  };

  // Filter data when search term changes
  useEffect(() => {
    if (searchTerm) {
      const filtered = branchData.filter(entry =>
        entry.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.place?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.mobile?.includes(searchTerm) ||
        entry.loan?.toString().includes(searchTerm)
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(branchData);
    }
  }, [searchTerm, branchData]);

  // Filter payments when search term changes in payments view
  useEffect(() => {
    if (selectedView !== 'payments') return;
    if (searchTerm) {
      const filtered = allPayments.filter(entry =>
        entry.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.mobile?.includes(searchTerm) ||
        entry.loan?.toString().includes(searchTerm)
      );
      setFilteredPayments(filtered);
    } else {
      setFilteredPayments(allPayments);
    }
  }, [searchTerm, allPayments, selectedView]);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('branchLoggedIn');
      localStorage.removeItem('branchName');
      localStorage.removeItem('branchLoginTime');
      navigate('/branch-login');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    
    if (!formData.date || !formData.customer || !formData.place || !formData.mobile || !formData.loan) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        branch: branchName.toLowerCase(),
        customer: formData.customer,
        place: formData.place,
        mobile: formData.mobile,
        loan: formData.loan,
        interest: formData.interest || '0',
        emi: formData.emi || '0',
        date: formData.date
      };
      
      await axios.post(api.post('/api/branch-entries'), payload);
      setAddModalOpen(false);
      setFormData({ date: '', customer: '', place: '', mobile: '', loan: '', interest: '', emi: '' });
      await loadBranchData();
      alert('Entry added successfully');
    } catch (error) {
      console.error('Error adding entry:', error);
      alert('Error adding entry');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      date: entry.date ? new Date(entry.date).toISOString().split('T')[0] : '',
      customer: entry.customer || '',
      place: entry.place || '',
      mobile: entry.mobile || '',
      loan: entry.loan || '',
      interest: entry.interest || '',
      emi: entry.emi || ''
    });
    setEditModalOpen(true);
  };

  const handleUpdateEntry = async (e) => {
    e.preventDefault();
    
    if (!formData.date || !formData.customer || !formData.place || !formData.mobile || !formData.loan) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        branch: branchName.toLowerCase(),
        customer: formData.customer,
        place: formData.place,
        mobile: formData.mobile,
        loan: formData.loan,
        interest: formData.interest || '0',
        emi: formData.emi || '0',
        date: formData.date
      };
      
      await axios.put(api.put(`/api/branch-entries/${editingEntry._id}`), payload);
      setEditModalOpen(false);
      setEditingEntry(null);
      setFormData({ date: '', customer: '', place: '', mobile: '', loan: '', interest: '', emi: '' });
      await loadBranchData();
      alert('Entry updated successfully');
    } catch (error) {
      console.error('Error updating entry:', error);
      alert('Error updating entry');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    
    try {
      setLoading(true);
      await axios.delete(api.delete(`/api/branch-entries/${id}`));
      await loadBranchData();
      alert('Entry deleted successfully');
    } catch (err) {
      alert(err.response?.data?.error || 'Error deleting entry');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPayment = (entry) => {
    setPaymentEntry(entry);
    setPaymentData({
      date: new Date().toISOString().split('T')[0], // Default to today
      amount: '',
      customer: entry ? entry.customer : ''
    });
    setPaymentModalOpen(true);
  };

  const handleMakePayment = async (e) => {
    e.preventDefault();
    
    if (!paymentData.date || !paymentData.amount || !paymentData.customer) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      // Get customer mobile from branchData if available
      const customerEntry = branchData.find(e => e.customer === paymentData.customer);
      
      const payload = {
        branch: branchName.toLowerCase(),
        customer: paymentData.customer,
        place: 'Payment',
        mobile: customerEntry?.mobile || '0000000000',
        loan: paymentData.amount,
        interest: '0',
        emi: '0',
        date: paymentData.date
      };
      
      await axios.post(api.post('/api/branch-entries'), payload);
      setPaymentModalOpen(false);
      setPaymentEntry(null);
      setPaymentData({ date: '', amount: '', customer: '' });
      await loadBranchData();
      alert('Payment recorded successfully');
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Error recording payment');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerData = async (customer) => {
    try {
      const res = await axios.get(api.get(`/api/branch-entries/${branchName}`));
      
      // Get all loans for this customer
      const customerLoans = (res.data || []).filter(entry => 
        entry.customer === customer && entry.place !== 'Payment'
      );
      
      // Get all payments for this customer
      const paymentEntries = (res.data || []).filter(entry => 
        entry.customer === customer && entry.place === 'Payment'
      );
      
      setCustomerPayments(paymentEntries);
      
      // Return all customer loans for display
      return customerLoans;
    } catch (e) {
      console.error('Error loading customer data:', e);
      setCustomerPayments([]);
      return [];
    }
  };

  const openCustomerDetails = async (entry, mode = 'full') => {
    setDetailsMode(mode);
    setSelectedCustomer(entry);
    const allCustomerLoans = await loadCustomerData(entry.customer);
    // Store all loans for this customer
    setSelectedCustomer({
      ...entry,
      allLoans: allCustomerLoans
    });
    setDetailsOpen(true);
  };

  const closeModals = () => {
    setAddModalOpen(false);
    setEditModalOpen(false);
    setPaymentModalOpen(false);
    setDetailsOpen(false);
    setExpenseModalOpen(false);
    setEmployeeModalOpen(false);
    setEmployeeDetailOpen(false);
    setEmployeeEditOpen(false);
    setSelectedEmployee(null);
    setEditingEmployee(null);
    setSelectedCustomer(null);
    setEditingEntry(null);
    setPaymentEntry(null);
    setFormData({ date: '', customer: '', place: '', mobile: '', loan: '', interest: '', emi: '' });
    setPaymentData({ date: '', amount: '', customer: '' });
    setExpenseForm({ date: new Date().toISOString().split('T')[0], month: '', category: '', amount: '', description: '' });
    setEmployeeForm({ name: '', mobile: '', designation: '', department: '', joiningDate: '', salary: '' });
  };

  // Calculate totals - use filteredData for loans view, branchData for dashboard
  const dataToUse = selectedView === 'loans' ? filteredData : branchData;
  const totalLoan = dataToUse.reduce((sum, entry) => sum + Number(entry.loan || 0), 0);
  const totalInterest = dataToUse.reduce((sum, entry) => sum + Number(entry.interest || 0), 0);
  const totalEMI = dataToUse.reduce((sum, entry) => sum + Number(entry.emi || 0), 0);
  const totalPayments = (selectedView === 'payments' ? filteredPayments : allPayments).reduce((sum, p) => sum + Number(p.loan || 0), 0);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Branch Sidebar */}
      <BranchSidebar 
        branchName={branchName} 
        onLogout={handleLogout}
        selectedView={selectedView}
        onViewChange={setSelectedView}
      />

      {/* Main Content */}
      <div className="flex-1 ml-56">
        {/* Header with Search */}
        <header className="bg-white shadow-md fixed top-0 right-0 left-56 z-40">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-2xl font-bold text-gray-800 capitalize flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 w-10 h-10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                {branchName} Branch
              </h1>
              
              {/* Search Bar */}
              <div className="flex-1 max-w-xl">
                <div className="relative">
                  <input
                    type="text"
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Search by customer, place, mobile, or loan amount..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="pt-20 p-8">
        
        {/* Dashboard View */}
        {selectedView === 'dashboard' && (
          <div className="text-center py-16">
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-3 capitalize">Welcome to {branchName} Branch</h2>
            <p className="text-gray-600 text-lg mb-8">Select an option from the sidebar to manage your branch</p>
            
            {/* Quick Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                <p className="text-sm font-medium text-gray-600 mb-1">Total Entries</p>
                <p className="text-3xl font-bold text-blue-600">{dataToUse.length}</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                <p className="text-sm font-medium text-gray-600 mb-1">Total Loan</p>
                <p className="text-2xl font-bold text-green-600">₹{totalLoan.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                <p className="text-sm font-medium text-gray-600 mb-1">Total Interest</p>
                <p className="text-2xl font-bold text-purple-600">₹{totalInterest.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                <p className="text-sm font-medium text-gray-600 mb-1">Total EMI</p>
                <p className="text-2xl font-bold text-orange-600">₹{totalEMI.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Category Master → Employee Totals Modal */}
        <Modal open={showCatEmpTotals} onClose={() => setShowCatEmpTotals(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 mx-auto" style={{ width: '850px', maxWidth: '95vw' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-blue-700">Employee Totals (Single Date)</h3>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowCatEmpTotals(false)}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Category</label>
                <select className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400" value={totalsCategory} onChange={(e)=>setTotalsCategory(e.target.value)}>
                  {categoryMasterCategories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Month</label>
                <select className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400" value={totalsMonth} onChange={(e)=>setTotalsMonth(e.target.value)}>
                  {Array.from(new Set((branchEmployeeExpenses||[]).map(e => new Date(e.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })))).map(m => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Date</label>
                <input type="date" className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400" value={totalsDate} onChange={(e)=>setTotalsDate(e.target.value)} />
              </div>
            </div>

            {(() => {
              const rows = (branchEmployeeExpenses||[])
                .filter(e => totalsCategory === 'All' || e.category === totalsCategory)
                .filter(e => !totalsMonth || new Date(e.date).toLocaleDateString('en-US', { month: 'long' }) === totalsMonth)
                .filter(e => !totalsDate || new Date(e.date).toISOString().slice(0,10) === totalsDate)
                .reduce((map, e) => { const key = e.employeeName || 'Unknown'; map[key] = (map[key] || 0) + Number(e.amount||0); return map; }, {});
              const entries = Object.entries(rows);
              return (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-blue-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Employee</th>
                          <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Total (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entries.length === 0 ? (
                          <tr><td colSpan="2" className="px-4 py-6 text-center text-gray-500">No data for selected filters</td></tr>
                        ) : entries.map(([name, amt]) => (
                          <tr key={name} className="even:bg-gray-50">
                            <td className="px-4 py-2 text-base text-gray-800">{name}</td>
                            <td className="px-4 py-2 text-base text-right font-semibold text-emerald-700">₹{amt.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                      {entries.length > 0 && (
                        <tfoot className="bg-blue-50">
                          <tr>
                            <td className="px-4 py-2 text-right font-bold">Grand Total</td>
                            <td className="px-4 py-2 text-right font-bold text-emerald-700">₹{entries.reduce((s, [,a])=> s + a, 0).toLocaleString('en-IN')}</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        </Modal>

        {/* Add Category Modal */}
        <Modal open={addCategoryOpen} onClose={() => setAddCategoryOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 mx-auto" style={{ width: '500px', maxWidth: '90vw' }}>
            <h3 className="text-xl font-bold text-emerald-700 mb-4">Add New Category</h3>
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-gray-700">Category Name</label>
              <input
                className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="e.g. Office Exp."
                value={newCategoryName}
                onChange={(e)=>setNewCategoryName(e.target.value)}
              />
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button className="px-5 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold" onClick={()=>setAddCategoryOpen(false)}>Cancel</button>
              <button
                className="px-5 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
                onClick={() => {
                  const name = (newCategoryName || '').trim();
                  if (!name) return;
                  setCategoryMasterCategories(prev => prev.includes(name) ? prev : [...prev, name]);
                  setAddCategoryOpen(false);
                }}
              >
                Add
              </button>
            </div>
          </div>
        </Modal>

        {/* Category Master → Individual Category (Employee Expenses) */}
        <Modal open={!!masterCategoryDetail} onClose={() => setMasterCategoryDetail(null)}>
          {masterCategoryDetail && (
            <div className="bg-white rounded-2xl shadow-2xl p-6 mx-auto" style={{ width: '700px', maxWidth: '95vw' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-blue-700">{masterCategoryDetail} - Employee Expenses</h3>
                <button className="text-gray-500 hover:text-gray-700" onClick={() => setMasterCategoryDetail(null)}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              {(() => {
                // Group employee expenses by date for the selected category
                const grouped = (branchEmployeeExpenses || [])
                  .filter(e => e.category === masterCategoryDetail)
                  .reduce((map, e) => {
                    const d = new Date(e.date).toISOString().slice(0,10);
                    map[d] = (map[d] || 0) + Number(e.amount || 0);
                    return map;
                  }, {});
                const rows = Object.entries(grouped).sort(([a],[b]) => new Date(b) - new Date(a));
                const grand = rows.reduce((s, [,amt]) => s + amt, 0);
                return (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-blue-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Date</th>
                            <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Amount (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.length === 0 ? (
                            <tr><td colSpan="2" className="px-4 py-6 text-center text-gray-500">No employee expenses found for this category</td></tr>
                          ) : rows.map(([date, amt]) => (
                            <tr key={date} className="even:bg-gray-50">
                              <td className="px-4 py-2 text-base text-gray-800">{new Date(date).toLocaleDateString('en-IN')}</td>
                              <td className="px-4 py-2 text-base text-right font-semibold text-emerald-700">₹{amt.toLocaleString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                        {rows.length > 0 && (
                          <tfoot className="bg-blue-50">
                            <tr>
                              <td className="px-4 py-2 text-right font-bold">Total</td>
                              <td className="px-4 py-2 text-right font-bold text-emerald-700">₹{grand.toLocaleString('en-IN')}</td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </Modal>
        {/* Loans View */}
        {selectedView === 'loans' && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 mt-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Entries</p>
                <p className="text-3xl font-bold text-gray-800">{filteredData.length}</p>
              </div>
              <div className="bg-blue-100 p-4 rounded-xl">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Loan</p>
                <p className="text-3xl font-bold text-green-600">₹{totalLoan.toLocaleString()}</p>
              </div>
              <div className="bg-green-100 p-4 rounded-xl">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Interest</p>
                <p className="text-3xl font-bold text-purple-600">₹{totalInterest.toLocaleString()}</p>
              </div>
              <div className="bg-purple-100 p-4 rounded-xl">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total EMI</p>
                <p className="text-3xl font-bold text-orange-600">₹{totalEMI.toLocaleString()}</p>
              </div>
              <div className="bg-orange-100 p-4 rounded-xl">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setAddModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Loan
          </button>
          <button
            onClick={() => {
              setPaymentEntry(null);
              setPaymentData({
                date: new Date().toISOString().split('T')[0],
                amount: '',
                customer: ''
              });
              setPaymentModalOpen(true);
            }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Make Payment
          </button>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Loan Entries
            </h2>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
              <p className="mt-3 text-gray-600 font-medium">Loading entries...</p>
            </div>
          ) : branchData.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-3 text-base font-medium text-gray-900">No entries found</h3>
              <p className="mt-1 text-sm text-gray-500">Click "Add New Loan Entry" to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Customer</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Place</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Mobile</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700 uppercase">Loan</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700 uppercase">Interest</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700 uppercase">EMI</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((entry, index) => (
                    <tr key={entry._id} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {new Date(entry.date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {entry.customer}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                        {entry.place}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                        {entry.mobile}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-semibold text-green-600">
                        ₹{Number(entry.loan).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-semibold text-purple-600">
                        ₹{Number(entry.interest).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-semibold text-orange-600">
                        ₹{Number(entry.emi).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-center">
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => openCustomerDetails(entry)}
                            className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded transition-all"
                            title="View details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEdit(entry)}
                            className="p-1.5 text-green-600 hover:text-green-900 hover:bg-green-100 rounded transition-all"
                            title="Edit entry"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(entry._id)}
                            className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-100 rounded transition-all"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
        </>
        )}

        {/* Payments View */}
        {selectedView === 'payments' && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 mt-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Payments</p>
                    <p className="text-3xl font-bold text-gray-800">{filteredPayments.length}</p>
                  </div>
                  <div className="bg-green-100 p-4 rounded-xl">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Amount</p>
                    <p className="text-3xl font-bold text-blue-600">₹{totalPayments.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-blue-100 p-4 rounded-xl">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Unique Customers</p>
                    <p className="text-3xl font-bold text-purple-600">{new Set(filteredPayments.map(p => p.customer)).size}</p>
                  </div>
                  <div className="bg-purple-100 p-4 rounded-xl">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Payments Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Payment History
                </h2>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-green-600"></div>
                  <p className="mt-3 text-gray-600 font-medium">Loading payments...</p>
                </div>
              ) : filteredPayments.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-3 text-base font-medium text-gray-900">No payments found</h3>
                  <p className="mt-1 text-sm text-gray-500">Use Make Payment to add one.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Customer</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700 uppercase">Amount (₹)</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPayments.map((entry, index) => (
                        <tr key={`${entry._id}-${index}`} className={`hover:bg-green-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {new Date(entry.date).toLocaleDateString('en-IN')}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            {entry.customer}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-semibold text-green-600">
                            ₹{Number(entry.loan).toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-center">
                            <div className="flex gap-1 justify-center">
                              <button
                                onClick={() => openCustomerDetails(entry, 'paymentsOnly')}
                                className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded transition-all"
                                title="View customer history"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleEdit(entry)}
                                className="p-1.5 text-green-600 hover:text-green-900 hover:bg-green-100 rounded transition-all"
                                title="Edit payment"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteEntry(entry._id)}
                                className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-100 rounded transition-all"
                                title="Delete"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gradient-to-r from-green-100 to-emerald-100">
                      <tr>
                        <td className="px-4 py-2 text-sm font-bold text-gray-800" colSpan="3">
                          Total: {filteredPayments.length} payment(s)
                        </td>
                        <td className="px-4 py-2 text-right font-bold text-green-700 text-base">
                          ₹{filteredPayments.reduce((sum, p) => sum + Number(p.loan), 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {selectedView === 'empExpenses' && (
          <div className="mt-8">
            <div className="bg-white rounded-2xl shadow p-8 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Employee Expenses</h2>
                <p className="text-sm text-gray-500 capitalize">Branch: {branchName}</p>
              </div>

              {/* Filters */}
              <div className="mb-6 flex items-end gap-6">
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Filter by Category</label>
                  <select
                    className="w-full px-3 py-3 rounded-xl bg-gray-50 border border-gray-200 shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white"
                    value={empExpCategory}
                    onChange={(e)=>setEmpExpCategory(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {Array.from(new Set([...(categoryMasterCategories||[]).filter(Boolean)])).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Filter by Date</label>
                  <input type="date" className="w-full px-3 py-3 rounded-xl bg-gray-50 border border-gray-200 shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white" value={empExpDate} onChange={(e)=>setEmpExpDate(e.target.value)} />
                </div>
                <button className="bg-gray-500 text-white px-5 py-3 rounded-xl font-semibold hover:bg-gray-600" onClick={()=>{ setEmpExpCategory(''); setEmpExpDate(''); }}>Clear</button>
                <button className="bg-emerald-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-emerald-700 shadow" onClick={()=> setEmpExpAddOpen(true)}>Add Expense</button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="rounded-2xl p-5 border border-blue-100 bg-blue-50/60 shadow-sm">
                  <p className="text-sm font-medium text-blue-700/80">Total Entries</p>
                  <p className="text-4xl leading-none font-extrabold text-blue-800 mt-1">{filteredBranchEmployeeExpenses.length}</p>
                </div>
                <div className="rounded-2xl p-5 border border-emerald-100 bg-emerald-50/60 shadow-sm">
                  <p className="text-sm font-medium text-emerald-700/80">Total Amount</p>
                  <p className="text-4xl leading-none font-extrabold text-emerald-800 mt-1">₹{filteredBranchEmployeeExpenses.reduce((s, e)=> s + Number(e.amount||0), 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="rounded-2xl p-5 border border-purple-100 bg-purple-50/60 shadow-sm">
                  <p className="text-sm font-medium text-purple-700/80">Unique Employees</p>
                  <p className="text-4xl leading-none font-extrabold text-purple-800 mt-1">{new Set(filteredBranchEmployeeExpenses.map(e=>e.employeeName)).size}</p>
                </div>
                <div className="rounded-2xl p-5 border border-orange-100 bg-orange-50/60 shadow-sm">
                  <p className="text-sm font-medium text-orange-700/80">Categories</p>
                  <p className="text-4xl leading-none font-extrabold text-orange-800 mt-1">{new Set(filteredBranchEmployeeExpenses.map(e=>e.category)).size}</p>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase border border-gray-200">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase border border-gray-200">Employee Name</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase border border-gray-200">Category</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 uppercase border border-gray-200">Amount (₹)</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 uppercase border border-gray-200">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBranchEmployeeExpenses.map((exp) => (
                        <tr key={exp._id} className="even:bg-gray-50 hover:bg-gray-100 transition-colors">
                          <td className="px-4 py-3 text-base text-gray-900 border border-gray-200">{exp.date ? new Date(exp.date).toLocaleDateString('en-IN') : ''}</td>
                          <td className="px-4 py-3 text-base font-medium text-gray-900 border border-gray-200">{exp.employeeName}</td>
                          <td className="px-4 py-3 text-base text-gray-700 border border-gray-200">{exp.category}</td>
                          <td className="px-4 py-3 text-base text-right font-semibold text-emerald-700 border border-gray-200">₹{Number(exp.amount).toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3 text-center border border-gray-200">
                            <div className="flex items-center justify-center gap-2">
                              <button className="p-1 hover:bg-green-100 rounded" title="Edit" onClick={()=>handleEditEmpExpense(exp)}>
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                              </button>
                              <button className="p-1 hover:bg-red-100 rounded" title="Delete" onClick={()=>handleDeleteEmpExpense(exp._id)}>
                                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Add Employee Expense Modal */}
            <Modal open={empExpAddOpen} onClose={closeModals}>
              <div className="bg-white rounded-2xl shadow-2xl p-6 mx-auto" style={{ width: '600px', maxWidth: '90vw' }}>
                <h2 className="text-xl font-bold mb-4 text-emerald-700">Add Employee Expense</h2>
                <form onSubmit={handleAddEmpExpense}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold mb-1.5 text-gray-700">Employee Name *</label>
                      <select name="employeeName" className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-400" value={empExpenseForm.employeeName} onChange={handleEmpExpenseFormChange} required>
                        <option value="">Select Employee</option>
                        {employees.map(emp => (<option key={emp._id} value={emp.name}>{emp.name}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1.5 text-gray-700">Date *</label>
                      <input name="date" type="date" className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-400" value={empExpenseForm.date} onChange={handleEmpExpenseFormChange} required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1.5 text-gray-700">Amount (₹) *</label>
                      <input name="amount" type="number" className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-400" value={empExpenseForm.amount} onChange={handleEmpExpenseFormChange} min="0" step="0.01" required />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold mb-1.5 text-gray-700">Category *</label>
                      <select name="category" className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-400" value={empExpenseForm.category} onChange={handleEmpExpenseFormChange} required>
                        <option value="">Select Category</option>
                        {Array.from(new Set([...(categoryMasterCategories||[]).filter(Boolean)])).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-6">
                    <button type="submit" className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold flex-1 hover:bg-emerald-700" disabled={loading}>{loading ? 'Adding...' : 'Add Expense'}</button>
                    <button type="button" className="bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold flex-1 hover:bg-gray-500" onClick={closeModals}>Cancel</button>
                  </div>
                </form>
              </div>
            </Modal>

            {/* Edit Employee Expense Modal */}
            <Modal open={empExpEditOpen} onClose={closeModals}>
              <div className="bg-white rounded-2xl shadow-2xl p-6 mx-auto" style={{ width: '600px', maxWidth: '90vw' }}>
                <h2 className="text-xl font-bold mb-4 text-emerald-700">Edit Employee Expense</h2>
                <form onSubmit={handleUpdateEmpExpense}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold mb-1.5 text-gray-700">Employee Name *</label>
                      <select name="employeeName" className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-400" value={empExpenseForm.employeeName} onChange={handleEmpExpenseFormChange} required>
                        <option value="">Select Employee</option>
                        {employees.map(emp => (<option key={emp._id} value={emp.name}>{emp.name}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1.5 text-gray-700">Date *</label>
                      <input name="date" type="date" className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-400" value={empExpenseForm.date} onChange={handleEmpExpenseFormChange} required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1.5 text-gray-700">Amount (₹) *</label>
                      <input name="amount" type="number" className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-400" value={empExpenseForm.amount} onChange={handleEmpExpenseFormChange} min="0" step="0.01" required />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold mb-1.5 text-gray-700">Category *</label>
                      <select name="category" className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-400" value={empExpenseForm.category} onChange={handleEmpExpenseFormChange} required>
                        <option value="">Select Category</option>
                        {Array.from(new Set([...(categoryMasterCategories||[]).filter(Boolean)])).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-6">
                    <button type="submit" className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold flex-1 hover:bg-emerald-700" disabled={loading}>{loading ? 'Updating...' : 'Update Expense'}</button>
                    <button type="button" className="bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold flex-1 hover:bg-gray-500" onClick={closeModals}>Cancel</button>
                  </div>
                </form>
              </div>
            </Modal>
          </div>
        )}

        {/* Customers View */}
        {selectedView === 'customers' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Customers</h2>
                <p className="text-sm text-gray-500">Customers with active loans</p>
              </div>
              <button
                onClick={() => {
                  setFormData({ date: new Date().toISOString().split('T')[0], customer: '', place: '', mobile: '', loan: '', interest: '', emi: '' });
                  setAddModalOpen(true);
                }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12M6 12h12" />
                </svg>
                Add Customer
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3">
                <h3 className="text-lg font-bold text-white">Customer List</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Customer</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Mobile</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Loans</th>
                      <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Array.from(new Map(filteredData.map(e => [e.customer, e])).values()).map((entry) => {
                      const loansCount = branchData.filter(x => x.customer === entry.customer).length;
                      return (
                        <tr key={entry.customer} className="hover:bg-purple-50 transition-colors">
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{entry.customer}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">{entry.mobile}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">{loansCount}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-center">
                            <button
                              onClick={() => openCustomerDetails(entry)}
                              className="px-3 py-1.5 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg"
                            >View</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {selectedView === 'expenses' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Indirect Expenses</h2>
              <p className="text-sm text-gray-500 capitalize">Branch: {branchName}</p>
            </div>

            <div className="flex justify-end mb-4">
              <button
                onClick={() => setExpenseModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md"
              >
                Add Expense
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3">
                <h3 className="text-lg font-bold text-white">Expense List</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Month</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Category</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Description</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700 uppercase">Amount (₹)</th>
                      <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {branchExpenses.map((ex) => (
                      <tr key={ex._id} className="hover:bg-blue-50 transition-colors">
                        <td className="px-4 py-2 text-sm text-gray-900">{new Date(ex.date).toLocaleDateString('en-IN')}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{ex.month}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{ex.category}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{ex.description}</td>
                        <td className="px-4 py-2 text-sm text-right font-semibold text-blue-600">₹{Number(ex.amount).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-2 text-center">
                          <button onClick={()=>handleDeleteExpense(ex._id)} className="px-3 py-1.5 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {selectedView === 'employees' && (
          <div className="mt-8">
            <div className="bg-white rounded-2xl shadow p-8 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Employee Master</h2>
              <p className="text-sm text-gray-500 capitalize">Branch: {branchName}</p>
            </div>

            {/* Search + Add (moved above cards) */}
            <div className="mb-6 flex items-center justify-between gap-6">
              <div className="relative flex-1 max-w-2xl">
                <input
                  type="text"
                  className="w-full px-4 py-3 pl-10 pr-10 rounded-xl bg-gray-50 border border-gray-200 shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white placeholder:text-gray-400"
                  placeholder="Search by name, mobile, designation, or department..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {employeeSearch && (
                  <button
                    onClick={() => setEmployeeSearch('')}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <button
                onClick={() => setEmployeeModalOpen(true)}
                className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12M6 12h12"/></svg>
                Add Employee
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="rounded-2xl p-5 border border-emerald-100 bg-emerald-50/60 flex items-center gap-4 shadow-sm">
                <div className="bg-emerald-100 p-3 rounded-xl">
                  <svg className="w-6 h-6 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11c1.657 0 3-1.343 3-3S17.657 5 16 5s-3 1.343-3 3 1.343 3 3 3zM8 11c1.657 0 3-1.343 3-3S9.657 5 8 5 5 6.343 5 8s1.343 3 3 3zm0 2c-2.667 0-8 1.333-8 4v2h16v-2c0-2.667-5.333-4-8-4z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-700/80">Total Employees</p>
                  <p className="text-4xl leading-none font-extrabold text-emerald-800 mt-1">{employees.length}</p>
                </div>
              </div>
              <div className="rounded-2xl p-5 border border-blue-100 bg-blue-50/60 flex items-center gap-4 shadow-sm">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-700/80">Departments</p>
                  <p className="text-4xl leading-none font-extrabold text-blue-800 mt-1">{new Set((employees||[]).map(e => e.department).filter(Boolean)).size}</p>
                </div>
              </div>
              <div className="rounded-2xl p-5 border border-purple-100 bg-purple-50/60 flex items-center gap-4 shadow-sm">
                <div className="bg-purple-100 p-3 rounded-xl">
                  <svg className="w-6 h-6 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M4 6h16" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-700/80">Designations</p>
                  <p className="text-4xl leading-none font-extrabold text-purple-800 mt-1">{new Set((employees||[]).map(e => e.designation).filter(Boolean)).size}</p>
                </div>
              </div>
            </div>

            

            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="w-12 px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase border border-gray-200">#</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase border border-gray-200">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase border border-gray-200">Mobile</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase border border-gray-200">Designation</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase border border-gray-200">Department</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase border border-gray-200">Joining Date</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 uppercase border border-gray-200">Salary (₹)</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 uppercase border border-gray-200">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(filteredEmployees.length ? filteredEmployees : employees).map((em, idx) => (
                      <tr key={em._id} className="even:bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => openEmployeeDetails(em)}>
                        <td className="px-4 py-3 text-base text-gray-600 border border-gray-200">{idx + 1}</td>
                        <td className="px-4 py-3 text-base font-medium text-gray-900 border border-gray-200">{em.name}</td>
                        <td className="px-4 py-3 text-base text-gray-600 border border-gray-200">{em.mobile || '-'}</td>
                        <td className="px-4 py-3 text-base text-gray-600 border border-gray-200">{em.designation || '-'}</td>
                        <td className="px-4 py-3 text-base text-gray-600 border border-gray-200">{em.department || '-'}</td>
                        <td className="px-4 py-3 text-base text-gray-600 border border-gray-200">{em.joiningDate ? new Date(em.joiningDate).toLocaleDateString('en-IN') : '-'}</td>
                        <td className="px-4 py-3 text-base text-right font-semibold text-emerald-700 border border-gray-200">{em.salary ? `₹${Number(em.salary).toLocaleString('en-IN')}` : '-'}</td>
                        <td className="px-4 py-3 text-center border border-gray-200">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              className="p-1 hover:bg-green-100 rounded"
                              title="Edit"
                              onClick={(e)=>{ e.stopPropagation(); openEmployeeEdit(em); }}
                            >
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                            </button>
                            <button
                              className="p-1 hover:bg-red-100 rounded"
                              title="Delete"
                              onClick={(e)=>{ e.stopPropagation(); handleDeleteEmployee(em._id); }}
                            >
                              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            </div>
          </div>
        )}

        {selectedView === 'categoryMaster' && (
          <div className="mt-8">
            <div className="bg-white rounded-2xl shadow p-8 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Category Master</h2>
                <div className="flex items-center gap-3">
                  <p className="text-sm text-gray-500 capitalize">Branch: {branchName}</p>
                  <button
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700"
                    onClick={() => { setNewCategoryName(''); setAddCategoryOpen(true); }}
                  >
                    Add Category
                  </button>
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
                    onClick={() => {
                      setTotalsMonth('All');
                      setTotalsCategory('All');
                      setTotalsDate('');
                      setTotalsViewMode('Single Date');
                      setShowEmpTotalsResult(false);
                      setShowCatEmpTotals(true);
                    }}
                  >
                    View Totals
                  </button>
                </div>
              </div>

              {/* Category list derived from Category Manager-like data */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from(new Set([...(categoryMasterCategories||[]).filter(Boolean)])).map(cat => (
                  <div key={cat} className="bg-gray-50 rounded-lg shadow p-4 flex items-center justify-between border border-gray-200">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{cat}</h3>
                      <p className="text-gray-500 text-sm">{(branchExpenses||[]).filter(e => e.category === cat).length + (filteredBranchEmployeeExpenses||[]).filter(e => e.category === cat).length} entries</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-gray-200 rounded" title="View" onClick={() => setMasterCategoryDetail(cat)}>
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      </button>
                      <button className="p-2 hover:bg-gray-200 rounded" title="Edit" onClick={() => { const name = prompt('Rename category', cat); if (!name || name === cat) return; setCategoryMasterCategories(prev => prev.map(c => c === cat ? name : c)); }}>
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button className="p-2 hover:bg-gray-200 rounded" title="Delete" onClick={() => { if (!window.confirm(`Delete category "${cat}"?`)) return; setCategoryMasterCategories(prev => prev.filter(c => c !== cat)); }}>
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Reports View */}
        {selectedView === 'reports' && (
          <div className="text-center py-16">
            <div className="bg-gradient-to-br from-orange-100 to-yellow-100 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-16 h-16 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Reports</h2>
            <p className="text-gray-600 text-lg">Branch reports coming soon...</p>
          </div>
        )}

        </main>

        {/* Add Entry Modal */}
        <Modal open={addModalOpen} onClose={closeModals}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 mx-auto" style={{ width: '600px', maxWidth: '90vw' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-3 rounded-xl">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Add New Loan Entry</h2>
          </div>
          
          <form onSubmit={handleAddEntry}>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-2 text-gray-700">Date *</label>
                <input
                  type="date"
                  name="date"
                  className="border-2 border-gray-200 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Customer Name *</label>
                <input
                  type="text"
                  name="customer"
                  className="border-2 border-gray-200 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  value={formData.customer}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Place *</label>
                <input
                  type="text"
                  name="place"
                  className="border-2 border-gray-200 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  value={formData.place}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Mobile *</label>
                <input
                  type="tel"
                  name="mobile"
                  className="border-2 border-gray-200 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Loan Amount (₹) *</label>
                <input
                  type="number"
                  name="loan"
                  className="border-2 border-gray-200 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  value={formData.loan}
                  onChange={handleInputChange}
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Interest (₹)</label>
                <input
                  type="number"
                  name="interest"
                  className="border-2 border-gray-200 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  value={formData.interest}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">EMI (₹)</label>
                <input
                  type="number"
                  name="emi"
                  className="border-2 border-gray-200 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  value={formData.emi}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold flex-1 hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Loan Entry'}
              </button>
              <button
                type="button"
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold flex-1 hover:bg-gray-300 transition-all"
                onClick={closeModals}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
        </Modal>

      {/* Employee Detail Modal */}
      <Modal open={employeeDetailOpen} onClose={closeModals}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 mx-auto" style={{ width: '600px', maxWidth: '90vw' }}>
          <h2 className="text-xl font-bold mb-4 text-emerald-700">Employee Details</h2>
          {selectedEmployee && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Name</p>
                <p className="text-sm font-semibold text-gray-800">{selectedEmployee.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Mobile</p>
                <p className="text-sm font-semibold text-gray-800">{selectedEmployee.mobile || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Designation</p>
                <p className="text-sm font-semibold text-gray-800">{selectedEmployee.designation || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Department</p>
                <p className="text-sm font-semibold text-gray-800">{selectedEmployee.department || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Joining Date</p>
                <p className="text-sm font-semibold text-gray-800">{selectedEmployee.joiningDate ? new Date(selectedEmployee.joiningDate).toLocaleDateString('en-IN') : '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Salary</p>
                <p className="text-sm font-bold text-emerald-700">{selectedEmployee.salary ? `₹${Number(selectedEmployee.salary).toLocaleString('en-IN')}` : '-'}</p>
              </div>
            </div>
          )}
          <div className="flex justify-end mt-6">
            <button className="bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-600" onClick={closeModals}>Close</button>
          </div>
        </div>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal open={employeeEditOpen} onClose={closeModals}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 mx-auto" style={{ width: '600px', maxWidth: '90vw' }}>
          <h2 className="text-xl font-bold mb-4 text-emerald-700">Edit Employee</h2>
          <form onSubmit={handleUpdateEmployee}>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-1 text-gray-700">Name *</label>
                <input name="name" type="text" className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-400" value={employeeEditForm.name} onChange={handleEmployeeEditInput} required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Mobile</label>
                <input name="mobile" type="tel" className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-400" value={employeeEditForm.mobile} onChange={handleEmployeeEditInput} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Designation</label>
                <input name="designation" type="text" className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-400" value={employeeEditForm.designation} onChange={handleEmployeeEditInput} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Department</label>
                <input name="department" type="text" className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-400" value={employeeEditForm.department} onChange={handleEmployeeEditInput} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Joining Date</label>
                <input name="joiningDate" type="date" className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-400" value={employeeEditForm.joiningDate} onChange={handleEmployeeEditInput} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Salary (₹)</label>
                <input name="salary" type="number" className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-400" value={employeeEditForm.salary} onChange={handleEmployeeEditInput} />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-emerald-700" disabled={loading}>{loading ? 'Updating...' : 'Update Employee'}</button>
              <button type="button" className="bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-500" onClick={closeModals}>Cancel</button>
            </div>
          </form>
        </div>
      </Modal>

        {/* Add Expense Modal */}
        <Modal open={expenseModalOpen} onClose={closeModals}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 mx-auto" style={{ width: '600px', maxWidth: '90vw' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-3 rounded-xl">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l2-2 4 4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Add Indirect Expense</h2>
          </div>

          <form onSubmit={async (e) => { await handleAddExpense(e); setExpenseModalOpen(false); }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Date *</label>
                <input type="date" className="border-2 border-gray-200 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent" value={expenseForm.date} onChange={(e)=>setExpenseForm({...expenseForm, date: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Month *</label>
                <input type="text" placeholder="2025-10" className="border-2 border-gray-200 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent" value={expenseForm.month} onChange={(e)=>setExpenseForm({...expenseForm, month: e.target.value})} required />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-2 text-gray-700">Category *</label>
                <input type="text" className="border-2 border-gray-200 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent" value={expenseForm.category} onChange={(e)=>setExpenseForm({...expenseForm, category: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Amount (₹) *</label>
                <input type="number" className="border-2 border-gray-200 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent" value={expenseForm.amount} onChange={(e)=>setExpenseForm({...expenseForm, amount: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Description</label>
                <input type="text" className="border-2 border-gray-200 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent" value={expenseForm.description} onChange={(e)=>setExpenseForm({...expenseForm, description: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold flex-1 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg" disabled={loading}>
                {loading ? 'Adding...' : 'Add Expense'}
              </button>
              <button type="button" className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold flex-1 hover:bg-gray-300 transition-all" onClick={closeModals}>
                Cancel
              </button>
            </div>
          </form>
        </div>
        </Modal>

        {/* Edit Entry Modal */}
        <Modal open={editModalOpen} onClose={closeModals}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 mx-auto" style={{ width: '600px', maxWidth: '90vw' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-green-100 p-3 rounded-xl">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Edit Loan Entry</h2>
          </div>
          
          <form onSubmit={handleUpdateEntry}>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-2 text-gray-700">Date *</label>
                <input
                  type="date"
                  name="date"
                  className="border-2 border-gray-200 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Customer Name *</label>
                <input
                  type="text"
                  name="customer"
                  className="border-2 border-gray-200 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  value={formData.customer}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Place *</label>
                <input
                  type="text"
                  name="place"
                  className="border-2 border-gray-200 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  value={formData.place}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Mobile *</label>
                <input
                  type="tel"
                  name="mobile"
                  className="border-2 border-gray-200 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Loan Amount (₹) *</label>
                <input
                  type="number"
                  name="loan"
                  className="border-2 border-gray-200 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  value={formData.loan}
                  onChange={handleInputChange}
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Interest (₹)</label>
                <input
                  type="number"
                  name="interest"
                  className="border-2 border-gray-200 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  value={formData.interest}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">EMI (₹)</label>
                <input
                  type="number"
                  name="emi"
                  className="border-2 border-gray-200 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  value={formData.emi}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                type="submit"
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold flex-1 hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Entry'}
              </button>
              <button
                type="button"
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold flex-1 hover:bg-gray-300 transition-all"
                onClick={closeModals}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
        </Modal>

        {/* Payment Modal */}
        <Modal open={paymentModalOpen} onClose={closeModals}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 mx-auto" style={{ width: '600px', maxWidth: '90vw' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-purple-100 p-3 rounded-xl">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Record Payment</h2>
          </div>

          {paymentEntry && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl mb-6 border border-purple-200">
              <p className="text-sm font-semibold text-gray-700 mb-2">Selected Customer</p>
              <p className="text-xl font-bold text-gray-800">{paymentEntry.customer}</p>
              <div className="grid grid-cols-3 gap-4 mt-3">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Loan</p>
                  <p className="text-sm font-bold text-green-600">₹{Number(paymentEntry.loan).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Interest</p>
                  <p className="text-sm font-bold text-purple-600">₹{Number(paymentEntry.interest).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">EMI</p>
                  <p className="text-sm font-bold text-orange-600">₹{Number(paymentEntry.emi).toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleMakePayment}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Select Customer *</label>
                <select
                  className="border-2 border-gray-200 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  value={paymentData.customer}
                  onChange={(e) => {
                    const selectedCustomer = e.target.value;
                    const customerEntry = branchData.find(entry => entry.customer === selectedCustomer);
                    setPaymentData({
                      ...paymentData, 
                      customer: selectedCustomer
                    });
                    if (customerEntry) {
                      setPaymentEntry(customerEntry);
                    }
                  }}
                  required
                >
                  <option value="">Choose a customer</option>
                  {[...new Set(branchData.map(e => e.customer))].map(customer => (
                    <option key={customer} value={customer}>{customer}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Payment Date *</label>
                <input
                  type="date"
                  className="border-2 border-gray-200 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  value={paymentData.date}
                  onChange={(e) => setPaymentData({...paymentData, date: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Payment Amount (₹) *</label>
                <input
                  type="number"
                  className="border-2 border-gray-200 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                  min="0"
                  placeholder="Enter payment amount"
                  required
                />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                type="submit"
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold flex-1 hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg"
                disabled={loading}
              >
                {loading ? 'Recording...' : 'Record Payment'}
              </button>
              <button
                type="button"
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold flex-1 hover:bg-gray-300 transition-all"
                onClick={closeModals}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
        </Modal>

        {/* Add Employee Modal */}
        <Modal open={employeeModalOpen} onClose={closeModals}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 mx-auto" style={{ width: '600px', maxWidth: '90vw' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-emerald-100 p-3 rounded-xl">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11c1.657 0 3-1.343 3-3S17.657 5 16 5s-3 1.343-3 3 1.343 3 3 3zM8 11c1.657 0 3-1.343 3-3S9.657 5 8 5 5 6.343 5 8s1.343 3 3 3zm0 2c-2.667 0-8 1.333-8 4v2h16v-2c0-2.667-5.333-4-8-4zm8 0c-.29 0-.6.01-.93.03 1.84.84 3.93 2.12 3.93 3.97v2h6v-2c0-2.667-5.333-4-9-4z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Add Employee</h2>
          </div>

          <form onSubmit={async (e) => { await handleAddEmployee(e); setEmployeeModalOpen(false); }}>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-2 text-gray-700">Name *</label>
                <input type="text" className="border-2 border-gray-200 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent" value={employeeForm.name} onChange={(e)=>setEmployeeForm({...employeeForm, name: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Mobile</label>
                <input type="tel" className="border-2 border-gray-200 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent" value={employeeForm.mobile} onChange={(e)=>setEmployeeForm({...employeeForm, mobile: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Designation</label>
                <input type="text" className="border-2 border-gray-200 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent" value={employeeForm.designation} onChange={(e)=>setEmployeeForm({...employeeForm, designation: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Department</label>
                <input type="text" className="border-2 border-gray-200 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent" value={employeeForm.department} onChange={(e)=>setEmployeeForm({...employeeForm, department: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Joining Date (dd-mm-yyyy)</label>
                <input type="date" className="border-2 border-gray-200 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent" value={employeeForm.joiningDate} onChange={(e)=>setEmployeeForm({...employeeForm, joiningDate: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Salary</label>
                <input type="number" className="border-2 border-gray-200 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent" value={employeeForm.salary} onChange={(e)=>setEmployeeForm({...employeeForm, salary: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button type="submit" className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-3 rounded-xl font-semibold flex-1 hover:from-emerald-700 hover:to-green-700 transition-all shadow-md hover:shadow-lg" disabled={loading}>
                {loading ? 'Adding...' : 'Add Employee'}
              </button>
              <button type="button" className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold flex-1 hover:bg-gray-300 transition-all" onClick={closeModals}>
                Cancel
              </button>
            </div>
          </form>
        </div>
        </Modal>

        {/* Customer Details Modal */}
        <Modal open={detailsOpen} onClose={closeModals}>
        <div className="bg-white rounded-2xl shadow-2xl p-5 mx-auto" style={{ width: '1000px', maxWidth: '95vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
          <div className="flex items-center gap-2 mb-4 flex-shrink-0">
            <div className="bg-purple-100 p-2 rounded-lg">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">{detailsMode === 'paymentsOnly' ? 'Payment History' : 'Loan Details'}</h2>
              <p className="text-xs text-gray-600">{selectedCustomer?.customer}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2" style={{ 
            scrollbarWidth: 'thin',
            scrollbarColor: '#9ca3af #f3f4f6'
          }}>
          <style>{`
            .flex-1::-webkit-scrollbar {
              width: 6px;
            }
            .flex-1::-webkit-scrollbar-track {
              background: #f3f4f6;
              border-radius: 3px;
            }
            .flex-1::-webkit-scrollbar-thumb {
              background: #9ca3af;
              border-radius: 3px;
            }
            .flex-1::-webkit-scrollbar-thumb:hover {
              background: #6b7280;
            }
          `}</style>

          {selectedCustomer && (
            <>
              {/* Customer Info */}
              <div className="bg-gray-50 p-2.5 rounded-lg mb-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-600 mb-0.5">Place</p>
                    <p className="text-sm font-semibold text-gray-800">{selectedCustomer.place}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-0.5">Mobile</p>
                    <p className="text-sm font-semibold text-gray-800">{selectedCustomer.mobile}</p>
                  </div>
                </div>
              </div>

              {/* All Loans List */}
              {detailsMode !== 'paymentsOnly' && selectedCustomer.allLoans && selectedCustomer.allLoans.length > 0 && (
                <>
                  <h3 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                    <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    All Loans ({selectedCustomer.allLoans.length})
                  </h3>

                  <div className="space-y-2 mb-4">
                    {selectedCustomer.allLoans.map((loan, idx) => (
                      <div key={loan._id} className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-bold text-gray-800">Loan #{idx + 1}</h4>
                          <span className="text-xs text-gray-600">{new Date(loan.date).toLocaleDateString('en-IN')}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <p className="text-xs text-gray-600">Loan</p>
                            <p className="text-sm font-bold text-green-600">₹{Number(loan.loan).toLocaleString('en-IN')}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Interest</p>
                            <p className="text-sm font-bold text-purple-600">₹{Number(loan.interest).toLocaleString('en-IN')}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">EMI</p>
                            <p className="text-sm font-bold text-orange-600">₹{Number(loan.emi).toLocaleString('en-IN')}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Total</p>
                            <p className="text-sm font-bold text-blue-600">₹{(Number(loan.loan) + Number(loan.interest)).toLocaleString('en-IN')}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Overall Summary */}
              {detailsMode !== 'paymentsOnly' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-2.5 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-1.5 mb-1">
                    <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs font-semibold text-gray-700">Total Loans</p>
                  </div>
                  <p className="text-lg font-bold text-blue-600">
                    ₹{selectedCustomer.allLoans ? selectedCustomer.allLoans.reduce((sum, l) => sum + Number(l.loan) + Number(l.interest), 0).toLocaleString('en-IN') : 0}
                  </p>
                  <p className="text-xs text-gray-600">{selectedCustomer.allLoans?.length || 0} loan(s)</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-2.5 rounded-lg border border-green-200">
                  <div className="flex items-center gap-1.5 mb-1">
                    <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs font-semibold text-gray-700">Total Paid</p>
                  </div>
                  <p className="text-lg font-bold text-green-600">
                    ₹{customerPayments.reduce((sum, p) => sum + Number(p.loan), 0).toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-gray-600">{customerPayments.length} payment(s)</p>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-pink-50 p-2.5 rounded-lg border border-red-200">
                  <div className="flex items-center gap-1.5 mb-1">
                    <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs font-semibold text-gray-700">Balance Due</p>
                  </div>
                  <p className="text-lg font-bold text-red-600">
                    ₹{selectedCustomer.allLoans ? (selectedCustomer.allLoans.reduce((sum, l) => sum + Number(l.loan) + Number(l.interest), 0) - customerPayments.reduce((sum, p) => sum + Number(p.loan), 0)).toLocaleString('en-IN') : 0}
                  </p>
                  <p className="text-xs text-gray-600">Remaining</p>
                </div>
              </div>
              )}
            </>
          )}

          <h3 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
            <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Payment History
          </h3>
          
          {customerPayments.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm text-gray-500 mt-2">No payment records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-green-50 to-emerald-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700 uppercase">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {customerPayments.map((payment, index) => (
                    <tr key={index} className="hover:bg-green-50 transition-colors">
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {new Date(payment.date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-2 text-sm text-right font-semibold text-green-600">
                        ₹{Number(payment.loan).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gradient-to-r from-green-100 to-emerald-100">
                  <tr>
                    <td className="px-4 py-2 text-sm font-bold text-gray-800">
                      Total: {customerPayments.length} payment(s)
                    </td>
                    <td className="px-4 py-2 text-right font-bold text-green-700 text-base">
                      ₹{customerPayments.reduce((sum, p) => sum + Number(p.loan), 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
          </div>

          <div className="flex justify-end mt-4 pt-4 border-t border-gray-200 flex-shrink-0">
            <button
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
              onClick={closeModals}
            >
              Close
            </button>
          </div>
        </div>
        </Modal>
      </div>
    </div>
  );
}
