import React from 'react';

export default function ExpenseTable({ expenses, onEdit, onDelete, onEmployeeDetailsClick }) {
  console.log('=== EXPENSETABLE DEBUG ===');
  console.log('ExpenseTable - received expenses:', expenses);
  console.log('ExpenseTable - expenses length:', expenses?.length || 0);
  console.log('ExpenseTable - expenses type:', typeof expenses);
  console.log('ExpenseTable - is array:', Array.isArray(expenses));
  if (expenses && expenses.length > 0) {
    console.log('ExpenseTable - sample expense:', expenses[0]);
    console.log('ExpenseTable - all categories:', [...new Set(expenses.map(exp => exp.category))]);
  }
  console.log('=== END EXPENSETABLE DEBUG ===');
  
  return (
    <div className="bg-white rounded shadow p-4 overflow-x-auto">
      <div className="mb-2 p-2 bg-gray-100 rounded text-sm">
        <strong>ExpenseTable Debug:</strong> Received {expenses?.length || 0} expenses
      </div>
      <table className="min-w-full">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-2 text-left">Date</th>
            <th className="px-4 py-2 text-left">Description</th>
            <th className="px-4 py-2 text-right">Amount</th>
            <th className="px-4 py-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {!expenses || expenses.length === 0 ? (
            <tr><td colSpan="4" className="text-center py-4">No data</td></tr>
          ) : expenses.map(exp => {
            console.log('Rendering expense:', exp);
            return (
              <tr key={exp._id}>
                <td className="px-4 py-2">{new Date(exp.date).toLocaleDateString()}</td>
                <td className="px-4 py-2">
                  {exp.isCustomerExpense ? (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{exp.description}</span>
                      <button
                        onClick={() => onEmployeeDetailsClick && onEmployeeDetailsClick(exp.customerDetails)}
                        className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                        title="View customer details"
                      >
                        <svg 
                          className="w-4 h-4 text-blue-600 hover:text-blue-800" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                          />
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" 
                          />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    exp.description || '-'
                  )}
                </td>
                <td className="px-4 py-2 text-right">₹{exp.amount.toFixed(2)}</td>
                <td className="px-4 py-2 text-center">
                  <button
                    className="text-blue-600 hover:underline mr-2"
                    onClick={() => onEdit && onEdit(exp)}
                  >Edit</button>
                  <button
                    className="text-red-600 hover:underline"
                    onClick={() => onDelete && onDelete(exp)}
                  >Delete</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
