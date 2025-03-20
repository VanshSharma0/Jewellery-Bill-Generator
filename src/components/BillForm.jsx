import { useState, useEffect } from 'react';
import { BillStorageService } from './BillStorageService';

function BillForm({ billData, onFormChange, onPrint, onSaveBill }) {
  const [newItem, setNewItem] = useState({
    description: '',
    quantity: 1,
    grossWeight: 0,
    netWeight: 0,
    rate: 0,
    amount: 0,
  });

  const [editingItemId, setEditingItemId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('customer'); // 'customer', 'items', 'payment'
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showCustomerList, setShowCustomerList] = useState(false);

  // Load customers when component mounts
  useEffect(() => {
    loadCustomers();
  }, []);

  // Filter customers when search term changes
  useEffect(() => {
    if (searchTerm) {
      const filtered = customers.filter(customer => 
        customer.customerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCustomers(filtered);
      setShowCustomerList(filtered.length > 0);
    } else {
      setFilteredCustomers([]);
      setShowCustomerList(false);
    }
  }, [searchTerm, customers]);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      // First load from local storage for immediate display
      const localCustomers = BillStorageService.getCustomersFromLocalStorage();
      setCustomers(localCustomers);
      
      // Then fetch from cloud to get latest
      const cloudCustomers = await BillStorageService.getCustomersFromCloud();
      
      // Merge and deduplicate
      const allCustomers = [...localCustomers];
      cloudCustomers.forEach(cloudCustomer => {
        const exists = allCustomers.some(c => 
          c.id === cloudCustomer.id || 
          (c.customerName === cloudCustomer.customerName && c.customerPhone === cloudCustomer.customerPhone)
        );
        if (!exists) {
          allCustomers.push(cloudCustomer);
        }
      });
      
      setCustomers(allCustomers);
    } catch (error) {
      console.error("Error loading customers: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log('Field changed:', name, value); // Debugging
    onFormChange({ [name]: value });
    
    // Handle customer search
    if (name === 'customerName') {
      setSearchTerm(value);
    }
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    const updatedItem = { ...newItem, [name]: value };

    // Auto calculate amount
    if (name === 'rate' || name === 'netWeight') {
      updatedItem.amount = (parseFloat(updatedItem.rate) * parseFloat(updatedItem.netWeight)).toFixed(2);
    }

    setNewItem(updatedItem);
  };

  const addItem = () => {
    if (!newItem.description || !newItem.netWeight || !newItem.rate) {
      alert('Please fill in description, net weight, and rate');
      return;
    }
    
    if (isEditing) {
      // Update existing item
      const updatedItems = billData.items.map((item) =>
        item.id === editingItemId ? { ...newItem, id: editingItemId } : item
      );
      onFormChange({ items: updatedItems });
      setIsEditing(false);
    } else {
      // Add new item
      const items = [...billData.items, { ...newItem, id: Date.now() }];
      onFormChange({ items });
    }

    // Reset form
    setNewItem({
      description: '',
      quantity: 1,
      grossWeight: 0,
      netWeight: 0,
      rate: 0,
      amount: 0,
    });
    setEditingItemId(null);
  };

  const editItem = (itemId) => {
    const itemToEdit = billData.items.find((item) => item.id === itemId);
    if (itemToEdit) {
      setNewItem({ ...itemToEdit });
      setEditingItemId(itemId);
      setIsEditing(true);
      setActiveTab('items'); // Switch to items tab when editing
    }
  };

  const cancelEdit = () => {
    setNewItem({
      description: '',
      quantity: 1,
      grossWeight: 0,
      netWeight: 0,
      rate: 0,
      amount: 0,
    });
    setEditingItemId(null);
    setIsEditing(false);
  };

  const removeItem = (itemId) => {
    const items = billData.items.filter((item) => item.id !== itemId);
    onFormChange({ items });
  };

  const selectCustomer = (customer) => {
    onFormChange({
      customerName: customer.customerName,
      customerPhone: customer.customerPhone,
      customerAddress: customer.customerAddress,
      customerGstin: customer.customerGstin,
      customerState: customer.customerState,
      customerStateCode: customer.customerStateCode
    });
    setShowCustomerList(false);
    setSearchTerm('');
  };

  const handleSaveCustomer = async () => {
    if (!billData.customerName || !billData.customerPhone) {
      alert('Customer name and phone are required');
      return;
    }
    
    const customerData = {
      customerName: billData.customerName,
      customerPhone: billData.customerPhone,
      customerAddress: billData.customerAddress,
      customerGstin: billData.customerGstin,
      customerState: billData.customerState,
      customerStateCode: billData.customerStateCode
    };
    
    try {
      const savedCustomer = await BillStorageService.saveCustomer(customerData);
      alert('Customer details saved successfully!');
      
      // Refresh customer list
      loadCustomers();
      
      return savedCustomer;
    } catch (error) {
      console.error("Error saving customer: ", error);
      alert('Failed to save customer details');
    }
  };

  const handleAutoFillCustomer = async (name) => {
    if (!name) return;
    
    try {
      const customer = await BillStorageService.findCustomerByName(name);
      if (customer) {
        selectCustomer(customer);
      }
    } catch (error) {
      console.error("Error auto-filling customer: ", error);
    }
  };

  const handleSaveBill = async () => {
    if (!billData.customerName || billData.items.length === 0) {
      alert('Customer name and at least one item are required');
      return;
    }
    
    try {
      const savedBill = await BillStorageService.saveBill(billData);
      alert('Bill saved successfully!');
      onSaveBill(savedBill);
      return savedBill;
    } catch (error) {
      console.error("Error saving bill: ", error);
      alert('Failed to save bill');
    }
  };

  // Calculate totals
  const subtotal = billData.items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  const discountAmount = (subtotal * (billData.discount / 100)) || 0;
  const taxableAmount = subtotal - discountAmount;
  const makingChargeAmount = (taxableAmount * (billData.makingChargeRate / 100)) || 0;
  const sgstAmount = (taxableAmount * (billData.sgstRate / 100)) || 0;
  const cgstAmount = (taxableAmount * (billData.cgstRate / 100)) || 0;
  const grandTotal = taxableAmount + makingChargeAmount + sgstAmount + cgstAmount;

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      {/* Form Tabs */}
      <div className="mb-4 border-b">
        <div className="flex space-x-1">
          <button
            className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
              activeTab === 'customer' 
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('customer')}
          >
            Customer
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
              activeTab === 'items' 
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('items')}
          >
            Items
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
              activeTab === 'payment' 
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('payment')}
          >
            Payment & Finalize
          </button>
        </div>
      </div>

      {/* Customer Details Section */}
      {activeTab === 'customer' && (
        <div>
          <h3 className="text-xl font-semibold mb-3 pb-2">Customer Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name:</label>
              <input
                type="text"
                name="customerName"
                value={billData.customerName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Customer Name"
              />
              {showCustomerList && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredCustomers.map((customer) => (
                    <div
                      key={customer.id || `${customer.customerName}-${customer.customerPhone}`}
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
                      onClick={() => selectCustomer(customer)}
                    >
                      <div className="font-medium">{customer.customerName}</div>
                      <div className="text-sm text-gray-600">{customer.customerPhone}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone:</label>
              <input
                type="text"
                name="customerPhone"
                value={billData.customerPhone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Phone Number"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address:</label>
            <input
              type="text"
              name="customerAddress"
              value={billData.customerAddress}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Full Address"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN:</label>
              <input
                type="text"
                name="customerGstin"
                value={billData.customerGstin}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="GSTIN Number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State:</label>
              <input
                type="text"
                name="customerState"
                value={billData.customerState}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="State"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">State Code:</label>
            <input
              type="text"
              name="customerStateCode"
              value={billData.customerStateCode}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="State Code"
            />
          </div>

          {/* Saved Customers Section */}
          <div className="mb-4">
            <h4 className="text-lg font-medium mb-2">Saved Customers</h4>
            <div className="bg-gray-50 p-3 rounded-md max-h-40 overflow-y-auto">
              {isLoading ? (
                <p className="text-gray-600">Loading customers...</p>
              ) : customers.length > 0 ? (
                <div className="space-y-2">
                  {customers.slice(0, 5).map((customer) => (
                    <div 
                      key={customer.id || `${customer.customerName}-${customer.customerPhone}`}
                      className="p-2 bg-white rounded border border-gray-200 flex justify-between items-center cursor-pointer hover:bg-blue-50"
                      onClick={() => selectCustomer(customer)}
                    >
                      <div>
                        <div className="font-medium">{customer.customerName}</div>
                        <div className="text-xs text-gray-600">{customer.customerPhone}</div>
                      </div>
                      <button
                        className="text-blue-600 text-sm hover:text-blue-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectCustomer(customer);
                        }}
                      >
                        Select
                      </button>
                    </div>
                  ))}
                  {customers.length > 5 && (
                    <p className="text-sm text-gray-600 text-center">
                      + {customers.length - 5} more customers. Type in the name field to search.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">No saved customers yet.</p>
              )}
            </div>
          </div>

          {/* Save Customer Button */}
          <div className="mb-4 flex gap-2">
            <button
              type="button"
              onClick={handleSaveCustomer}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Save Customer Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('items')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Next: Add Items
            </button>
          </div>
        </div>
      )}

      {/* Items Section - Same as your original code */}
      {activeTab === 'items' && (
        <div>
          {/* ... items section code (unchanged) ... */}
          {/* Keep all your original items tab code here */}
        </div>
      )}

      {/* Payment Section - With the save functionality */}
      {activeTab === 'payment' && (
        <div>
          {/* ... rest of payment section ... */}
          {/* Keep all your original payment tab code here, but update the buttons: */}
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('items')}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Back to Items
            </button>
            <button
              type="button"
              onClick={handleSaveBill}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Save Bill
            </button>
            <button
              type="button"
              onClick={onPrint}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Print Bill
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BillForm;