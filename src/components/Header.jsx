import React from 'react';

export default function Header() {
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
        </div>
      </div>
    </header>
  );
}