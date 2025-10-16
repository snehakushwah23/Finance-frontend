import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { api } from '../config/api';
import Modal from './Modal';
import BranchSidebar from './BranchSidebar';

export default function BranchDashboard() {
  const { branchName } = useParams();
  const navigate = useNavigate();
  const isInitialMount = useRef(true);
  const isInitialMountAdded = useRef(true);
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
  const [categoryMasterCategories, setCategoryMasterCategories] = useState([]);
  const [deletedCategories, setDeletedCategories] = useState(new Set()); // Track manually deleted categories
  const [addedCategories, setAddedCategories] = useState(new Set()); // Track manually added categories
  const [masterCategoryDetail, setMasterCategoryDetail] = useState(null);
  const [showCatEmpTotals, setShowCatEmpTotals] = useState(false);
  const [employeeDetailsModalOpen, setEmployeeDetailsModalOpen] = useState(false);
  const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState(null);
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
    
    // Reset initial mount flags when switching branches
    isInitialMount.current = true;
    isInitialMountAdded.current = true;
    
    // Clear all branch-specific data when switching branches for complete separation
    setBranchData([]);
    setBranchExpenses([]);
    setBranchEmployeeExpenses([]);
    setEmployees([]);
    setCategoryMasterCategories([]); // Will be populated when data loads
    
    // Load category settings from database
    loadCategorySettings();
    
    loadBranchData();
  }, [branchName, navigate]);

  // Save category settings to database whenever they change
  useEffect(() => {
    // Skip saving on initial mount to avoid overwriting loaded data
    if (isInitialMount.current) {
      isInitialMount.current = false;
      console.log('🛑 Skipping save on initial mount, deletedCategories size:', deletedCategories.size);
      return;
    }
    
    if (!branchName) return;
    
    // Save to database with current values
    saveCategorySettings(addedCategories, deletedCategories);
  }, [deletedCategories, branchName]);

  // Save category settings to database whenever added categories change
  useEffect(() => {
    // Skip saving on initial mount to avoid overwriting loaded data
    if (isInitialMountAdded.current) {
      isInitialMountAdded.current = false;
      console.log('🛑 Skipping save added categories on initial mount, addedCategories size:', addedCategories.size);
      return;
    }
    
    if (!branchName) return;
    
    // Save to database with current values
    saveCategorySettings(addedCategories, deletedCategories);
  }, [addedCategories, branchName]);

  // Initialize categories when component first loads
  useEffect(() => {
    // Initialize with default categories for the current branch
    if (categoryMasterCategories.length === 0) {
      setCategoryMasterCategories([...DEFAULT_CATEGORIES]);
      console.log('Initialized default categories for branch:', branchName, DEFAULT_CATEGORIES);
    }
  }, [branchName, categoryMasterCategories.length]);

  const loadCategorySettings = async () => {
    try {
      console.log('🔄 Loading category settings from database for:', branchName);
      const cacheBuster = new Date().getTime();
      const res = await axios.get(api.get(`/api/branch-category-settings/${branchName.toLowerCase()}?_t=${cacheBuster}`));
      
      const { addedCategories, deletedCategories } = res.data;
      
      setAddedCategories(new Set(addedCategories || []));
      setDeletedCategories(new Set(deletedCategories || []));
      
      console.log('✅ Loaded category settings from database:', {
        added: addedCategories,
        deleted: deletedCategories
      });
    } catch (err) {
      console.error('Error loading category settings:', err);
      // Initialize with empty sets on error
      setAddedCategories(new Set());
      setDeletedCategories(new Set());
    }
  };

  const saveCategorySettings = async (added, deleted) => {
    try {
      const payload = {
        addedCategories: Array.from(added || addedCategories),
        deletedCategories: Array.from(deleted || deletedCategories)
      };
      
      console.log('💾 Saving category settings to database for:', branchName, payload);
      
      await axios.post(api.get(`/api/branch-category-settings/${branchName.toLowerCase()}`), payload);
      
      console.log('✅ Category settings saved to database successfully');
    } catch (err) {
      console.error('❌ Error saving category settings:', err);
    }
  };

  const loadBranchData = async () => {
    try {
      setLoading(true);
      // Add cache busting parameter to force fresh data
      const cacheBuster = new Date().getTime();
      const res = await axios.get(api.get(`/api/branch-entries/${branchName}?_t=${cacheBuster}`));
      
      console.log('Loading branch data - fresh data:', res.data);
      
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
      // Add cache busting parameter to force fresh data
      const cacheBuster = new Date().getTime();
      console.log('Loading branch expenses for:', branchName);
      const res = await axios.get(api.get(`/api/branch-expenses/${branchName.toLowerCase()}?_t=${cacheBuster}`));
      
      console.log('Branch expenses loaded - count:', res.data?.length, 'data:', res.data);
      setBranchExpenses(res.data || []);
      
      // Categories will be updated by the useEffect hook - no manual mixing here
    } catch (e) {
      console.error('Error loading branch expenses:', e);
      console.error('Error details:', e.response?.data || e.message);
      setBranchExpenses([]);
    }
  };

  const loadBranchEmployees = async () => {
    try {
      // Add cache busting parameter to force fresh data
      const cacheBuster = new Date().getTime();
      const res = await axios.get(api.get(`/api/branch-employees/${branchName.toLowerCase()}?_t=${cacheBuster}`));
      
      console.log('Loading employees - fresh data:', res.data);
      setEmployees(res.data || []);
    } catch (e) {
      console.error('Error loading employees:', e);
      setEmployees([]);
    }
  };

  useEffect(() => {
    if (selectedView === 'expenses') {
      loadBranchExpenses();
      loadBranchEmployeeExpenses(); // Load employee expenses to get categories
    } else if (selectedView === 'employees') {
      loadBranchEmployees();
    } else if (selectedView === 'empExpenses') {
      loadBranchEmployees();
      loadBranchEmployeeExpenses();
    } else if (selectedView === 'categoryMaster') {
      loadBranchExpenses();
      loadBranchEmployeeExpenses();
    } else if (selectedView === 'dashboard') {
      // Load all data for dashboard view
      loadBranchExpenses();
      loadBranchEmployeeExpenses();
      loadBranchEmployees();
    }
  }, [selectedView]);

  // Recompute Category Master list when data or view changes - BRANCH SPECIFIC WITH DEFAULTS
  useEffect(() => {
    if (selectedView !== 'categoryMaster') return;
    
    // Get categories from current branch data
    const expCats = new Set((branchExpenses || []).map(e => e.category).filter(Boolean));
    const empCats = new Set((branchEmployeeExpenses || []).map(e => e.category).filter(Boolean));
    
    // Merge branch-specific categories with DEFAULT_CATEGORIES for this branch
    // Filter out manually deleted categories and add manually added categories
    const branchSpecificCategories = Array.from(new Set([
      ...DEFAULT_CATEGORIES.filter(cat => !deletedCategories.has(cat.toLowerCase())),  // Default categories minus deleted ones
      ...Array.from(expCats).filter(cat => !deletedCategories.has(cat.toLowerCase())), // Branch expenses minus deleted ones
      ...Array.from(empCats).filter(cat => !deletedCategories.has(cat.toLowerCase())), // Employee expenses minus deleted ones
      ...Array.from(addedCategories)  // Manually added categories
    ].filter(Boolean)));
    
    setCategoryMasterCategories(branchSpecificCategories);
    console.log('Branch-specific categories for', branchName, ':', branchSpecificCategories);
    console.log('Deleted categories:', Array.from(deletedCategories));
    console.log('Added categories:', Array.from(addedCategories));
  }, [selectedView, branchExpenses, branchEmployeeExpenses, branchName, deletedCategories, addedCategories]);

  // Initialize categories for dashboard view when data is loaded
  useEffect(() => {
    if (selectedView === 'dashboard' && (branchExpenses || branchEmployeeExpenses)) {
      // Get categories from current branch data
      const expCats = new Set((branchExpenses || []).map(e => e.category).filter(Boolean));
      const empCats = new Set((branchEmployeeExpenses || []).map(e => e.category).filter(Boolean));
      
      // Merge branch-specific categories with DEFAULT_CATEGORIES for this branch
      const branchSpecificCategories = Array.from(new Set([
        ...DEFAULT_CATEGORIES,  // Always include default categories for each branch
        ...Array.from(expCats),
        ...Array.from(empCats),
        ...Array.from(addedCategories)  // Include manually added categories
      ].filter(Boolean)));
      
      setCategoryMasterCategories(branchSpecificCategories);
      console.log('Initialized categories for dashboard -', branchName, ':', branchSpecificCategories);
    }
  }, [selectedView, branchExpenses, branchEmployeeExpenses, branchName, addedCategories]);

  // Initialize categories for expenses view when data is loaded
  useEffect(() => {
    if (selectedView === 'expenses' && (branchExpenses || branchEmployeeExpenses)) {
      // Get categories from current branch data
      const expCats = new Set((branchExpenses || []).map(e => e.category).filter(Boolean));
      const empCats = new Set((branchEmployeeExpenses || []).map(e => e.category).filter(Boolean));
      
      // Merge branch-specific categories with DEFAULT_CATEGORIES for this branch
      const branchSpecificCategories = Array.from(new Set([
        ...DEFAULT_CATEGORIES,  // Always include default categories for each branch
        ...Array.from(expCats),
        ...Array.from(empCats),
        ...Array.from(addedCategories)  // Include manually added categories
      ].filter(Boolean)));
      
      setCategoryMasterCategories(branchSpecificCategories);
      console.log('Initialized categories for expenses view -', branchName, ':', branchSpecificCategories);
    }
  }, [selectedView, branchExpenses, branchEmployeeExpenses, branchName, addedCategories]);

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
      // Add cache busting parameter to force fresh data
      const cacheBuster = new Date().getTime();
      const res = await axios.get(api.get(`/api/employee-expenses/${branchName.toLowerCase()}?_t=${cacheBuster}`));
      
      console.log('Loading employee expenses - fresh data:', res.data);
      
      // newest first
      const sorted = (res.data || []).sort((a, b) => new Date(b.date) - new Date(a.date));
      setBranchEmployeeExpenses(sorted);
      setFilteredBranchEmployeeExpenses(sorted);
      
      // Categories will be updated by the useEffect hook - no manual mixing here
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
      
      console.log('Updating employee expense:', payload);
      const response = await axios.put(api.put(`/api/employee-expenses/${editingEmpExpense._id}`), payload);
      console.log('Update response:', response.data);
      
      setEmpExpEditOpen(false);
      setEditingEmpExpense(null);
      
      // Small delay to ensure backend has processed the update
      setTimeout(async () => {
      await loadBranchEmployeeExpenses();
      }, 500);
      
      alert('Employee expense updated successfully');
    } catch (err) {
      console.error('Error updating employee expense:', err);
      alert('Error updating employee expense: ' + (err.response?.data?.message || err.message));
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

  // Update category in all related expenses for current branch only
  const updateCategoryInExpenses = async (oldCategory, newCategory) => {
    try {
      console.log('Updating category from', oldCategory, 'to', newCategory, 'for branch:', branchName);
      
      // Update branch expenses for current branch only
      const branchExpensesToUpdate = (branchExpenses || []).filter(exp => 
        exp.category === oldCategory && 
        exp.branch && 
        exp.branch.toLowerCase() === branchName.toLowerCase()
      );
      console.log('Branch expenses to update:', branchExpensesToUpdate.length);
      
      for (const expense of branchExpensesToUpdate) {
        await axios.put(api.put(`/api/branch-expenses/${expense._id}`), {
          ...expense,
          category: newCategory
        });
      }
      
      // Update employee expenses for current branch only
      const employeeExpensesToUpdate = (branchEmployeeExpenses || []).filter(exp => 
        exp.category === oldCategory && 
        exp.branch && 
        exp.branch.toLowerCase() === branchName.toLowerCase()
      );
      console.log('Employee expenses to update:', employeeExpensesToUpdate.length);
      
      for (const expense of employeeExpensesToUpdate) {
        await axios.put(api.put(`/api/employee-expenses/${expense._id}`), {
          branch: expense.branch,
          employeeName: expense.employeeName,
          date: expense.date,
          amount: expense.amount,
          category: newCategory
        });
      }
      
      // Refresh all data for current branch
      await Promise.all([
        loadBranchExpenses(),
        loadBranchEmployeeExpenses()
      ]);
      
      console.log('Category update completed successfully for branch:', branchName);
    } catch (error) {
      console.error('Error updating category in expenses:', error);
      throw error;
    }
  };

  // Delete category and all related expenses for current branch only
  const deleteCategoryAndExpenses = async (categoryToDelete) => {
    try {
      console.log('=== STARTING CATEGORY DELETION ===');
      console.log('Category to delete:', categoryToDelete);
      console.log('Branch:', branchName);
      console.log('Total branch expenses:', (branchExpenses || []).length);
      console.log('Total employee expenses:', (branchEmployeeExpenses || []).length);
      
      // Delete branch expenses for current branch only
      const branchExpensesToDelete = (branchExpenses || []).filter(exp => 
        exp.category === categoryToDelete && 
        exp.branch && 
        exp.branch.toLowerCase() === branchName.toLowerCase()
      );
      console.log('Branch expenses to delete:', branchExpensesToDelete.length);
      console.log('Branch expenses details:', branchExpensesToDelete);
      
      for (const expense of branchExpensesToDelete) {
        console.log('Deleting branch expense:', expense._id);
        await axios.delete(api.delete(`/api/branch-expenses/${expense._id}`));
      }
      
      // Delete employee expenses for current branch only
      const employeeExpensesToDelete = (branchEmployeeExpenses || []).filter(exp => 
        exp.category === categoryToDelete && 
        exp.branch && 
        exp.branch.toLowerCase() === branchName.toLowerCase()
      );
      console.log('Employee expenses to delete:', employeeExpensesToDelete.length);
      console.log('Employee expenses details:', employeeExpensesToDelete);
      
      for (const expense of employeeExpensesToDelete) {
        console.log('Deleting employee expense:', expense._id);
        await axios.delete(api.delete(`/api/employee-expenses/${expense._id}`));
      }
      
      console.log('All expenses deleted, refreshing data...');
      
      // Refresh all data for current branch
      await Promise.all([
        loadBranchExpenses(),
        loadBranchEmployeeExpenses()
      ]);
      
      console.log('=== CATEGORY DELETION COMPLETED ===');
      console.log('Category and expenses deletion completed successfully for branch:', branchName);
    } catch (error) {
      console.error('Error deleting category and expenses:', error);
      throw error;
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
      
      console.log('Updating employee:', payload);
      const response = await axios.put(api.put(`/api/branch-employees/${editingEmployee._id}`), payload);
      console.log('Update response:', response.data);
      
      setEmployeeEditOpen(false);
      setEditingEmployee(null);
      
      // Small delay to ensure backend has processed the update
      setTimeout(async () => {
      await loadBranchEmployees();
      }, 500);
      
      alert('Employee updated successfully');
    } catch (err) {
      console.error('Error updating employee:', err);
      alert('Error updating employee: ' + (err.response?.data?.message || err.message));
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
      
      console.log('Updating loan entry:', payload);
      const response = await axios.put(api.put(`/api/branch-entries/${editingEntry._id}`), payload);
      console.log('Update response:', response.data);
      
      setEditModalOpen(false);
      setEditingEntry(null);
      setFormData({ date: '', customer: '', place: '', mobile: '', loan: '', interest: '', emi: '' });
      
      // Small delay to ensure backend has processed the update
      setTimeout(async () => {
      await loadBranchData();
      }, 500);
      
      alert('Entry updated successfully');
    } catch (error) {
      console.error('Error updating entry:', error);
      alert('Error updating entry: ' + (error.response?.data?.message || error.message));
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
    setEmpExpAddOpen(false);
    setEmpExpEditOpen(false);
    setEditingEmpExpense(null);
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
        
        {/* Dashboard View - Finance Manager Style */}
        {selectedView === 'dashboard' && (
          <div>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 capitalize">{branchName} Branch Dashboard</h1>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Employee Expenses Card */}
              <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Employee Expenses</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₹{(branchEmployeeExpenses || []).reduce((sum, exp) => sum + Number(exp.amount || 0), 0).toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{(branchEmployeeExpenses || []).length} Expenses</p>
                  </div>
                  <div className="flex items-center text-green-600">
                    <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">Expenses</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>

              {/* Total Loans Card */}
              <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Loans</p>
                    <p className="text-2xl font-bold text-gray-900">₹{totalLoan.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-gray-500 mt-1">{dataToUse.length} Active Loans</p>
                  </div>
                  <div className="flex items-center text-purple-600">
                    <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">Loans</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>

              {/* Total Customers Card */}
              <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Customers</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {[...new Set(dataToUse.map(e => e.customer))].filter(Boolean).length}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Unique Customers</p>
                  </div>
                  <div className="flex items-center text-orange-600">
                    <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">Customers</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Expenses Chart */}
              <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">Expenses Overview</h3>
                  <select className="border border-gray-300 rounded-lg px-3 py-1 text-sm">
                    <option>This Year</option>
                    <option>This Month</option>
                    <option>Last Month</option>
                  </select>
                </div>
                
                {/* Main Expense Display */}
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    ₹{([...(branchExpenses || []), ...(branchEmployeeExpenses || [])]).reduce((sum, exp) => sum + Number(exp.amount || 0), 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-sm text-gray-600">Total Branch Expenses</div>
                </div>

                {/* Expense Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">{(branchEmployeeExpenses || []).length}</div>
                    <div className="text-sm text-green-700">Employee Exp.</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">{(branchExpenses || []).length}</div>
                    <div className="text-sm text-blue-700">Branch Exp.</div>
                  </div>
                </div>

                {/* Visual Progress */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Branch Expenses</span>
                    <span className="text-sm font-bold text-gray-900">
                      ₹{(branchExpenses || []).reduce((sum, exp) => sum + (exp.amount || 0), 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-full h-3 transition-all duration-500" 
                      style={{ 
                        width: `${(() => {
                          const branchExp = (branchExpenses || []).reduce((sum, exp) => sum + (exp.amount || 0), 0);
                          const empExp = (branchEmployeeExpenses || []).reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
                          const total = branchExp + empExp;
                          return total > 0 ? Math.round((branchExp / total) * 100) : 0;
                        })()}%` 
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-sm font-medium text-gray-700">Employee Expenses</span>
                    <span className="text-sm font-bold text-gray-900">
                      ₹{(branchEmployeeExpenses || []).reduce((sum, exp) => sum + Number(exp.amount || 0), 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-green-600 rounded-full h-3 transition-all duration-500" 
                      style={{ 
                        width: `${(() => {
                          const branchExp = (branchExpenses || []).reduce((sum, exp) => sum + (exp.amount || 0), 0);
                          const empExp = (branchEmployeeExpenses || []).reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
                          const total = branchExp + empExp;
                          return total > 0 ? Math.round((empExp / total) * 100) : 0;
                        })()}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Loans Chart */}
              <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">Loans Overview</h3>
                  <select className="border border-gray-300 rounded-lg px-3 py-1 text-sm">
                    <option>All Loans</option>
                    <option>Active Only</option>
                  </select>
                </div>
                
                {/* Loans Stats */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-purple-500 rounded"></div>
                      <span className="text-sm font-medium text-gray-700">Total Loans</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">₹{totalLoan.toLocaleString('en-IN')}</div>
                      <div className="text-xs text-gray-500">{dataToUse.length} loans</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-orange-500 rounded"></div>
                      <span className="text-sm font-medium text-gray-700">Total Interest</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">₹{totalInterest.toLocaleString('en-IN')}</div>
                      <div className="text-xs text-gray-500">Expected interest</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-blue-500 rounded"></div>
                      <span className="text-sm font-medium text-gray-700">Monthly EMI</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">₹{totalEMI.toLocaleString('en-IN')}</div>
                      <div className="text-xs text-gray-500">Per month collection</div>
                    </div>
                  </div>
                </div>
                
                {/* Loans Visual */}
                <div className="mt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-600">{dataToUse.length}</div>
                      <div className="text-sm text-purple-700">Active Loans</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {[...new Set(dataToUse.map(e => e.customer))].filter(Boolean).length}
                      </div>
                      <div className="text-sm text-orange-700">Customers</div>
                    </div>
                  </div>
                </div>

                {/* Payment Distribution */}
                <div className="mt-6">
                  <div className="text-sm font-medium text-gray-700 mb-3">Payment Collection</div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Total Payments</span>
                      <span className="text-xs font-medium text-gray-900">
                        ₹{(allPayments || []).reduce((sum, pay) => sum + Number(pay.amount || 0), 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-orange-500 h-2 rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${(() => {
                            const payments = (allPayments || []).reduce((sum, pay) => sum + Number(pay.amount || 0), 0);
                            return totalLoan > 0 ? Math.min((payments / totalLoan) * 100, 100) : 0;
                          })()}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Transactions */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-md border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">Recent Employee Expenses</h3>
                  <div className="flex items-center gap-2">
                    <select className="border border-gray-300 rounded-lg px-3 py-1 text-sm">
                      <option>This Month</option>
                      <option>Last Month</option>
                    </select>
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 text-sm font-medium text-gray-600">Employee Name</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-600">Category</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-600">Date</th>
                        <th className="text-right py-3 text-sm font-medium text-gray-600">Amount</th>
                        <th className="text-center py-3 text-sm font-medium text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(branchEmployeeExpenses || []).slice(0, 5).length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-8 text-gray-500">No recent employee expenses</td>
                        </tr>
                      ) : (
                        (branchEmployeeExpenses || []).slice(0, 5).map((expense, index) => (
                          <tr key={expense._id || index} className="hover:bg-gray-50">
                            <td className="py-3 text-sm font-medium text-gray-900">{expense.employeeName}</td>
                            <td className="py-3 text-sm text-gray-600">{expense.category}</td>
                            <td className="py-3 text-sm text-gray-600">
                              {new Date(expense.date).toLocaleDateString('en-IN')}
                            </td>
                            <td className="py-3 text-sm text-right font-semibold text-gray-900">
                              ₹{Number(expense.amount || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Completed
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-6">Quick Actions</h3>
                
                <div className="space-y-3">
                  <button 
                    onClick={() => setSelectedView('loans')}
                    className="w-full flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900">Manage Loans</p>
                      <p className="text-xs text-gray-500">View and manage loans</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => setSelectedView('empExpenses')}
                    className="w-full flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900">Employee Expenses</p>
                      <p className="text-xs text-gray-500">Track employee expenses</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => setSelectedView('expenses')}
                    className="w-full flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zm14 5H2v5a2 2 0 002 2h12a2 2 0 002-2V9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900">Branch Expenses</p>
                      <p className="text-xs text-gray-500">Manage branch expenses</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => setSelectedView('categoryMaster')}
                    className="w-full flex items-center gap-3 p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900">Category Manager</p>
                      <p className="text-xs text-gray-500">Organize categories</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => setSelectedView('employees')}
                    className="w-full flex items-center gap-3 p-3 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900">Employees</p>
                      <p className="text-xs text-gray-500">Manage employees</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loans View - existing code */}
        {selectedView === 'loans-dummy' && (
          <div>
            {/* Financial Summary */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Financial Health Summary</h3>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Income vs Expenses */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-4">Income vs Expenses</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                        <div>
                          <p className="text-sm font-medium text-green-700">Total Income</p>
                          <p className="text-lg font-bold text-green-600">
                            ₹{(allPayments || []).reduce((sum, pay) => sum + Number(pay.amount || 0), 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-green-100 p-2 rounded-full">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                        <div>
                          <p className="text-sm font-medium text-red-700">Total Expenses</p>
                          <p className="text-lg font-bold text-red-600">
                            ₹{([...(branchExpenses || []), ...(branchEmployeeExpenses || [])]).reduce((sum, exp) => sum + Number(exp.amount || 0), 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-red-100 p-2 rounded-full">
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                          </svg>
                        </div>
                      </div>
                      <div className={`flex items-center justify-between p-3 rounded-lg border-l-4 ${(() => {
                        const income = (allPayments || []).reduce((sum, pay) => sum + Number(pay.amount || 0), 0);
                        const expenses = ([...(branchExpenses || []), ...(branchEmployeeExpenses || [])]).reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
                        const net = income - expenses;
                        return net >= 0 ? 'bg-blue-50 border-blue-500' : 'bg-orange-50 border-orange-500';
                      })()}`}>
                        <div>
                          <p className={`text-sm font-medium ${(() => {
                            const income = (allPayments || []).reduce((sum, pay) => sum + Number(pay.amount || 0), 0);
                            const expenses = ([...(branchExpenses || []), ...(branchEmployeeExpenses || [])]).reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
                            const net = income - expenses;
                            return net >= 0 ? 'text-blue-700' : 'text-orange-700';
                          })()}`}>
                            Net Profit/Loss
                          </p>
                          <p className={`text-lg font-bold ${(() => {
                            const income = (allPayments || []).reduce((sum, pay) => sum + Number(pay.amount || 0), 0);
                            const expenses = ([...(branchExpenses || []), ...(branchEmployeeExpenses || [])]).reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
                            const net = income - expenses;
                            return net >= 0 ? 'text-blue-600' : 'text-orange-600';
                          })()}`}>
                            ₹{(() => {
                              const income = (allPayments || []).reduce((sum, pay) => sum + Number(pay.amount || 0), 0);
                              const expenses = ([...(branchExpenses || []), ...(branchEmployeeExpenses || [])]).reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
                              return Math.abs(income - expenses).toLocaleString();
                            })()}
                          </p>
                        </div>
                        <div className={`p-2 rounded-full ${(() => {
                          const income = (allPayments || []).reduce((sum, pay) => sum + Number(pay.amount || 0), 0);
                          const expenses = ([...(branchExpenses || []), ...(branchEmployeeExpenses || [])]).reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
                          const net = income - expenses;
                          return net >= 0 ? 'bg-blue-100' : 'bg-orange-100';
                        })()}`}>
                          <svg className={`w-5 h-5 ${(() => {
                            const income = (allPayments || []).reduce((sum, pay) => sum + Number(pay.amount || 0), 0);
                            const expenses = ([...(branchExpenses || []), ...(branchEmployeeExpenses || [])]).reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
                            const net = income - expenses;
                            return net >= 0 ? 'text-blue-600' : 'text-orange-600';
                          })()}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
                      </div>
                    </div>
                  </div>

                  {/* Loan Portfolio Health */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-4">Loan Portfolio Health</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                        <div>
                          <p className="text-sm font-medium text-blue-700">Active Loans</p>
                          <p className="text-lg font-bold text-blue-600">{dataToUse.length}</p>
              </div>
                        <div className="bg-blue-100 p-2 rounded-full">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
              </div>
              </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                        <div>
                          <p className="text-sm font-medium text-green-700">Total Loan Amount</p>
                          <p className="text-lg font-bold text-green-600">₹{totalLoan.toLocaleString()}</p>
                        </div>
                        <div className="bg-green-100 p-2 rounded-full">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                        <div>
                          <p className="text-sm font-medium text-purple-700">Monthly EMI Collection</p>
                          <p className="text-lg font-bold text-purple-600">₹{totalEMI.toLocaleString()}</p>
                        </div>
                        <div className="bg-purple-100 p-2 rounded-full">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button 
                  onClick={() => setSelectedView('loans')}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span className="font-semibold">Manage Loans</span>
                  </div>
                </button>
                <button 
                  onClick={() => setSelectedView('empExpenses')}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="font-semibold">Employee Expenses</span>
                  </div>
                </button>
                <button 
                  onClick={() => setSelectedView('expenses')}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="font-semibold">Branch Expenses</span>
                  </div>
                </button>
                <button 
                  onClick={() => setSelectedView('categoryMaster')}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span className="font-semibold">Category Manager</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Category Master → Employee Totals Modal */}
        <Modal open={showCatEmpTotals} onClose={() => setShowCatEmpTotals(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 mx-auto" style={{ width: '1000px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-blue-700">Employee Expense Totals - {branchName.toUpperCase()}</h3>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowCatEmpTotals(false)}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Category</label>
                <select className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400" value={totalsCategory} onChange={(e)=>setTotalsCategory(e.target.value)}>
                  <option value="All">All Categories</option>
                  {categoryMasterCategories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Month</label>
                <select className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400" value={totalsMonth} onChange={(e)=>setTotalsMonth(e.target.value)}>
                  <option value="">All Months</option>
                  {Array.from(new Set((branchEmployeeExpenses||[]).map(e => new Date(e.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })))).sort().map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Date</label>
                <input type="date" className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400" value={totalsDate} onChange={(e)=>setTotalsDate(e.target.value)} />
              </div>
            </div>

            {(() => {
              // Filter expenses
              const filteredExpenses = (branchEmployeeExpenses||[])
                .filter(e => totalsCategory === 'All' || e.category === totalsCategory)
                .filter(e => !totalsMonth || new Date(e.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) === totalsMonth)
                .filter(e => !totalsDate || new Date(e.date).toISOString().slice(0,10) === totalsDate);
              
              // Group by employee
              const rows = filteredExpenses.reduce((map, e) => { 
                const key = e.employeeName || 'Unknown'; 
                if (!map[key]) map[key] = { total: 0, count: 0, expenses: [] };
                map[key].total += Number(e.amount||0);
                map[key].count += 1;
                map[key].expenses.push(e);
                return map; 
              }, {});
              
              const entries = Object.entries(rows).sort((a, b) => b[1].total - a[1].total);
              const grandTotal = entries.reduce((s, [,data])=> s + data.total, 0);
              const totalEntries = entries.reduce((s, [,data])=> s + data.count, 0);
              
              return (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm text-gray-600 mb-1">Total Employees</p>
                      <p className="text-2xl font-bold text-blue-700">{entries.length}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
                      <p className="text-2xl font-bold text-green-700">{totalEntries}</p>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                      <p className="text-sm text-gray-600 mb-1">Grand Total</p>
                      <p className="text-2xl font-bold text-emerald-700">₹{grandTotal.toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-blue-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Employee Name</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">No. of Expenses</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total Amount (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entries.length === 0 ? (
                            <tr><td colSpan="3" className="px-4 py-6 text-center text-gray-500">No data for selected filters</td></tr>
                          ) : entries.map(([name, data]) => (
                            <tr key={name} className="even:bg-gray-50 hover:bg-blue-50 transition-colors">
                              <td className="px-4 py-3 text-base text-gray-800 font-medium">{name}</td>
                              <td className="px-4 py-3 text-base text-center text-gray-600">{data.count}</td>
                              <td className="px-4 py-3 text-base text-right font-semibold text-emerald-700">₹{data.total.toLocaleString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-blue-50 border-t-2 border-blue-200">
                          <tr>
                            <td className="px-4 py-3 text-right font-bold text-gray-800">Grand Total</td>
                            <td className="px-4 py-3 text-center font-bold text-gray-800">{totalEntries}</td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-700 text-lg">₹{grandTotal.toLocaleString('en-IN')}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </>
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
                  
                  // Check if category already exists
                  if (categoryMasterCategories.includes(name)) {
                    alert('Category already exists!');
                    return;
                  }
                  
                  // Add to manually added categories for persistence
                  setAddedCategories(prev => new Set([...prev, name]));
                  
                  // Add category to current branch only - completely separate from other branches
                  setCategoryMasterCategories(prev => [...prev, name]);
                  setNewCategoryName(''); // Reset form
                  setAddCategoryOpen(false);
                  console.log('Added new category:', name, 'to branch:', branchName);
                }}
              >
                Add
              </button>
            </div>
          </div>
        </Modal>

        {/* Category Master → Individual Category (Employee Expenses) - Enhanced Modal */}
        <Modal open={!!masterCategoryDetail} onClose={() => setMasterCategoryDetail(null)}>
          {masterCategoryDetail && (
            <div className="bg-white rounded-2xl shadow-2xl p-6 mx-auto" style={{ width: '90vw', maxWidth: '1200px', height: '85vh', maxHeight: '800px', display: 'flex', flexDirection: 'column' }}>
              <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h2 className="text-xl font-bold text-blue-700">{masterCategoryDetail} Entries</h2>
              </div>

              {/* Summary Cards */}
              {(() => {
                // Get expenses for the selected category
                const regularExpenses = (branchExpenses || [])
                  .filter(e => e.category === masterCategoryDetail);
                const employeeExpenses = (branchEmployeeExpenses || [])
                  .filter(e => e.category === masterCategoryDetail);
                
                const regularTotal = regularExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
                const employeeTotal = employeeExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
                const grandTotal = regularTotal + employeeTotal;
                
                return (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 flex-shrink-0">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h3 className="text-sm font-semibold text-blue-700 mb-1">Total Entries</h3>
                      <p className="text-2xl font-bold text-blue-600">{regularExpenses.length + employeeExpenses.length}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <h3 className="text-sm font-semibold text-green-700 mb-1">Regular Expenses</h3>
                      <p className="text-2xl font-bold text-green-600">{regularExpenses.length}</p>
                      <p className="text-sm text-green-600">₹{regularTotal.toLocaleString()}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <h3 className="text-sm font-semibold text-purple-700 mb-1">Employee Expenses</h3>
                      <p className="text-2xl font-bold text-purple-600">{employeeExpenses.length}</p>
                      <p className="text-sm text-purple-600">₹{employeeTotal.toLocaleString()}</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                      <h3 className="text-sm font-semibold text-orange-700 mb-1">Grand Total</h3>
                      <p className="text-2xl font-bold text-orange-600">₹{grandTotal.toLocaleString()}</p>
                    </div>
                  </div>
                );
              })()}
              
              {/* Enhanced Expenses Table */}
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
                          const regularExpenses = (branchExpenses || [])
                            .filter(e => e.category === masterCategoryDetail)
                            .sort((a, b) => new Date(b.date) - new Date(a.date));
                          const employeeExpenses = (branchEmployeeExpenses || [])
                            .filter(e => e.category === masterCategoryDetail)
                            .sort((a, b) => new Date(b.date) - new Date(a.date));
                          
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
                                        className="text-red-600 hover:underline text-sm"
                                        onClick={() => {
                                          if (window.confirm('Delete this expense?')) {
                                            // Handle delete functionality for regular expenses
                                            console.log('Delete regular expense:', expense._id);
                                          }
                                        }}
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </td>
                            </tr>
                          ))}
                              
                              {/* Employee Expenses */}
                              {employeeExpenses.map((expense, index) => (
                                <tr key={`employee-${index}`} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {new Date(expense.date).toLocaleDateString('en-IN')}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    <div className="flex items-center gap-2">
                                      <span>{expense.employeeName || '-'}</span>
                                      <button
                                        className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                                        title="View employee details"
                                        onClick={() => {
                                          // Get all employee expenses for the same category and date
                                          const sameDateExpenses = (branchEmployeeExpenses || [])
                                            .filter(e => e.category === expense.category && 
                                              new Date(e.date).toISOString().split('T')[0] === new Date(expense.date).toISOString().split('T')[0]);
                                          
                                          setSelectedEmployeeDetails({
                                            category: expense.category,
                                            date: expense.date,
                                            employees: sameDateExpenses.map(emp => ({
                                              name: emp.employeeName,
                                              amount: Number(emp.amount || 0),
                                              id: emp._id,
                                              description: emp.description || ''
                                            })),
                                            totalAmount: sameDateExpenses.reduce((sum, emp) => sum + Number(emp.amount || 0), 0)
                                          });
                                          setEmployeeDetailsModalOpen(true);
                                        }}
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
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                                    ₹{Number(expense.amount || 0).toLocaleString('en-IN')}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <div className="flex gap-2 justify-center">
                                      <button
                                        className="text-red-600 hover:underline text-sm"
                                        onClick={() => {
                                          if (window.confirm('Delete this employee expense?')) {
                                            // Handle delete functionality for employee expenses
                                            console.log('Delete employee expense:', expense._id);
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
                              {(!regularExpenses.length && !employeeExpenses.length) && (
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
                              const regularTotal = (branchExpenses || [])
                                .filter(e => e.category === masterCategoryDetail)
                                .reduce((sum, exp) => sum + (exp.amount || 0), 0);
                              const employeeTotal = (branchEmployeeExpenses || [])
                                .filter(e => e.category === masterCategoryDetail)
                                .reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
                              const grandTotal = regularTotal + employeeTotal;
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

        {/* Employee Details Modal */}
        <Modal open={employeeDetailsModalOpen} onClose={() => setEmployeeDetailsModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 mx-auto" style={{ width: '700px', maxWidth: '90vw' }}>
            <h2 className="text-xl font-bold mb-4 text-blue-700">
              Employee Details - {selectedEmployeeDetails?.category}
            </h2>
            <p className="text-gray-600 mb-4">
              Date: {selectedEmployeeDetails?.date ? new Date(selectedEmployeeDetails.date).toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : ''}
            </p>
            
            <style>{`
              .employee-details-scroll::-webkit-scrollbar {
                width: 6px;
              }
              .employee-details-scroll::-webkit-scrollbar-track {
                background: #f3f4f6;
              }
              .employee-details-scroll::-webkit-scrollbar-thumb {
                background: #9ca3af;
                border-radius: 3px;
              }
              .employee-details-scroll::-webkit-scrollbar-thumb:hover {
                background: #6b7280;
              }
            `}</style>
            <div 
              className="overflow-x-auto max-h-96 overflow-y-auto employee-details-scroll"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#9ca3af #f3f4f6'
              }}
            >
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-blue-50 sticky top-0">
                  <tr>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Employee Name</th>
                    <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-700">Amount (₹)</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEmployeeDetails?.employees && selectedEmployeeDetails.employees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 font-medium">
                        {employee.name}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-right font-medium">
                        ₹{employee.amount.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                            onClick={async () => {
                              if (window.confirm('Are you sure you want to delete this employee expense?')) {
                                try {
                                  await axios.delete(api.delete(`/api/employee-expenses/${employee.id}`));
                                  await loadBranchEmployeeExpenses();
                                  setEmployeeDetailsModalOpen(false);
                                  alert('Employee expense deleted successfully');
                                } catch (error) {
                                  console.error('Error deleting employee expense:', error);
                                  alert('Error deleting employee expense: ' + (error.response?.data?.message || error.message));
                                }
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
                <tfoot className="bg-green-50 sticky bottom-0">
                  <tr>
                    <td className="border border-gray-300 px-4 py-3 font-bold text-gray-700">
                      Total:
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-right font-bold text-green-600">
                      ₹{selectedEmployeeDetails?.totalAmount ? selectedEmployeeDetails.totalAmount.toLocaleString() : 0}
                    </td>
                    <td className="border border-gray-300 px-4 py-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                className="bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                onClick={() => setEmployeeDetailsModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
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
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-emerald-700">Add Employee Expense</h2>
                  <button className="text-gray-500 hover:text-gray-700" onClick={closeModals}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
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
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-emerald-700">Edit Employee Expense</h2>
                  <button className="text-gray-500 hover:text-gray-700" onClick={closeModals}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
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
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Customer</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Place</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Mobile</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700 uppercase">Loan</th>
                      <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase">Total Loans</th>
                      <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Array.from(new Map(filteredData.map(e => [e.customer, e])).values()).map((entry) => {
                      const customerLoans = branchData.filter(x => x.customer === entry.customer);
                      const loansCount = customerLoans.length;
                      const totalLoanAmount = customerLoans.reduce((sum, loan) => sum + Number(loan.loan || 0), 0);
                      return (
                        <tr key={entry.customer} className="hover:bg-purple-50 transition-colors">
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">{new Date(entry.date).toLocaleDateString('en-IN')}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{entry.customer}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">{entry.place}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">{entry.mobile}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-semibold text-green-600">₹{totalLoanAmount.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-center text-gray-600">{loansCount}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-center">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => openCustomerDetails(entry)}
                                className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded transition-all"
                                title="View details"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleEdit(entry)}
                                className="p-1.5 text-green-600 hover:text-green-900 hover:bg-green-100 rounded transition-all"
                                title="Edit entry"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(entry._id)}
                                className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-100 rounded transition-all"
                                title="Delete entry"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
                      <p className="text-gray-500 text-sm">{(branchExpenses||[]).filter(e => e.category === cat).length + (branchEmployeeExpenses||[]).filter(e => e.category === cat).length} entries</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-gray-200 rounded" title="View" onClick={() => setMasterCategoryDetail(cat)}>
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      </button>
                      <button className="p-2 hover:bg-gray-200 rounded" title="Edit" onClick={async () => { 
                        const newName = prompt('Rename category', cat); 
                        if (!newName || newName === cat) return; 
                        
                        try {
                          // Update category in all related expenses
                          await updateCategoryInExpenses(cat, newName);
                          
                          // Update local state
                          setCategoryMasterCategories(prev => prev.map(c => c === cat ? newName : c));
                          alert('Category renamed successfully');
                        } catch (error) {
                          console.error('Error renaming category:', error);
                          alert('Error renaming category: ' + (error.response?.data?.message || error.message));
                        }
                      }}>
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button 
                        className="p-2 hover:bg-red-100 rounded border border-red-200 hover:border-red-300" 
                        title="Delete Category"
                        onClick={async () => { 
                          // Count expenses that will be deleted
                          const branchExpCount = (branchExpenses || []).filter(exp => 
                            exp.category === cat && 
                            exp.branch && 
                            exp.branch.toLowerCase() === branchName.toLowerCase()
                          ).length;
                          
                          const empExpCount = (branchEmployeeExpenses || []).filter(exp => 
                            exp.category === cat && 
                            exp.branch && 
                            exp.branch.toLowerCase() === branchName.toLowerCase()
                          ).length;
                          
                          const totalExpenses = branchExpCount + empExpCount;
                          
                          const confirmMessage = `Delete category "${cat}"?\n\nThis will delete:\n- ${branchExpCount} branch expenses\n- ${empExpCount} employee expenses\n- Total: ${totalExpenses} expenses\n\nThis action cannot be undone.`;
                          
                          if (!window.confirm(confirmMessage)) return; 
                          
                          try {
                            console.log('Starting deletion for category:', cat);
                            
                            // Delete all expenses with this category for current branch
                            await deleteCategoryAndExpenses(cat);
                            
                            // Add to deleted categories set to prevent re-adding (for default categories)
                            setDeletedCategories(prev => new Set([...prev, cat.toLowerCase()]));
                            
                            // Remove from added categories if it was manually added
                            setAddedCategories(prev => {
                              const newSet = new Set(prev);
                              newSet.delete(cat);
                              return newSet;
                            });
                            
                            // Update local state - remove from categories list
                            setCategoryMasterCategories(prev => prev.filter(c => c !== cat));
                            
                            alert(`Category "${cat}" and ${totalExpenses} related expenses deleted successfully from ${branchName} branch.`);
                          } catch (error) {
                            console.error('Error deleting category:', error);
                            alert('Error deleting category: ' + (error.response?.data?.message || error.message));
                          }
                        }}
                      >
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
                <select className="border-2 border-gray-200 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent" value={expenseForm.category} onChange={(e)=>setExpenseForm({...expenseForm, category: e.target.value})} required>
                  <option value="">Select Category</option>
                  {categoryMasterCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
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
