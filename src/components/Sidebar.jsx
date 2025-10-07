import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
export default function Sidebar({ categories, selected, onSelect, branches }) {
  const [open, setOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <aside className="w-56 bg-white shadow h-screen fixed left-0 top-0 flex flex-col z-50">
      <div className="p-4 font-bold text-lg border-b">Expenses</div>
      <nav className="flex-1 overflow-y-auto">
        {/* Indirect Exp collapsible */}
        <button
          className={`w-full flex items-center justify-between text-left px-4 py-2 hover:bg-gray-100 ${selected === 'Indirect Exp' ? 'bg-gray-100 font-bold' : ''}`}
          onClick={() => onSelect('Indirect Exp')}
        >
          <span>Indirect Exp</span>
        </button>
          {/* Category list removed as requested */}
        {/* Branch collapsible */}
        <button
          className={`w-full flex items-center justify-between text-left px-4 py-2 hover:bg-gray-100 ${branchOpen ? 'bg-gray-100' : ''}`}
          onClick={() => setBranchOpen(b => !b)}
        >
          <span>Branch</span>
          <span className={`transition-transform duration-200 ${branchOpen ? 'rotate-90' : ''}`}>▶</span>
        </button>
        {branchOpen && (
          <div className="ml-2">
            <button
              className="w-full text-left px-4 py-2 hover:bg-gray-100 font-semibold"
              onClick={() => navigate('/branches')}
            >
              All Branches
            </button>
            {branches.map(branch => (
              <button
                key={branch}
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={() => navigate(`/branches/${branch.toLowerCase()}`)}
              >
                {branch}
              </button>
            ))}
          </div>
        )}
      </nav>
    </aside>
  );
}
