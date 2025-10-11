import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { api } from '../config/api';

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ expenses: [], customerExpenses: [], branches: [] });
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debug search results
  useEffect(() => {
    if (showResults) {
      console.log('Search state:', {
        showResults,
        searchQuery,
        resultsCount: {
          expenses: searchResults.expenses.length,
          customerExpenses: searchResults.customerExpenses.length,
          branches: searchResults.branches.length
        }
      });
    }
  }, [showResults, searchResults, searchQuery]);

  // Search function
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults({ expenses: [], customerExpenses: [], branches: [] });
      setShowResults(false);
      return;
    }

    const searchData = async () => {
      setLoading(true);
      try {
        // Search expenses
        const expensesRes = await axios.get(api.get('/api/expenses/all'));
        const filteredExpenses = expensesRes.data.filter(exp => 
          exp.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          exp.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          exp.amount?.toString().includes(searchQuery)
        ).slice(0, 5); // Limit to 5 results

        // Search customer expenses
        const custExpRes = await axios.get(api.get('/api/customer-expenses'));
        const filteredEmployeeExpenses = custExpRes.data.filter(exp =>
          exp.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          exp.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          exp.amount?.toString().includes(searchQuery)
        ).slice(0, 5);

        // Search branches
        const branchesRes = await axios.get(api.get('/api/branches'));
        const filteredBranches = branchesRes.data.filter(branch =>
          branch.name.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 5);

        setSearchResults({
          expenses: filteredExpenses,
          customerExpenses: filteredEmployeeExpenses,
          branches: filteredBranches
        });
        console.log('Search results:', {
          expenses: filteredExpenses.length,
          customerExpenses: filteredEmployeeExpenses.length,
          branches: filteredBranches.length
        });
        setShowResults(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      searchData();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  return (
    <header className="fixed top-0 left-56 right-0 h-16 bg-white shadow-md z-40 flex items-center px-6">
      <div className="flex items-center gap-4 flex-1">
        <h1 className="text-xl font-bold text-gray-800">Finance Manager</h1>
        
        {/* Search Bar */}
        <div className="relative flex-1 max-w-2xl ml-8" ref={searchRef}>
          <div className="relative">
            <input
              type="text"
              placeholder="Search expenses, customers, categories, branches..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
            />
            <svg 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {loading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showResults && (searchResults.expenses.length > 0 || searchResults.customerExpenses.length > 0 || searchResults.branches.length > 0) && (
            <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50">
              {/* Expenses Results */}
              {searchResults.expenses.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Expenses</div>
                  {searchResults.expenses.map((exp, idx) => (
                    <button
                      key={`exp-${idx}`}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded-md transition-colors"
                      onClick={() => {
                        // Navigate to Indirect Exp page
                        navigate('/indirect', { state: { openCategory: exp.category } });
                        setShowResults(false);
                        setSearchQuery('');
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800">{exp.category}</div>
                          <div className="text-sm text-gray-600">{exp.description || 'No description'}</div>
                          <div className="text-xs text-gray-500">{exp.month} • {new Date(exp.date).toLocaleDateString()}</div>
                        </div>
                        <div className="text-lg font-bold text-blue-600">₹{exp.amount}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Employee Expenses Results */}
              {searchResults.customerExpenses.length > 0 && (
                <div className="p-2 border-t border-gray-200">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Employee Expenses</div>
                  {searchResults.customerExpenses.map((exp, idx) => (
                    <button
                      key={`custexp-${idx}`}
                      className="w-full text-left px-3 py-2 hover:bg-purple-50 rounded-md transition-colors"
                      onClick={() => {
                        navigate('/customer-expenses');
                        setShowResults(false);
                        setSearchQuery('');
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800">{exp.customerName}</div>
                          <div className="text-sm text-gray-600">{exp.category}</div>
                          <div className="text-xs text-gray-500">{new Date(exp.date).toLocaleDateString()}</div>
                        </div>
                        <div className="text-lg font-bold text-purple-600">₹{exp.amount}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Branches Results */}
              {searchResults.branches.length > 0 && (
                <div className="p-2 border-t border-gray-200">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Branches</div>
                  {searchResults.branches.map((branch, idx) => (
                    <button
                      key={`branch-${idx}`}
                      className="w-full text-left px-3 py-2 hover:bg-green-50 rounded-md transition-colors"
                      onClick={() => {
                        // Navigate to Branches page with specific branch to open
                        navigate('/branches', { state: { openBranch: branch.name } });
                        setShowResults(false);
                        setSearchQuery('');
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800 capitalize">{branch.name}</div>
                          <div className="text-xs text-gray-500">View branch details</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* No Results */}
          {showResults && searchQuery.length >= 2 && !loading && 
           searchResults.expenses.length === 0 && searchResults.customerExpenses.length === 0 && searchResults.branches.length === 0 && (
            <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 p-4 text-center text-gray-500">
              No results found for "{searchQuery}"
            </div>
           )}
        </div>
      </div>
    </header>
  );
}

