import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Sidebar({ categories, selected, onSelect, branches }) {
  const [indirectOpen, setIndirectOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <aside className="w-56 bg-white shadow h-screen fixed left-0 top-0 flex flex-col z-50">
      <div className="p-4 font-bold text-lg border-b">Finance Manager</div>
      <nav className="flex-1 overflow-y-auto">
        
        {/* Indirect Exp - Collapsible with categories */}
        <button
          className={`w-full flex items-center justify-between text-left px-4 py-2 hover:bg-gray-100 ${indirectOpen ? 'bg-gray-100 font-bold' : ''}`}
          onClick={() => setIndirectOpen(prev => !prev)}
        >
          <span>Indirect Exp</span>
          <span className={`transition-transform duration-200 ${indirectOpen ? 'rotate-90' : ''}`}>▶</span>
        </button>
        
        {indirectOpen && (
          <div className="ml-4 bg-gray-50">
            {/* Employee Expenses */}
            <button
              className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm"
              onClick={() => navigate('/employee-master')}
            >
              Employee Expenses
            </button>
            
            {/* Employee Master */}
            <button
              className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm"
              onClick={() => navigate('/employee-master')}
            >
              Employee Master
            </button>
            
            {/* Customer Expenses */}
            <button
              className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm"
              onClick={() => navigate('/customer-expenses')}
            >
              Customer Expenses
            </button>
            
            {/* All Categories */}
            {categories && categories.filter(cat => cat !== 'Total' && cat !== 'Indirect Exp').map(cat => (
              <button
                key={cat}
                className={`w-full text-left px-4 py-2 hover:bg-blue-50 text-sm ${selected === cat ? 'bg-blue-100 font-semibold' : ''}`}
                onClick={() => {
                  onSelect(cat);
                  navigate('/');
                }}
              >
                {cat}
              </button>
            ))}
            
            {/* Total */}
            <button
              className={`w-full text-left px-4 py-2 hover:bg-blue-50 text-sm font-semibold ${selected === 'Total' ? 'bg-blue-100' : ''}`}
              onClick={() => {
                onSelect('Total');
                navigate('/');
              }}
            >
              Total
            </button>
          </div>
        )}

        {/* Branch - Collapsible */}
        <button
          className={`w-full flex items-center justify-between text-left px-4 py-2 hover:bg-gray-100 ${branchOpen ? 'bg-gray-100 font-bold' : ''}`}
          onClick={() => setBranchOpen(prev => !prev)}
        >
          <span>Branches</span>
          <span className={`transition-transform duration-200 ${branchOpen ? 'rotate-90' : ''}`}>▶</span>
        </button>
        
        {branchOpen && (
          <div className="ml-4 bg-gray-50">
            {/* Branches - Main branches page */}
            <button
              className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm font-semibold"
              onClick={() => navigate('/branches')}
            >
              Branches
            </button>
            
            {/* Loans to Customer */}
            <button
              className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm"
              onClick={() => navigate('/branches/loans')}
            >
              Loans to Customer
            </button>
          </div>
        )}
      </nav>
    </aside>
  );
}
