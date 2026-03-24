import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, type Customer } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Building2, Mail, Phone, Search } from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('Lead');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !user) return;

    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([
          {
            user_id: user.id,
            name,
            company,
            email,
            phone,
            status,
          }
        ])
        .select();

      if (error) throw error;
      
      if (data) {
        setCustomers([data[0], ...customers]);
        setShowModal(false);
        // Reset form
        setName('');
        setCompany('');
        setEmail('');
        setPhone('');
        setStatus('Lead');
      }
    } catch (error) {
      console.error('Error adding customer:', error);
      alert('Failed to add customer');
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-normal text-[#24292f]">Customers</h1>
          <p className="mt-1 text-sm text-[#57606a]">
            Manage your clients and track their journeys.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center px-4 py-1.5 border border-[rgba(27,31,36,0.15)] text-sm font-medium rounded-md shadow-sm text-white bg-[#2da44e] hover:bg-[#2c974b] focus:outline-none focus:ring-2 focus:ring-[#2da44e] focus:ring-offset-2 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </button>
        </div>
      </div>

      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-[#57606a]" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full pl-9 pr-3 py-1.5 border border-[#d0d7de] rounded-md leading-5 bg-[#f6f8fa] placeholder-[#57606a] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0969da] focus:border-[#0969da] sm:text-sm transition-colors"
          placeholder="Search customers..."
        />
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-[#0969da] border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="bg-white border border-[#d0d7de] sm:rounded-md">
          <ul className="divide-y divide-[#d0d7de]">
            {filteredCustomers.length === 0 ? (
              <li className="px-4 py-8 text-center text-[#57606a]">
                No customers found. Add your first customer to get started!
              </li>
            ) : (
              filteredCustomers.map((customer) => (
                <li key={customer.id}>
                  <Link to={`/customer/${customer.id}`} className="block hover:bg-[#f6f8fa] transition-colors">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-base font-semibold text-[#0969da] truncate hover:underline">
                          {customer.name}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="px-2 py-0.5 inline-flex text-xs leading-4 font-medium rounded-full border border-[#d0d7de] text-[#57606a]">
                            {customer.status}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex space-y-2 sm:space-y-0 sm:space-x-6">
                          {customer.company && (
                            <p className="flex items-center text-sm text-[#57606a]">
                              <Building2 className="flex-shrink-0 mr-1.5 h-4 w-4 text-[#57606a]" />
                              {customer.company}
                            </p>
                          )}
                          {customer.email && (
                            <p className="flex items-center text-sm text-[#57606a]">
                              <Mail className="flex-shrink-0 mr-1.5 h-4 w-4 text-[#57606a]" />
                              {customer.email}
                            </p>
                          )}
                          {customer.phone && (
                            <p className="flex items-center text-sm text-[#57606a]">
                              <Phone className="flex-shrink-0 mr-1.5 h-4 w-4 text-[#57606a]" />
                              {customer.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {/* Add Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)} />
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl border border-[#d0d7de] transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-semibold text-[#24292f] mb-4">Add New Customer</h3>
                <form onSubmit={handleAddCustomer} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#24292f]">Name *</label>
                    <input type="text" required value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full border border-[#d0d7de] rounded-md shadow-sm py-1.5 px-3 bg-[#f6f8fa] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0969da] focus:border-[#0969da] sm:text-sm transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#24292f]">Company</label>
                    <input type="text" value={company} onChange={e => setCompany(e.target.value)} className="mt-1 block w-full border border-[#d0d7de] rounded-md shadow-sm py-1.5 px-3 bg-[#f6f8fa] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0969da] focus:border-[#0969da] sm:text-sm transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#24292f]">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full border border-[#d0d7de] rounded-md shadow-sm py-1.5 px-3 bg-[#f6f8fa] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0969da] focus:border-[#0969da] sm:text-sm transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#24292f]">Phone</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 block w-full border border-[#d0d7de] rounded-md shadow-sm py-1.5 px-3 bg-[#f6f8fa] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0969da] focus:border-[#0969da] sm:text-sm transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#24292f]">Status</label>
                    <select value={status} onChange={e => setStatus(e.target.value)} className="mt-1 block w-full border border-[#d0d7de] rounded-md shadow-sm py-1.5 px-3 bg-[#f6f8fa] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0969da] focus:border-[#0969da] sm:text-sm transition-colors">
                      <option>Lead</option>
                      <option>Active</option>
                      <option>Inactive</option>
                    </select>
                  </div>
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <button type="submit" className="w-full inline-flex justify-center rounded-md border border-[rgba(27,31,36,0.15)] shadow-sm px-4 py-1.5 bg-[#2da44e] text-sm font-medium text-white hover:bg-[#2c974b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2da44e] sm:col-start-2 transition-colors">
                      Save
                    </button>
                    <button type="button" onClick={() => setShowModal(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-[rgba(27,31,36,0.15)] shadow-sm px-4 py-1.5 bg-[#f6f8fa] text-sm font-medium text-[#24292f] hover:bg-[#f3f4f6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0969da] sm:mt-0 sm:col-start-1 transition-colors">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
