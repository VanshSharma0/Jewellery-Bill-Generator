// /Users/username/path/to/Jewellery-Bill-Generator/src/components/CustomersPage.jsx
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import  firebaseConfig  from '../firebaseConfig.js'; // Adjust the path if needed

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); 

function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCustomer, setEditingCustomer] = useState(null); 
  const [newCustomer, setNewCustomer] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    customerGstin: '',
    customerState: '',
    customerStateCode: '' 
  });

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const customersCollection = collection(db, 'customers');
        const querySnapshot = await getDocs(customersCollection);
        const customerData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCustomers(customerData);
      } catch (error) {
        console.error("Error fetching customers: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // Add Customer
  const handleAddCustomer = async () => {
    try {
      const docRef = await addDoc(collection(db, 'customers'), newCustomer);
      console.log("Document written with ID: ", docRef.id);
      setCustomers([...customers, { id: docRef.id, ...newCustomer }]);
      setNewCustomer({
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        customerGstin: '',
        customerState: '',
        customerStateCode: ''
      });
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  // Edit Customer
  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
  };

  const handleSaveEdit = async () => {
    try {
      const customerRef = doc(db, 'customers', editingCustomer.id);
      await updateDoc(customerRef, editingCustomer);
      setCustomers(customers.map(c => (c.id === editingCustomer.id ? editingCustomer : c)));
      setEditingCustomer(null);
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  // Delete Customer
  const handleDeleteCustomer = async (customerId) => {
    try {
      await deleteDoc(doc(db, 'customers', customerId));
      setCustomers(customers.filter(customer => customer.id !== customerId));
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  };

  const handleChange = (e, field) => {
    if (editingCustomer) {
      setEditingCustomer({ ...editingCustomer, [field]: e.target.value });
    } else {
      setNewCustomer({ ...newCustomer, [field]: e.target.value });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Customers</h2>

      {/* Add Customer Form */}
      <div className="mb-6 p-4 border border-gray-300 rounded-md">
        <h3 className="text-lg font-medium mb-2">Add New Customer</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            type="text"
            placeholder="Customer Name" 
            value={newCustomer.customerName} 
            onChange={(e) => handleChange(e, 'customerName')}
            className="border border-gray-400 px-3 py-2 rounded-md"
          />
          <input 
            type="text"
            placeholder="Phone Number" 
            value={newCustomer.customerPhone} 
            onChange={(e) => handleChange(e, 'customerPhone')}
            className="border border-gray-400 px-3 py-2 rounded-md"
          />
          <input 
            type="text"
            placeholder="Address" 
            value={newCustomer.customerAddress} 
            onChange={(e) => handleChange(e, 'customerAddress')}
            className="border border-gray-400 px-3 py-2 rounded-md"
          />
          <input 
            type="text"
            placeholder="GSTIN" 
            value={newCustomer.customerGstin} 
            onChange={(e) => handleChange(e, 'customerGstin')}
            className="border border-gray-400 px-3 py-2 rounded-md"
          />
          <input 
            type="text"
            placeholder="State" 
            value={newCustomer.customerState} 
            onChange={(e) => handleChange(e, 'customerState')}
            className="border border-gray-400 px-3 py-2 rounded-md"
          />
          <input 
            type="text"
            placeholder="State Code" 
            value={newCustomer.customerStateCode} 
            onChange={(e) => handleChange(e, 'customerStateCode')}
            className="border border-gray-400 px-3 py-2 rounded-md"
          />
        </div>
        <button onClick={handleAddCustomer} className="mt-4 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">
          Add
        </button>
      </div>


      {/* Customer List Table */}
      {loading ? ( 
        <p>Loading customers...</p>
      ) : (
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b text-left">Name</th>
              <th className="py-2 px-4 border-b text-left">Phone</th>
              <th className="py-2 px-4 border-b text-left">Address</th>
              <th className="py-2 px-4 border-b text-left">GSTIN</th>
              <th className="py-2 px-4 border-b text-left">State</th>
              <th className="py-2 px-4 border-b text-left">State Code</th>
              <th className="py-2 px-4 border-b text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
  {customers.map((customer) => (
    <tr key={customer.id}>
      <td className="py-2 px-4 border-b">
        {editingCustomer && editingCustomer.id === customer.id ? (
          <input
            type="text"
            value={editingCustomer.customerName}
            onChange={(e) => handleChange(e, 'customerName')}
            className="border border-gray-400 px-2 py-1 rounded-md"
          />
        ) : (
          customer.customerName
        )}
      </td>
      <td className="py-2 px-4 border-b">
        {editingCustomer && editingCustomer.id === customer.id ? (
          <input
            type="text"
            value={editingCustomer.customerPhone}
            onChange={(e) => handleChange(e, 'customerPhone')}
            className="border border-gray-400 px-2 py-1 rounded-md"
          />
        ) : (
          customer.customerPhone
        )}
      </td>
      {/* Customer Address */}
      <td className="py-2 px-4 border-b">
        {editingCustomer && editingCustomer.id === customer.id ? (
          <input
            type="text"
            value={editingCustomer.customerAddress}
            onChange={(e) => handleChange(e, 'customerAddress')}
            className="border border-gray-400 px-2 py-1 rounded-md"
          />
        ) : (
          customer.customerAddress
        )}
      </td>
      {/* Customer GSTIN */}
      <td className="py-2 px-4 border-b">
        {editingCustomer && editingCustomer.id === customer.id ? (
          <input
            type="text"
            value={editingCustomer.customerGstin}
            onChange={(e) => handleChange(e, 'customerGstin')}
            className="border border-gray-400 px-2 py-1 rounded-md"
          />
        ) : (
          customer.customerGstin
        )}
      </td>
      {/* Customer State */}
      <td className="py-2 px-4 border-b">
        {editingCustomer && editingCustomer.id === customer.id ? (
          <input
            type="text"
            value={editingCustomer.customerState}
            onChange={(e) => handleChange(e, 'customerState')}
            className="border border-gray-400 px-2 py-1 rounded-md"
          />
        ) : (
          customer.customerState
        )}
      </td>
      {/* Customer State Code */}
      <td className="py-2 px-4 border-b">
        {editingCustomer && editingCustomer.id === customer.id ? (
          <input
            type="text"
            value={editingCustomer.customerStateCode}
            onChange={(e) => handleChange(e, 'customerStateCode')}
            className="border border-gray-400 px-2 py-1 rounded-md"
          />
        ) : (
          customer.customerStateCode
        )}
      </td>
      <td className="py-2 px-4 border-b">
        {editingCustomer && editingCustomer.id === customer.id ? (
          <>
            <button onClick={handleSaveEdit} className="bg-green-500 text-white px-2 py-1 rounded-md mr-2">
              Save
            </button>
            <button onClick={() => setEditingCustomer(null)} className="bg-gray-500 text-white px-2 py-1 rounded-md">
              Cancel
            </button>
          </>
        ) : (
          <>
            <button onClick={() => handleEditCustomer(customer)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-xs mr-2">
              Edit
            </button>
            <button onClick={() => handleDeleteCustomer(customer.id)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs">
              Delete
            </button>
          </>
        )}
      </td>
    </tr>
  ))}
</tbody>

        </table>
      )}
    </div>
  );
}

export default CustomersPage;

