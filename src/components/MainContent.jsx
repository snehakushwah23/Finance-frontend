import React from 'react';
import BranchesListPage from './BranchesListPage';
import CategoryManager from './CategoryManager';

export default function MainContent(props) {
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
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4 text-blue-700">Main Content</h1>
      <pre className="bg-gray-100 p-4 rounded-lg text-sm">
        {JSON.stringify(props, null, 2)}
      </pre>
      {/* TODO: Replace with your actual app content */}
    </div>
  );
}
