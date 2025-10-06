import React, { useState } from 'react';

export default function ExpenseEditModal({ expense, open, onClose, onSave }) {
  const [amount, setAmount] = useState(expense ? expense.amount : '');

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow w-80">
        <h2 className="text-lg font-bold mb-4">Edit Amount</h2>
        <input
          type="number"
          className="border rounded px-2 py-1 w-full mb-4"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1 bg-gray-200 rounded" onClick={onClose}>Cancel</button>
          <button
            className="px-3 py-1 bg-blue-600 text-white rounded"
            onClick={() => onSave({ ...expense, amount: Number(amount) })}
          >Save</button>
        </div>
      </div>
    </div>
  );
}
