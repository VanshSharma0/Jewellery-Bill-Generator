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
    
    // Handle customer search AND autofill
    if (name === 'customerName') {
      setSearchTerm(value);
      handleAutoFillCustomer(value); // Call the function here
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

      {/* Items Section */}
      {activeTab === 'items' && (
        <div>
          <h3 className="text-xl font-semibold mb-3 border-b pb-2">Item Details</h3>
          <div className="bg-gray-50 p-4 rounded-md mb-4">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={newItem.description}
                  onChange={handleItemChange}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                  rows="2"
                  placeholder="Item description"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  value={newItem.quantity}
                  onChange={handleItemChange}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Gross Wt</label>
                <input
                  type="number"
                  name="grossWeight"
                  value={newItem.grossWeight}
                  onChange={handleItemChange}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Net Wt</label>
                <input
                  type="number"
                  name="netWeight"
                  value={newItem.netWeight}
                  onChange={handleItemChange}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Rate</label>
                <input
                  type="number"
                  name="rate"
                  value={newItem.rate}
                  onChange={handleItemChange}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                  min="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={newItem.amount}
                  onChange={handleItemChange}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md bg-gray-100"
                  readOnly
                />
              </div>
              <div className="md:col-span-4 flex items-end gap-2">
                <button
                  type="button"
                  onClick={addItem}
                  className={`${isEditing ? 'bg-blue-600' : 'bg-green-600'} text-white px-3 py-1 rounded-md hover:${isEditing ? 'bg-blue-700' : 'bg-green-700'} text-sm`}
                >
                  {isEditing ? 'Update Item' : 'Add Item'}
                </button>
                {isEditing && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="bg-gray-600 text-white px-3 py-1 rounded-md hover:bg-gray-700 text-sm"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          {billData.items.length > 0 ? (
            <div className="mb-4">
              <h4 className="text-lg font-medium mb-2">Added Items</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm">Description</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm">Qty</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm">Gross Wt</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm">Net Wt</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm">Rate</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm">Amount</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billData.items.map(item => (
                      <tr key={item.id}>
                        <td className="border border-gray-300 px-3 py-2 text-sm">{item.description}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">{item.quantity}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">{item.grossWeight}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">{item.netWeight}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">{item.rate}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">{item.amount}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => editItem(item.id)}
                              className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 flex justify-end">
                <div className="w-full md:w-1/3 bg-gray-50 p-3 rounded-md">
                  <div className="flex justify-between font-semibold">
                    <span>Subtotal:</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('customer')}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                >
                  Back to Customer
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('payment')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Next: Payment
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-300 p-3 rounded-md">
              <p className="text-yellow-700">No items added to this bill yet. Add items using the form above.</p>
            </div>
          )}
        </div>
      )}

      {/* Payment Section */}
      {activeTab === 'payment' && (
        <div>
          <h3 className="text-xl font-semibold mb-3 pb-2">Payment & Finalize</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode:</label>
              <select
                name="paymentMode"
                value={billData.paymentMode}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount (Rs):</label>
              <input
                type="number"
                name="discount"
                value={billData.discount}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="0.01"
                min="0"
                max="100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Making Charges (%):</label>
              <input
                type="number"
                name="makingChargeRate"
                value={billData.makingChargeRate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="0.01"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST Rate (%):</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">SGST:</label>
                  <input
                    type="number"
                    name="sgstRate"
                    value={billData.sgstRate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">CGST:</label>
                  <input
                    type="number"
                    name="cgstRate"
                    value={billData.cgstRate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes:</label>
            <textarea
              name="notes"
              value={billData.notes || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Additional notes or terms and conditions"
            />
          </div>

           {/* Bill Summary */}
           <div className="bg-gray-50 p-4 rounded-md mb-4">
            <h4 className="text-lg font-medium mb-3">Bill Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Discount ({billData.discount || 0}%):</span>
                <span className="font-medium">- ₹{discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Taxable Amount:</span>
                <span className="font-medium">₹{taxableAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Making Charges ({billData.makingChargeRate || 0}%):</span>
                <span className="font-medium">₹{makingChargeAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">SGST ({billData.sgstRate || 0}%):</span>
                <span className="font-medium">₹{sgstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">CGST ({billData.cgstRate || 0}%):</span>
                <span className="font-medium">₹{cgstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-300 text-lg font-bold">
                <span>Grand Total:</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

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