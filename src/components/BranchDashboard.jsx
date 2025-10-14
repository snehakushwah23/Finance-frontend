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
    setSelectedCustomer(null);
    setEditingEntry(null);
    setPaymentEntry(null);
    setFormData({ date: '', customer: '', place: '', mobile: '', loan: '', interest: '', emi: '' });
    setPaymentData({ date: '', amount: '', customer: '' });
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

        {/* Customers View */}
        {selectedView === 'customers' && (
          <div className="text-center py-16">
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-16 h-16 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Customers</h2>
            <p className="text-gray-600 text-lg">Customer management coming soon...</p>
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
