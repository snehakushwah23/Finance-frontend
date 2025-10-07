import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const items = useMemo(() => ([
    { label: 'Categories', keywords: ['category', 'categories', 'indirect', 'indirect exp'], action: () => navigate('/indirect') },
    { label: 'Employee Expenses', keywords: ['employee expense', 'employee expenses', 'customer expense'], action: () => navigate('/customer-expenses') },
    { label: 'Employee Master', keywords: ['employee master', 'staff', 'employees'], action: () => navigate('/employee-master') },
    { label: 'Branches', keywords: ['branch', 'branches', 'loans'], action: () => navigate('/branches') },
  ]), [navigate]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return items.filter(i => i.label.toLowerCase().includes(q) || i.keywords.some(k => k.includes(q)));
  }, [items, query]);
  return (
    <header className="fixed top-0 left-56 right-0 h-16 bg-white shadow-md z-40 flex items-center px-6">
      <div className="flex items-center gap-4 flex-1">
        <h1 className="text-xl font-bold text-gray-800">Finance Manager</h1>
        
        {/* Search Bar */}
        <div className="relative flex-1 max-w-2xl ml-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search expenses, customers, categories, branches..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && filtered[0]) {
                  filtered[0].action();
                  setOpen(false);
                }
              }}
            />
            <svg 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {open && filtered.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
              {filtered.map((i) => (
                <button
                  key={i.label}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { i.action(); setOpen(false); }}
                >
                  {i.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}