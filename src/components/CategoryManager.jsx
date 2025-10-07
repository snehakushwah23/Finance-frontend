import React, { useState } from 'react';
import Modal from './Modal';
import ExpenseTable from './ExpenseTable';

export default function CategoryManager({ categories, setCategories, expenses, months, selectedMonth, setReload }) {
  const [showAllDays, setShowAllDays] = useState(false);
  const [catModal, setCatModal] = useState(null);
  const [editCat, setEditCat] = useState(null);
  const [newCat, setNewCat] = useState('');
  const [editCatName, setEditCatName] = useState('');
  const [showTotalModal, setShowTotalModal] = useState(false);
  const [totalMonth, setTotalMonth] = useState(months[0]);
  const [totalDate, setTotalDate] = useState('');
  const [totalAmount, setTotalAmount] = useState(null);

  const handleAddCategory = () => {
    if (newCat && !categories.includes(newCat)) {
      setCategories([...categories, newCat]);
      setNewCat('');
    }
  };
  const handleEditCategory = () => {
    if (editCat && editCatName && editCatName !== editCat) {
      setCategories(categories.map(c => (c === editCat ? editCatName : c)));
      setEditCat(null);
      setEditCatName('');
    }
  };
  const handleDeleteCategory = cat => {
    if (window.confirm(`Delete category "${cat}"? This will not delete expenses.`)) {
      setCategories(categories.filter(c => c !== cat));
    }
  };
  return (
    <>
      <div>
        <div className="flex gap-4 mb-6 items-center">
          <input
            className="border rounded-lg px-3 py-2"
            placeholder="New category name"
            value={newCat}
            onChange={e => setNewCat(e.target.value)}
          />
          <button
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-green-700"
            onClick={handleAddCategory}
          >
            Add Category
          </button>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-blue-700"
            onClick={() => setShowTotalModal(true)}
          >
            Total
          </button>
        </div>
        <div className="space-y-4">
          {categories.map(cat => (
            <div key={cat} className="bg-white rounded shadow p-4 flex items-center justify-between">
              <div className="flex-1 cursor-pointer" onClick={() => setCatModal(cat)}>
                <h2 className="text-lg font-bold mb-2">{cat}</h2>
                <div className="text-gray-500 text-sm">{expenses.find(e => e.cat === cat)?.data.length || 0} entries</div>
              </div>
              <div className="flex gap-2">
                <button title="Edit" className="p-2" onClick={() => { setEditCat(cat); setEditCatName(cat); }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 hover:text-blue-800" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.414 2.586a2 2 0 00-2.828 0l-9.5 9.5A2 2 0 004 14.5V17a1 1 0 001 1h2.5a2 2 0 001.414-.586l9.5-9.5a2 2 0 000-2.828l-2-2zM5 16v-1.5a.5.5 0 01.146-.354l9.5-9.5a.5.5 0 01.708.708l-9.5 9.5A.5.5 0 015 16z" />
                  </svg>
                </button>
                <button title="Delete" className="p-2" onClick={() => handleDeleteCategory(cat)}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600 hover:text-red-800" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8zM4 6a1 1 0 011-1h10a1 1 0 011 1v1H4V6zm2-3a1 1 0 011-1h6a1 1 0 011 1v1H6V3zm9 2V6a2 2 0 01-2 2v7a2 2 0 01-2 2H7a2 2 0 01-2-2V8a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Modal open={showTotalModal} onClose={() => setShowTotalModal(false)}>
        {/* ...existing modal code... */}
      </Modal>
      <Modal open={!!catModal} onClose={() => setCatModal(null)}>
        {catModal && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-5xl mx-auto">
            <h2 className="text-xl font-bold mb-4 text-blue-700">{catModal} Entries</h2>
            <ExpenseTable
              expenses={expenses.find(e => e.cat === catModal)?.data || []}
              onDelete={() => {}}
              onEdit={() => {}}
            />
          </div>
        )}
      </Modal>
      <Modal open={!!editCat} onClose={() => setEditCat(null)}>
        {editCat && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4 text-blue-700">Edit Category</h2>
            <input
              className="border rounded-lg px-3 py-2 w-full mb-4"
              value={editCatName}
              onChange={e => setEditCatName(e.target.value)}
            />
            <div className="flex gap-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold" onClick={handleEditCategory}>Save</button>
              <button className="bg-gray-300 px-4 py-2 rounded-lg font-semibold" onClick={() => setEditCat(null)}>Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
