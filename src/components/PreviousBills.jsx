// src/components/PreviousBills.jsx
import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { formatIndianCurrency } from '../utils/currencyFormatter.js'; 
import PrintableBill from './PrintableBill';

Modal.setAppElement('#root'); 

function PreviousBills() {
  const [bills, setBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null); 

  useEffect(() => {
    const storedBills = JSON.parse(localStorage.getItem('bills')) || [];
    setBills(storedBills);
  }, []);

  const deleteBill = (billIndex) => {
    const updatedBills = [...bills];
    updatedBills.splice(billIndex, 1);
    setBills(updatedBills);
    localStorage.setItem('bills', JSON.stringify(updatedBills));
  };

  const openModal = (bill) => {
    setSelectedBill(bill);
  };

  const closeModal = () => {
    setSelectedBill(null);
  };

  // Function to handle printing a specific bill
  const handlePrintBill = (bill) => {
    setSelectedBill(bill);
    setTimeout(() => {
      window.print(); 
      setSelectedBill(null); 
    }, 0);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Previous Bills</h2>
      {bills.length === 0 ? (
        <p>No previous bills found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b text-left">Invoice No.</th>
                <th className="py-2 px-4 border-b text-left">Date</th>
                <th className="py-2 px-4 border-b text-left">Customer Name</th>
                <th className="py-2 px-4 border-b text-left">Total Amount</th> {/* Added Total Amount column */}
                <th className="py-2 px-4 border-b text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill, index) => (
                <tr key={index}>
                  <td className="py-2 px-4 border-b">{bill.invoiceNumber}</td>
                  <td className="py-2 px-4 border-b">{bill.date}</td>
                  <td className="py-2 px-4 border-b">{bill.customerName}</td>
                  <td className="py-2 px-4 border-b">₹{formatIndianCurrency(bill.grandTotal)}</td> {/* Display Total Amount */}
                  <td className="py-2 px-4 border-b">
                    <button
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-xs mr-2"
                      onClick={() => openModal(bill)} 
                    >
                      View
                    </button>
                    <button 
                      className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded text-xs mr-2"
                      onClick={() => handlePrintBill(bill)}
                    >
                      Print
                    </button>
                    <button
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs"
                      onClick={() => deleteBill(index)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for Bill Details */}
      <Modal 
  isOpen={Boolean(selectedBill)}
  onRequestClose={closeModal}
  contentLabel="Bill Details"
  className="modal" 
> 
  <div className="print:hidden">
    <button onClick={closeModal} className="absolute top-2 right-2">
      Close 
    </button>
  </div>
  {selectedBill && ( 
    <PrintableBill billData={selectedBill} />
  )}
</Modal>
    </div>
  );
}

export default PreviousBills;

