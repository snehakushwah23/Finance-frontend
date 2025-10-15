import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function BranchSidebar({ branchName, onLogout, selectedView, onViewChange }) {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [openIndirect, setOpenIndirect] = useState(selectedView === 'employees' || selectedView === 'expenses' || selectedView === 'empExpenses' || selectedView === 'categoryMaster');

  const confirmLogout = () => {
    if (onLogout) {
      onLogout();
    }
    setShowLogoutModal(false);
  };

  return (
    <aside className="w-56 bg-white shadow h-screen fixed left-0 top-0 flex flex-col z-50">
      <div className="p-4 border-b">
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 w-12 h-12 rounded-xl flex items-center justify-center mb-3">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h2 className="font-bold text-sm text-gray-800 capitalize">{branchName} Branch</h2>
        <p className="text-xs text-gray-500 mt-1">Management Portal</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-3 mb-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3">Menu</p>
        </div>
        
        <button
          className={`w-full flex items-center text-left px-6 py-3 hover:bg-blue-50 ${selectedView === 'dashboard' ? 'bg-blue-100 font-semibold text-blue-700 border-l-4 border-blue-600' : 'text-gray-700'}`}
          onClick={() => onViewChange('dashboard')}
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>Dashboard</span>
        </button>

        

        {/* Indirect Expenses Group */}
        <div>
          <button
            className={`w-full flex items-center justify-between text-left px-6 py-3 hover:bg-blue-50 ${openIndirect ? 'text-blue-700' : 'text-gray-700'}`}
            onClick={() => setOpenIndirect(!openIndirect)}
          >
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l2-2 4 4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Indirect Expenses</span>
            </span>
            <svg className={`w-4 h-4 transition-transform ${openIndirect ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {openIndirect && (
            <div className="pl-10">
              <button
                className={`w-full flex items-center text-left px-6 py-2.5 hover:bg-blue-50 rounded ${selectedView === 'categoryMaster' ? 'bg-blue-100 font-semibold text-blue-700' : 'text-gray-700'}`}
                onClick={() => onViewChange('categoryMaster')}
              >
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
                </svg>
                <span>Category Master</span>
              </button>
              <button
                className={`w-full flex items-center text-left px-6 py-2.5 hover:bg-blue-50 rounded ${selectedView === 'employees' ? 'bg-blue-100 font-semibold text-blue-700' : 'text-gray-700'}`}
                onClick={() => onViewChange('employees')}
              >
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11c1.657 0 3-1.343 3-3S17.657 5 16 5s-3 1.343-3 3 1.343 3 3 3zM8 11c1.657 0 3-1.343 3-3S9.657 5 8 5 5 6.343 5 8s1.343 3 3 3zm0 2c-2.667 0-8 1.333-8 4v2h16v-2c0-2.667-5.333-4-8-4z" />
                </svg>
                <span>Employee Master</span>
              </button>
              <button
                className={`w-full flex items-center text-left px-6 py-2.5 hover:bg-blue-50 rounded ${selectedView === 'empExpenses' ? 'bg-blue-100 font-semibold text-blue-700' : 'text-gray-700'}`}
                onClick={() => onViewChange('empExpenses')}
              >
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2M4 6h16" />
                </svg>
                <span>Employee Expenses</span>
              </button>
            </div>
          )}
        </div>

        {/* Customers and Loans positioning */}
        <button
          className={`w-full flex items-center text-left px-6 py-3 hover:bg-blue-50 ${selectedView === 'customers' ? 'bg-blue-100 font-semibold text-blue-700 border-l-4 border-blue-600' : 'text-gray-700'}`}
          onClick={() => onViewChange('customers')}
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>Customers</span>
        </button>

        <button
          className={`w-full flex items-center text-left px-6 py-3 hover:bg-blue-50 ${selectedView === 'loans' ? 'bg-blue-100 font-semibold text-blue-700 border-l-4 border-blue-600' : 'text-gray-700'}`}
          onClick={() => onViewChange('loans')}
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Loans</span>
        </button>

      <button
        className={`w-full flex items-center text-left px-6 py-3 hover:bg-blue-50 ${selectedView === 'payments' ? 'bg-blue-100 font-semibold text-blue-700 border-l-4 border-blue-600' : 'text-gray-700'}`}
        onClick={() => onViewChange('payments')}
      >
        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
        <span>Payments</span>
      </button>

        <button
          className={`w-full flex items-center text-left px-6 py-3 hover:bg-blue-50 ${selectedView === 'reports' ? 'bg-blue-100 font-semibold text-blue-700 border-l-4 border-blue-600' : 'text-gray-700'}`}
          onClick={() => onViewChange('reports')}
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span>Reports</span>
        </button>
      </nav>

      {/* Logout Button */}
      <div className="border-t border-gray-200">
        <button
          className="w-full flex items-center text-left px-6 py-4 hover:bg-red-50 text-red-600 transition-colors"
          onClick={() => setShowLogoutModal(true)}
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="font-semibold">Logout</span>
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-2xl shadow-2xl p-6 mx-4" style={{ width: '400px', maxWidth: '90vw' }}>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-bold text-center text-gray-800 mb-2">Logout Confirmation</h2>
            <p className="text-center text-gray-600 mb-6">Are you sure you want to logout?</p>
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

