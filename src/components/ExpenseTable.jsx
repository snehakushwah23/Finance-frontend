import React from 'react';

export default function ExpenseTable({ expenses, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded shadow p-4 overflow-x-auto">
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
          {expenses.length === 0 ? (
            <tr><td colSpan="3" className="text-center py-4">No data</td></tr>
          ) : expenses.map(exp => (
            <tr key={exp._id}>
              <td className="px-4 py-2">{new Date(exp.date).toLocaleDateString()}</td>
              <td className="px-4 py-2">{exp.description || '-'}</td>
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
