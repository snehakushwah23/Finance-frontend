import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from './Modal';
import { api } from '../config/api';

function EmployeeMasterPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    designation: '',
    department: '',
    joiningDate: '',
    salary: ''
  });

  // Load employees on component mount
  useEffect(() => {
    loadEmployees();
  }, []);

  // Filter employees when search term changes
  useEffect(() => {
    if (searchTerm) {
      const filtered = employees.filter(emp => 
        emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.mobile?.includes(searchTerm) ||
        emp.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEmployees(filtered);
    } else {
      setFilteredEmployees(employees);
    }
  }, [employees, searchTerm]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await axios.get(api.get('/api/employees'));
      setEmployees(response.data);
    } catch (error) {
      console.error('Error loading employees:', error);
      alert('Error loading employees');
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeClick = (employee) => {
    setSelectedEmployee(employee);
    setDetailModalOpen(true);
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name || '',
      mobile: employee.mobile || '',
      designation: employee.designation || '',
      department: employee.department || '',
      joiningDate: employee.joiningDate ? new Date(employee.joiningDate).toISOString().split('T')[0] : '',
      salary: employee.salary || ''
    });
    setEditModalOpen(true);
  };

  const handleDelete = async (employeeId) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(api.delete(`/api/employees/${employeeId}`));
      await loadEmployees();
      alert('Employee deleted successfully');
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Error deleting employee');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      alert('Please enter employee name');
      return;
    }

    try {
      setLoading(true);
      await axios.post(api.post('/api/employees'), formData);
      await loadEmployees();
      setAddModalOpen(false);
      setFormData({ name: '', mobile: '', designation: '', department: '', joiningDate: '', salary: '' });
      alert('Employee added successfully');
    } catch (error) {
      console.error('Error adding employee:', error);
      alert('Error adding employee');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      alert('Please enter employee name');
      return;
    }

    try {
      setLoading(true);
      await axios.put(api.put(`/api/employees/${editingEmployee._id}`), formData);
      await loadEmployees();
      setEditModalOpen(false);
      setEditingEmployee(null);
      setFormData({ name: '', mobile: '', designation: '', department: '', joiningDate: '', salary: '' });
      alert('Employee updated successfully');
    } catch (error) {
      console.error('Error updating employee:', error);
      alert('Error updating employee');
    } finally {
      setLoading(false);
    }
  };

  const closeModals = () => {
    setDetailModalOpen(false);
    setEditModalOpen(false);
    setAddModalOpen(false);
    setSelectedEmployee(null);
    setEditingEmployee(null);
    setFormData({ name: '', mobile: '', designation: '', department: '', joiningDate: '', salary: '' });
  };

  return (
    <div className="flex-1 p-8 ml-56">
      <div className="bg-white rounded-2xl shadow p-6 mb-6 border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Employee Master</h1>
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
            onClick={() => setAddModalOpen(true)}
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
              />
            </svg>
            Add Employee
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              className="border rounded-lg px-4 py-2 w-full pl-10 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Search by name, mobile, designation, or department..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <svg 
              className="w-5 h-5 text-gray-400 absolute left-3 top-3" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-600">Total Employees</h3>
            <p className="text-2xl font-bold text-blue-900">{filteredEmployees.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-600">Departments</h3>
            <p className="text-2xl font-bold text-green-900">
              {new Set(filteredEmployees.map(emp => emp.department).filter(Boolean)).size}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-purple-600">Designations</h3>
            <p className="text-2xl font-bold text-purple-900">
              {new Set(filteredEmployees.map(emp => emp.designation).filter(Boolean)).size}
            </p>
          </div>
        </div>

        {/* Content based on loading and data */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'No employees found matching your search' : 'No employees found. Click "Add Employee" to get started.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-blue-50">
                <tr>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">#</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Name</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Mobile</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Designation</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Department</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Joining Date</th>
                  <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-700">Salary (₹)</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee, index) => (
                  <tr key={employee._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleEmployeeClick(employee)}>
                    <td className="border border-gray-300 px-4 py-3 text-gray-600">{index + 1}</td>
                    <td className="border border-gray-300 px-4 py-3 font-medium">{employee.name}</td>
                    <td className="border border-gray-300 px-4 py-3">{employee.mobile || '-'}</td>
                    <td className="border border-gray-300 px-4 py-3">{employee.designation || '-'}</td>
                    <td className="border border-gray-300 px-4 py-3">{employee.department || '-'}</td>
                    <td className="border border-gray-300 px-4 py-3">
                      {employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-right font-medium">
                      {employee.salary ? `₹${Number(employee.salary).toLocaleString()}` : '-'}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          className="p-1 hover:bg-green-200 rounded-full transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(employee);
                          }}
                          title="Edit employee"
                        >
                          <svg 
                            className="w-4 h-4 text-green-600 hover:text-green-800" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
                            />
                          </svg>
                        </button>
                        <button
                          className="p-1 hover:bg-red-200 rounded-full transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(employee._id);
                          }}
                          title="Delete employee"
                        >
                          <svg 
                            className="w-4 h-4 text-red-600 hover:text-red-800" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Employee Detail Modal */}
      <Modal open={detailModalOpen} onClose={closeModals}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 mx-auto" style={{ width: '600px', maxWidth: '90vw' }}>
          <h2 className="text-xl font-bold mb-4 text-blue-700">Employee Details</h2>
          {selectedEmployee && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600">Name</label>
                  <p className="text-lg font-medium text-gray-800">{selectedEmployee.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600">Mobile</label>
                  <p className="text-lg font-medium text-gray-800">{selectedEmployee.mobile || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600">Designation</label>
                  <p className="text-lg font-medium text-gray-800">{selectedEmployee.designation || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600">Department</label>
                  <p className="text-lg font-medium text-gray-800">{selectedEmployee.department || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600">Joining Date</label>
                  <p className="text-lg font-medium text-gray-800">
                    {selectedEmployee.joiningDate ? new Date(selectedEmployee.joiningDate).toLocaleDateString() : '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600">Salary</label>
                  <p className="text-lg font-bold text-green-600">
                    {selectedEmployee.salary ? `₹${Number(selectedEmployee.salary).toLocaleString()}` : '-'}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end mt-6">
            <button
              className="bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
              onClick={closeModals}
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Employee Modal */}
      <Modal open={addModalOpen} onClose={closeModals}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 mx-auto" style={{ width: '600px', maxWidth: '90vw' }}>
          <h2 className="text-xl font-bold mb-4 text-blue-700">Add New Employee</h2>
          <form onSubmit={handleAddEmployee}>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Name *</label>
                <input
                  type="text"
                  name="name"
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Mobile</label>
                <input
                  type="tel"
                  name="mobile"
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  placeholder="Enter mobile number"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700">Designation</label>
                  <input
                    type="text"
                    name="designation"
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={formData.designation}
                    onChange={handleInputChange}
                    placeholder="e.g. Manager"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700">Department</label>
                  <input
                    type="text"
                    name="department"
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={formData.department}
                    onChange={handleInputChange}
                    placeholder="e.g. Sales"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700">Joining Date</label>
                <input
                  type="date"
                    name="joiningDate"
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={formData.joiningDate}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700">Salary (₹)</label>
                <input
                  type="number"
                    name="salary"
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={formData.salary}
                  onChange={handleInputChange}
                  min="0"
                    placeholder="Enter salary"
                />
              </div>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold flex-1 hover:bg-blue-700 transition-colors"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Employee'}
              </button>
              <button
                type="button"
                className="bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold flex-1 hover:bg-gray-500 transition-colors"
                onClick={closeModals}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal open={editModalOpen} onClose={closeModals}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 mx-auto" style={{ width: '600px', maxWidth: '90vw' }}>
          <h2 className="text-xl font-bold mb-4 text-blue-700">Edit Employee</h2>
          <form onSubmit={handleUpdateEmployee}>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Name *</label>
                <input
                  type="text"
                  name="name"
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Mobile</label>
                <input
                  type="tel"
                  name="mobile"
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={formData.mobile}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700">Designation</label>
                  <input
                    type="text"
                    name="designation"
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={formData.designation}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700">Department</label>
                  <input
                    type="text"
                    name="department"
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={formData.department}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700">Joining Date</label>
                <input
                  type="date"
                    name="joiningDate"
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={formData.joiningDate}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700">Salary (₹)</label>
                <input
                  type="number"
                    name="salary"
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={formData.salary}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold flex-1 hover:bg-blue-700 transition-colors"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Employee'}
              </button>
              <button
                type="button"
                className="bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold flex-1 hover:bg-gray-500 transition-colors"
                onClick={closeModals}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}

export default EmployeeMasterPage;

