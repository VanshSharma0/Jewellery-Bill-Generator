// src/components/CustomersPage.jsx
import React, { useState, useEffect } from 'react';

function CustomersPage() {
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    const storedCustomers = JSON.parse(localStorage.getItem('customers')) || [];
    setCustomers(storedCustomers);
  }, []);

  // (Optional) Function to delete a customer
  // const deleteCustomer = (customerIndex) => {
  //   // Logic to delete the customer from localStorage
  // };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Customers</h2>
      {customers.length === 0 ? (
        <p>No customers found.</p>
      ) : (
        <div className="overflow-x-auto"> 
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b text-left">Name</th>
                <th className="py-2 px-4 border-b text-left">Phone</th>
                <th className="py-2 px-4 border-b text-left">Address</th>
                <th className="py-2 px-4 border-b text-left">GSTIN</th>
                {/* Add more columns as needed (e.g., State, State Code) */}
                <th className="py-2 px-4 border-b text-left">Actions</th> 
              </tr>
            </thead>
            <tbody>
              {customers.map((customer, index) => (
                <tr key={index}>
                  <td className="py-2 px-4 border-b">{customer.name}</td>
                  <td className="py-2 px-4 border-b">{customer.phone}</td>
                  <td className="py-2 px-4 border-b">{customer.address}</td>
                  <td className="py-2 px-4 border-b">{customer.gstin}</td>
                  {/* Display other customer data */}
                  <td className="py-2 px-4 border-b">
                    <button
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-xs mr-2"
                      // onClick={() => { /* Logic to edit the customer (e.g., in a modal) */ }}
                    >
                      Edit
                    </button>
                    {/* (Optional) Add a Delete button */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CustomersPage;
