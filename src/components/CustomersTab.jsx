import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  GraduationCap, 
  Trash2, 
  Edit3, 
  X, 
  Building 
} from 'lucide-react';
import { useSellerData } from '../context/SellerDataContext';

export default function CustomersTab() {
  const { customers, addCustomer, editCustomer, deleteCustomer } = useSellerData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    schoolAffiliation: '',
    studentName: '',
    totalOrders: 1,
    totalSpend: 1500
  });

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchTerm.toLowerCase();
      return (
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.schoolAffiliation?.toLowerCase().includes(q) ||
        c.studentName?.toLowerCase().includes(q)
      );
    });
  }, [customers, searchTerm]);

  const openAddModal = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      schoolAffiliation: '',
      studentName: '',
      totalOrders: 1,
      totalSpend: 1200
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (c) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name || '',
      email: c.email || '',
      phone: c.phone || '',
      schoolAffiliation: c.schoolAffiliation || '',
      studentName: c.studentName || '',
      totalOrders: c.totalOrders || 1,
      totalSpend: c.totalSpend || 0
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingCustomer) {
      editCustomer(editingCustomer.id, formData);
      setEditingCustomer(null);
    } else {
      addCustomer(formData);
      setIsAddModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="text-teal-700" size={24} /> Registered Customers & Parents
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Student parent profiles, school affiliations, order volume and lifetime spend
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
        >
          <Plus size={16} /> Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-100">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search customer by name, email, student, or school..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600"
          />
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 uppercase font-semibold tracking-wider border-b border-gray-100">
              <tr>
                <th className="py-3 px-4">Parent / Customer</th>
                <th className="py-3 px-3">Student & School</th>
                <th className="py-3 px-3">Contact Details</th>
                <th className="py-3 px-3">Orders</th>
                <th className="py-3 px-3">Total Spend</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-500">
                    <Users size={40} className="mx-auto text-gray-300 mb-2" />
                    No customers found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/70 transition-colors">
                    
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900">{c.name}</div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">{c.id}</div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-medium text-gray-800 flex items-center gap-1">
                        <GraduationCap size={13} className="text-teal-700" />
                        {c.studentName || 'Student'}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">{c.schoolAffiliation}</div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="text-gray-700">{c.phone}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{c.email}</div>
                    </td>

                    <td className="py-3.5 px-3 font-semibold text-gray-800">
                      {c.totalOrders || 1} orders
                    </td>

                    <td className="py-3.5 px-3 font-extrabold text-gray-900">
                      ₹{Number(c.totalSpend || 0).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === 'VIP' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {c.status || 'Active'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 text-gray-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => deleteCustomer(c.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {(isAddModalOpen || editingCustomer) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h4 className="font-bold text-gray-900 text-base">
                {editingCustomer ? 'Edit Customer Details' : 'Add New Customer'}
              </h4>
              <button
                onClick={() => { setIsAddModalOpen(false); setEditingCustomer(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700">School Affiliation</label>
                <input
                  type="text"
                  value={formData.schoolAffiliation}
                  onChange={(e) => setFormData({ ...formData, schoolAffiliation: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Student Name & Class</label>
                <input
                  type="text"
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  placeholder="e.g. Diya Sharma (Class 9)"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setEditingCustomer(null); }}
                  className="flex-1 py-2 font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs"
                >
                  {editingCustomer ? 'Save Changes' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
