import React, { useState } from 'react';
import BranchesListPage from './BranchesListPage';
import CategoryManager from './CategoryManager';
import ExpenseTable from './ExpenseTable';
import ExpenseForm from './ExpenseForm';
import ExpenseEditModal from './ExpenseEditModal';
import Modal from './Modal';
import DailyTotals from './DailyTotals';
import axios from 'axios';

export default function MainContent(props) {
  const [addOpen, setAddOpen] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  if (props.selectedCategory === 'Branches') {
    return <BranchesListPage branches={props.branches} setBranches={props.setBranches} />;
  }
  
  if (props.selectedCategory === 'Indirect Exp') {
    return <CategoryManager
      categories={props.categories}
      setCategories={props.setCategories}
      expenses={props.expenses}
      months={props.months || []}
      selectedMonth={props.selectedMonth}
      setReload={props.setReload}
    />;
  }

  // Filter expenses for the selected category
  const categoryExpenses = props.expenses?.filter(exp => {
    const categoryMatch = exp.category?.toLowerCase() === props.selectedCategory?.toLowerCase();
    console.log('Filtering expense:', exp.category, 'vs', props.selectedCategory, 'match:', categoryMatch);
    return categoryMatch;
  }) || [];
  
  console.log('=== MAINCONTENT DEBUG ===');
  console.log('All expenses received:', props.expenses);
  console.log('Expenses length:', props.expenses?.length || 0);
  console.log('Selected category:', props.selectedCategory);
  console.log('Filtered expenses for category:', categoryExpenses);
  console.log('Filtered expenses length:', categoryExpenses.length);
  console.log('=== END MAINCONTENT DEBUG ===');

  return (
    <main className="flex-1 p-8 ml-56">
      <div className="bg-white rounded-2xl shadow p-3 flex items-center gap-6 mb-6 border border-gray-200 min-h-[48px]">
        <h1 className="text-base font-normal text-gray-500">{props.selectedCategory}</h1>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-600">Month</label>
          <select
            className="border rounded-lg px-3 py-2 focus:outline-blue-400 text-lg"
            value={props.selectedMonth}
            onChange={e => props.setSelectedMonth(e.target.value)}
          >
            {props.months?.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div className="flex-1" />
        {props.selectedCategory !== 'Total' && (
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-blue-700"
            onClick={() => setAddOpen(true)}
          >
            Add New Expense
          </button>
        )}
      </div>

      {props.selectedCategory === 'Total' && (
        <DailyTotals
          categories={props.categories.filter(cat => cat !== 'Total')}
          selectedMonth={props.selectedMonth}
          expenses={props.expenses}
        />
      )}

      {props.selectedCategory !== 'Total' && props.selectedCategory !== 'Indirect Exp' && (
        <>
          <Modal open={addOpen} onClose={() => setAddOpen(false)}>
            <ExpenseForm
              categories={props.categories}
              months={props.months}
              defaultCategory={props.selectedCategory}
              defaultMonth={props.selectedMonth}
              onAdded={() => {
                props.setReload(r => !r);
                setAddOpen(false);
              }}
            />
          </Modal>
          <ExpenseTable
            expenses={categoryExpenses}
            onDelete={exp => {
              if (window.confirm('Delete this expense?')) {
                axios.delete(`/api/expenses/${exp._id}`)
                  .then(() => props.setReload(r => !r));
              }
            }}
            onEdit={exp => {
              setEditExpense(exp);
              setEditOpen(true);
            }}
          />
          <ExpenseEditModal
            expense={editExpense}
            open={editOpen}
            onClose={() => setEditOpen(false)}
            onSave={updated => {
              axios.put(`/api/expenses/${updated._id}`, { amount: updated.amount })
                .then(() => {
                  setEditOpen(false);
                  props.setReload(r => !r);
                });
            }}
          />
        </>
      )}
    </main>
  );
}
