import React from 'react';

export default function DailyTotals({ totals }) {
  if (!totals || totals.length === 0) return null;
  return (
    <div className="bg-white rounded shadow p-4 mb-6 max-w-xl">
      <h2 className="text-lg font-semibold mb-2">Total by Day</h2>
      <table className="min-w-full">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-2 text-left">Date</th>
            <th className="px-4 py-2 text-right">Total Amount</th>
          </tr>
        </thead>
        <tbody>
          {totals.map(row => (
            <tr key={row._id}>
              <td className="px-4 py-2">{row._id}</td>
              <td className="px-4 py-2 text-right">₹{row.totalAmount.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
