import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
export default function Sidebar({ categories, selected, onSelect, onLogout, branches = [] }) {
  const navigate = useNavigate();
  const [indirectExpOpen, setIndirectExpOpen] = useState(false);
  const [branchesOpen, setBranchesOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Load sidebar state from localStorage on component mount
  useEffect(() => {
    const savedIndirectExpOpen = localStorage.getItem('indirectExpOpen');
    const savedBranchesOpen = localStorage.getItem('branchesOpen');
    
    if (savedIndirectExpOpen !== null) {
      setIndirectExpOpen(JSON.parse(savedIndirectExpOpen));
    }
    if (savedBranchesOpen !== null) {
      setBranchesOpen(JSON.parse(savedBranchesOpen));
    }
  }, []);

  // Check current path and ensure appropriate menu is open
  useEffect(() => {
    const currentPath = window.location.pathname;
    
    // If we're on a branches-related page, ensure branches menu is open
    if (currentPath.includes('/branches')) {
      setBranchesOpen(true);
    }
    
    // If we're on an indirect exp related page, ensure indirect exp menu is open
    if (currentPath.includes('/indirect') || currentPath.includes('/customer-expenses')) {
      setIndirectExpOpen(true);
    }
  }, []);

  // Save sidebar state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('indirectExpOpen', JSON.stringify(indirectExpOpen));
  }, [indirectExpOpen]);

  useEffect(() => {
    localStorage.setItem('branchesOpen', JSON.stringify(branchesOpen));
  }, [branchesOpen]);

  const confirmLogout = () => {
    // Clear all localStorage data
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('loginTime');
    localStorage.removeItem('indirectExpOpen');
    localStorage.removeItem('branchesOpen');
    
    // Call parent logout handler if provided
    if (onLogout) {
      onLogout();
    }
    
    // Close modal
    setShowLogoutModal(false);
    
    // Force page reload to clear all state and redirect to login
    window.location.href = '/login';
  };

  return (
    <aside className="w-56 bg-white shadow h-screen fixed left-0 top-0 flex flex-col z-50">
      <div className="p-4 font-bold text-lg border-b">Expenses</div>
      <nav className="flex-1 overflow-y-auto">
        {/* Dashboard option */}
        <div>
          <button
            className={`w-full flex items-center text-left px-4 py-2 hover:bg-gray-100 ${selected === 'Dashboard' ? 'bg-blue-100 font-bold text-blue-700' : ''}`}
            onClick={() => {
              onSelect && onSelect('Dashboard');
              navigate('/dashboard');
            }}
          >
            <svg 
              className="w-5 h-5 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Dashboard</span>
          </button>
        </div>
        {/* Indirect Exp collapsible */}
        <div>
          <button
            className={`w-full flex items-center justify-between text-left px-4 py-2 hover:bg-gray-100 ${selected === 'Indirect Exp' ? 'bg-gray-100 font-bold' : ''}`}
            onClick={() => {
              setIndirectExpOpen(!indirectExpOpen);
              onSelect('Indirect Exp');
              navigate('/indirect');
            }}
          >
            <span>Indirect Exp</span>
            <svg 
              className={`w-4 h-4 transform transition-transform ${indirectExpOpen ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {indirectExpOpen && (
            <div className="ml-4">
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-600"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/employee-master');
                }}
              >
                Employee Master
              </button>
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-600"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/employee-expenses');
                }}
              >
                Employee Expenses
              </button>
            </div>
          )}
        </div>
        {/* Branches collapsible */}
        <div>
          <button
            className={`w-full flex items-center justify-between text-left px-4 py-2 hover:bg-gray-100 ${selected === 'Branches' ? 'bg-gray-100 font-bold' : ''}`}
            onClick={() => {
              setBranchesOpen(!branchesOpen);
              onSelect && onSelect('Branches');
              navigate('/branches');
            }}
          >
            <span>Branches</span>
            <svg 
              className={`w-4 h-4 transform transition-transform ${branchesOpen ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {branchesOpen && (
            <div className="ml-4">
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-600"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/branches/loans');
                }}
              >
                Loan to Customer
              </button>
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-600"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/branch-list');
                }}
              >
                Branch Login
              </button>
            </div>
          )}
        </div>
      </nav>
      
      {/* Logout Button */}
      <div className="border-t border-gray-200">
        <button
          className="w-full flex items-center text-left px-4 py-3 hover:bg-red-50 text-red-600 transition-colors"
          onClick={() => setShowLogoutModal(true)}
        >
          <svg 
            className="w-5 h-5 mr-2" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
            />
          </svg>
          <span className="font-semibold">Logout</span>
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-2xl shadow-2xl p-6 mx-4" style={{ width: '400px', maxWidth: '90vw' }}>
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg 
                  className="w-8 h-8 text-red-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                  />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-center text-gray-800 mb-2">
              Logout Confirmation
            </h2>

            {/* Message */}
            <p className="text-center text-gray-600 mb-6">
              Are you sure you want to logout?
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                onClick={() => setShowLogoutModal(false)}
              >
                No, Cancel
              </button>
              <button
                className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                onClick={confirmLogout}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
