import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
export default function Sidebar({ categories, selected, onSelect }) {
  const navigate = useNavigate();
  const [indirectExpOpen, setIndirectExpOpen] = useState(false);
  const [branchesOpen, setBranchesOpen] = useState(false);

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

  return (
    <aside className="w-56 bg-white shadow h-screen fixed left-0 top-0 flex flex-col z-50">
      <div className="p-4 font-bold text-lg border-b">Expenses</div>
      <nav className="flex-1 overflow-y-auto">
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
                  navigate('/customer-expenses');
                }}
              >
                Employee Expenses
              </button>
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-600"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/employee-master');
                }}
              >
                Employee Master
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
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}
