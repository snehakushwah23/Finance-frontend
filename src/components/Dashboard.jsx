import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { api } from '../config/api';

export default function Dashboard({ categories, branches, expenses }) {
  const [customerExpenses, setCustomerExpenses] = useState([]);
  const [branchEntries, setBranchEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        // Load customer/employee expenses
        const custExpRes = await axios.get(api.get('/api/customer-expenses'));
        setCustomerExpenses(custExpRes.data || []);

        // Load all branch entries - try general endpoint first, then branch-specific
        try {
          console.log('Loading branch entries from general endpoint...');
          const generalRes = await axios.get(api.get('/api/branch-entries'));
          setBranchEntries(generalRes.data || []);
          console.log('Loaded entries from general endpoint:', generalRes.data);
        } catch (generalErr) {
          console.log('General branch entries API failed, trying branch-specific:', generalErr);
          
          // Fallback to branch-specific loading
        if (branches && branches.length > 0) {
            console.log('Loading branch entries for branches:', branches);
          const branchPromises = branches.map(branch => 
              axios.get(api.get(`/api/branch-entries/${branch.toLowerCase()}`))
          );
          const branchResults = await Promise.all(branchPromises);
          const allEntries = branchResults.flatMap(res => res.data || []);
            console.log('Loaded branch entries from individual branches:', allEntries);
          setBranchEntries(allEntries);
          } else {
            console.log('No branches available for loading entries');
            setBranchEntries([]);
          }
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setBranchEntries([]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branches.length]);

  // Calculate financial summary
  const indirectSummary = categories.reduce((acc, category) => {
    const categoryExpenses = expenses.filter(exp => exp.category === category);
    const total = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    return { ...acc, [category]: total };
  }, {});
  const totalIndirect = Object.values(indirectSummary).reduce((sum, val) => sum + val, 0);

  const employeeSummary = {};
  customerExpenses.forEach(exp => {
    if (!employeeSummary[exp.customerName]) {
      employeeSummary[exp.customerName] = 0;
    }
    employeeSummary[exp.customerName] += exp.amount;
  });
  const totalEmployeeExpenses = Object.values(employeeSummary).reduce((sum, val) => sum + val, 0);

  const totalBranches = branches.length;
  
  // Calculate unique customers (excluding payments) - same logic as LoansToCustomerPage
  console.log('=== CUSTOMER COUNT DEBUG START ===');
  console.log('Available branches:', branches);
  console.log('Total branchEntries received:', branchEntries.length);
  console.log('All branchEntries:', branchEntries);
  
  // First filter: Only entries from branches that actually exist
  const validBranchEntries = branchEntries.filter(entry => {
    const branchExists = branches.some(branch => 
      entry.branch && branch.toLowerCase() === entry.branch.toLowerCase()
    );
    if (!branchExists) {
      console.log(`⚠️ Skipping entry - Branch "${entry.branch}" not found in branches list`);
    }
    return branchExists;
  });
  
  console.log('Valid branch entries (from existing branches only):', validBranchEntries.length);
  
  // Second filter: Exclude payments
  const loanEntries = validBranchEntries.filter(entry => {
    const isNotPayment = entry.place !== 'Payment';
    console.log(`Entry: ${entry.customer} | Branch: ${entry.branch} | Place: ${entry.place} | Is Loan: ${isNotPayment}`);
    return isNotPayment;
  });
  
  console.log('Filtered loanEntries (non-payments from valid branches):', loanEntries);
  console.log('Total loan entries:', loanEntries.length);
  
  const customerNames = loanEntries.map(entry => entry.customer);
  console.log('All customer names (with duplicates):', customerNames);
  
  const uniqueCustomers = [...new Set(customerNames)].filter(Boolean);
  console.log('Unique customers (after Set + filter):', uniqueCustomers);
  
  const totalCustomers = uniqueCustomers.length;
  console.log('FINAL CUSTOMER COUNT:', totalCustomers);
  console.log('=== CUSTOMER COUNT DEBUG END ===');
  
  // Calculate total loans (sum of all loan amounts for non-payment entries)
  const totalLoans = loanEntries.reduce((sum, entry) => sum + (Number(entry.loan) || 0), 0);

  // Calculate total income (loans + employee expenses)
  const totalIncome = totalLoans + totalEmployeeExpenses;
  const totalExpense = totalIndirect;
  const totalSavings = totalIncome - totalExpense;

  // Recent transactions (last 5 employee expenses)
  const recentTransactions = customerExpenses
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  // Calculate monthly cashflow data
  const getMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = {};
    
    // Initialize all months
    months.forEach(month => {
      monthlyData[month] = { income: 0, expense: 0 };
    });

    // Calculate employee expenses by month
    customerExpenses.forEach(exp => {
      const date = new Date(exp.date);
      const month = months[date.getMonth()];
      if (monthlyData[month]) {
        monthlyData[month].income += exp.amount;
      }
    });

    // Calculate indirect expenses by month
    expenses.forEach(exp => {
      const date = new Date(exp.date);
      const month = months[date.getMonth()];
      if (monthlyData[month]) {
        monthlyData[month].expense += exp.amount;
      }
    });

    return monthlyData;
  };

  const monthlyData = getMonthlyData();
  const maxValue = Math.max(...Object.values(monthlyData).flatMap(m => [m.income, m.expense]));


  if (loading) {
    return (
      <div className="flex-1 p-8 ml-56 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-xl text-gray-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 ml-56 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Employee Expenses Card */}
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Employee Expenses</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalEmployeeExpenses.toLocaleString('en-IN')}</p>
              <p className="text-xs text-gray-500 mt-1">{Object.keys(employeeSummary).length} Employees</p>
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


        {/* Total Branches Card */}
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Branches</p>
              <p className="text-2xl font-bold text-gray-900">{totalBranches}</p>
              <p className="text-xs text-gray-500 mt-1">Active Locations</p>
            </div>
            <div className="flex items-center text-purple-600">
              <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">Locations</span>
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
                {loading ? 'Loading...' : (totalCustomers > 0 ? totalCustomers : 'No Data')}
              </p>
              <p className="text-xs text-gray-500 mt-1">Across All Branches</p>
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
            <div className="text-3xl font-bold text-gray-900 mb-2">₹{totalEmployeeExpenses.toLocaleString('en-IN')}</div>
            <div className="text-sm text-gray-600">Total Employee Expenses</div>
        </div>

          {/* Employee Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{Object.keys(employeeSummary).length}</div>
              <div className="text-sm text-green-700">Employees</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Object.keys(employeeSummary).length > 0 ? Math.round(totalEmployeeExpenses / Object.keys(employeeSummary).length) : 0}
              </div>
              <div className="text-sm text-blue-700">Avg per Employee</div>
            </div>
        </div>

          {/* Visual Progress */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Employee Expenses</span>
              <span className="text-sm font-bold text-gray-900">₹{totalEmployeeExpenses.toLocaleString('en-IN')}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 rounded-full h-3 transition-all duration-500" 
                style={{ width: '100%' }}
              ></div>
            </div>
            <div className="text-center text-xs text-gray-500">
              {Object.keys(employeeSummary).length} employees contributing to total expenses
            </div>
        </div>
      </div>

        {/* Branches Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Branches Overview</h3>
            <select className="border border-gray-300 rounded-lg px-3 py-1 text-sm">
              <option>All Branches</option>
              <option>Active Only</option>
            </select>
          </div>
          
          {/* Branches Stats */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <span className="text-sm font-medium text-gray-700">Total Branches</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">{totalBranches}</div>
                <div className="text-xs text-gray-500">Active locations</div>
            </div>
          </div>
          
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span className="text-sm font-medium text-gray-700">Total Customers</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {loading ? 'Loading...' : (totalCustomers > 0 ? totalCustomers : 'No Data')}
                </div>
                <div className="text-xs text-gray-500">Across all branches</div>
              </div>
            </div>
          </div>
          
          {/* Branches Visual */}
          <div className="mt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">{totalBranches}</div>
                <div className="text-sm text-purple-700">Branches</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {loading ? '...' : (totalCustomers > 0 ? totalCustomers : '0')}
              </div>
                <div className="text-sm text-orange-700">Customers</div>
            </div>
          </div>
        </div>

          {/* Customer Distribution */}
          {totalCustomers > 0 && (
            <div className="mt-6">
              <div className="text-sm font-medium text-gray-700 mb-3">Customer Distribution</div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Avg per Branch</span>
                  <span className="text-xs font-medium text-gray-900">
                    {totalBranches > 0 ? Math.round(totalCustomers / totalBranches) : 0} customers
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-orange-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${totalBranches > 0 ? Math.min((totalCustomers / (totalBranches * 10)) * 100, 100) : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-md border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Recent Transactions</h3>
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
                  <th className="text-left py-3 text-sm font-medium text-gray-600">Transaction Name</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-600">Date & Time</th>
                  <th className="text-right py-3 text-sm font-medium text-gray-600">Amount</th>
                  <th className="text-center py-3 text-sm font-medium text-gray-600">Status</th>
              </tr>
            </thead>
              <tbody className="divide-y divide-gray-100">
                {recentTransactions.length === 0 ? (
                <tr>
                    <td colSpan="4" className="text-center py-8 text-gray-500">No recent transactions</td>
                </tr>
              ) : (
                  recentTransactions.map((transaction, index) => (
                    <tr key={transaction._id} className="hover:bg-gray-50">
                      <td className="py-3 text-sm font-medium text-gray-900">{transaction.customerName}</td>
                      <td className="py-3 text-sm text-gray-600">
                        {new Date(transaction.date).toLocaleDateString()} {new Date(transaction.date).toLocaleTimeString()}
                      </td>
                      <td className="py-3 text-sm text-right font-semibold text-gray-900">₹{transaction.amount.toLocaleString('en-IN')}</td>
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
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Recent Activity</h3>
          
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-3 font-medium">Today</div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">New employee expense added</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">Branch entry updated</p>
                <p className="text-xs text-gray-500">4 hours ago</p>
              </div>
            </div>

            <div className="text-sm text-gray-600 mb-3 font-medium mt-6">Yesterday</div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">Dashboard data refreshed</p>
                <p className="text-xs text-gray-500">1 day ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

