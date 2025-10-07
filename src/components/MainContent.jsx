import React, { useState } from 'react';
import axios from 'axios';
import ExpenseTable from './ExpenseTable';
import ExpenseForm from './ExpenseForm';
import Modal from './Modal';
import ExpenseEditModal from './ExpenseEditModal';
import DailyTotals from './DailyTotals';

export default function MainContent(props) {
  const {
    selectedCategory,
    selectedMonth,
    setSelectedMonth,
    expenses,
    setReload,
    categories,
    months
  } = props;

  const [addOpen, setAddOpen] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  // Filter expenses by category and month
  const filteredExpenses = expenses.filter(exp => {
    if (selectedCategory === 'Total') return true;
    return exp.category === selectedCategory && exp.month === selectedMonth;
  });

  // Calculate total for selected category
  const totalAmount = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  return (
    <main className="flex-1 p-8 ml-56 pt-20">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow p-6 flex items-center gap-6 mb-6 border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">{selectedCategory}</h1>
        
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-600">Month</label>
          <select
            className="border rounded-lg px-3 py-2 focus:outline-blue-400 text-lg"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
          >
            {months.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        
        <div className="flex-1" />
        
        {selectedCategory !== 'Total' && (
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition"
            onClick={() => setAddOpen(true)}
          >
            Add New Expense
          </button>
        )}
      </div>

      {/* Show Daily Totals for Total category */}
      {selectedCategory === 'Total' && (
        <DailyTotals
          categories={categories.filter(cat => cat !== 'Total')}
          month={selectedMonth}
          expenses={expenses}
        />
      )}

      {/* Show Expense Table for specific categories */}
      {selectedCategory !== 'Total' && (
        <>
          {/* Total Amount Display */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-700">Total for {selectedMonth}:</span>
              <span className="text-2xl font-bold text-blue-600">₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <ExpenseTable
            expenses={filteredExpenses}
            onDelete={exp => {
              if (window.confirm('Delete this expense?')) {
                axios.delete(`/api/expenses/${exp._id}`)
                  .then(() => setReload(r => !r))
                  .catch(err => alert('Error deleting expense: ' + err.message));
              }
            }}
            onEdit={exp => {
              setEditExpense(exp);
              setEditOpen(true);
            }}
          />

          {/* Add Expense Modal */}
          <Modal open={addOpen} onClose={() => setAddOpen(false)}>
            <ExpenseForm
              categories={categories}
              months={months}
              defaultCategory={selectedCategory}
              defaultMonth={selectedMonth}
              onAdded={() => {
                setReload(r => !r);
                setAddOpen(false);
              }}
            />
          </Modal>

          {/* Edit Expense Modal */}
          <ExpenseEditModal
            expense={editExpense}
            open={editOpen}
            onClose={() => setEditOpen(false)}
            onSave={updated => {
              axios.put(`/api/expenses/${updated._id}`, { amount: updated.amount })
                .then(() => {
                  setEditOpen(false);
                  setReload(r => !r);
                })
                .catch(err => alert('Error updating expense: ' + err.message));
            }}
          />
        </>
      )}
    </main>
  );
}
