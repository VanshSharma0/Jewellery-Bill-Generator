import { useState, useEffect } from 'react';
import BillForm from './components/BillForm';
import BillPreview from './components/BillPreview';
import * as XLSX from 'xlsx'; 
import PreviousBills from './components/PreviousBills';
import CustomersPage from './components/CustomersPage';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

function App() {
  const [billData, setBillData] = useState({
    invoiceNumber: '602',
    date: new Date().toISOString().substr(0, 10),
    gstin: '07AZTPS3304H1Z2',
    customerName: '',
    customerAddress: '',
    customerGstin: '',
    customerState: '',
    customerStateCode: '',
    customerPhone: '',
    items: [],
    paymentMode: 'Cash',
    discount: 0,
    sgstRate: 1.5,
    cgstRate: 1.5,
    makingChargeRate: 10, // Default making charge rate
  });

  const [customers, setCustomers] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile screens on mount and window resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  // Generate new invoice number based on previous bills
  useEffect(() => {
    const savedBills = JSON.parse(localStorage.getItem('bills')) || [];
    if (savedBills.length > 0) {
      // Find the highest invoice number and increment by 1
      const highestInvoice = savedBills.reduce((max, bill) => {
        const current = parseInt(bill.invoiceNumber) || 0;
        return current > max ? current : max;
      }, 0);
      
      setBillData(prev => ({
        ...prev,
        invoiceNumber: (highestInvoice + 1).toString()
      }));
    }
  }, []);

  // Load saved customers from local storage on component mount
  useEffect(() => {
    const savedCustomers = JSON.parse(localStorage.getItem('customers')) || [];
    console.log('Loaded customers from local storage:', savedCustomers);
    setCustomers(savedCustomers);
  }, []);

  // Save customers to local storage whenever the list changes
  useEffect(() => {
    console.log('Saving customers to local storage:', customers);
    localStorage.setItem('customers', JSON.stringify(customers));
  }, [customers]);

  const handleFormChange = (updatedData) => {
    console.log('Updating billData:', updatedData);
    setBillData((prevData) => ({ ...prevData, ...updatedData }));
  };

  const handlePrint = () => {
    window.print();
  };

  // Save customer details when the form is submitted
  const saveCustomerDetails = () => {
    const { customerName, customerAddress, customerGstin, customerState, customerStateCode, customerPhone } = billData;

    console.log('Saving customer:', customerName);

    if (!customerName) {
      alert('Please enter a customer name.');
      return;
    }

    const newCustomer = {
      name: customerName,
      address: customerAddress,
      gstin: customerGstin,
      state: customerState,
      stateCode: customerStateCode,
      phone: customerPhone,
    };

    console.log('New customer data:', newCustomer);

    // Check if the customer already exists
    const existingCustomerIndex = customers.findIndex(
      (customer) => customer.name.toLowerCase() === customerName.toLowerCase()
    );

    if (existingCustomerIndex !== -1) {
      // Update existing customer
      const updatedCustomers = [...customers];
      updatedCustomers[existingCustomerIndex] = newCustomer;
      setCustomers(updatedCustomers);
      console.log('Updated customer:', newCustomer);
    } else {
      // Add new customer
      setCustomers([...customers, newCustomer]);
      console.log('Added new customer:', newCustomer);
    }
  };

  // Auto-fill customer details when the name is entered
  const autoFillCustomerDetails = (name) => {
    const customer = customers.find(
      (customer) => customer.name.toLowerCase() === name.toLowerCase()
    );

    if (customer) {
      setBillData((prevData) => ({
        ...prevData,
        customerName: customer.name,
        customerAddress: customer.address,
        customerGstin: customer.gstin,
        customerState: customer.state,
        customerStateCode: customer.stateCode,
        customerPhone: customer.phone,
      }));
    }
  };

  const exportCustomersToExcel = () => {
    const dataToExport = customers.map(customer => ({
      'Customer Name': customer.name,
      'Address': customer.address,
      'GSTIN': customer.gstin,
      'State': customer.state,
      'State Code': customer.stateCode,
      'Phone': customer.phone,
    }));
  
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customers');
  
    XLSX.writeFile(wb, 'customer_data.xlsx');
  };

  const saveBillToLocalStorage = () => {
    // Calculate totals for storing with the bill
    const subtotal = billData.items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    const discountAmount = (subtotal * (billData.discount / 100)) || 0;
    const taxableAmount = subtotal - discountAmount;
    const makingChargeAmount = (taxableAmount * (billData.makingChargeRate / 100)) || 0;
    const sgstAmount = (taxableAmount * (billData.sgstRate / 100)) || 0;
    const cgstAmount = (taxableAmount * (billData.cgstRate / 100)) || 0;
    const grandTotal = taxableAmount + makingChargeAmount + sgstAmount + cgstAmount;
    
    // Create a complete bill object with calculated totals
    const completeBill = {
      ...billData,
      subtotal,
      discountAmount,
      taxableAmount,
      makingChargeAmount,
      sgstAmount,
      cgstAmount,
      grandTotal,
      createdAt: new Date().toISOString()
    };
    
    const bills = JSON.parse(localStorage.getItem('bills')) || [];
    bills.push(completeBill);
    localStorage.setItem('bills', JSON.stringify(bills));
    
    // Reset form for a new bill
    setBillData(prev => ({
      ...prev,
      invoiceNumber: (parseInt(prev.invoiceNumber) + 1).toString(),
      customerName: '',
      customerAddress: '',
      customerGstin: '',
      customerState: '',
      customerStateCode: '',
      customerPhone: '',
      items: [],
      paymentMode: 'Cash',
      discount: 0,
    }));
    
    // Show success message
    alert('Bill saved successfully!');
    
    return completeBill;
  };

  const handleSaveBill = () => {
    if (billData.items.length === 0) {
      alert('Please add at least one item to the bill.');
      return;
    }
    
    if (!billData.customerName) {
      alert('Please enter a customer name.');
      return;
    }
    
    const savedBill = saveBillToLocalStorage();
    console.log('Bill saved:', savedBill);
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-blue-600 text-white shadow-md">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center py-3">
              <div className="font-bold text-xl">Murti Jewellers</div>
              <div className="flex space-x-4">
                <Link to="/" className="hover:bg-blue-700 px-3 py-2 rounded">Home</Link>
                <Link to="/previous-bills" className="hover:bg-blue-700 px-3 py-2 rounded">Bills</Link>
                <Link to="/customers" className="hover:bg-blue-700 px-3 py-2 rounded">Customers</Link>
              </div>
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={ 
            <div className="max-w-7xl mx-auto p-4">
              <h1 className="text-3xl font-bold mb-6 text-gray-800">Jewelry Bill Generator</h1>
              
              {isMobile ? (
                // Mobile layout - tabs for switching between form and preview
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="border-b">
                    <div className="flex">
                      <button 
                        className={`py-3 px-4 text-sm font-medium ${!showPreview ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
                        onClick={() => setShowPreview(false)}
                      >
                        Bill Form
                      </button>
                      <button 
                        className={`py-3 px-4 text-sm font-medium ${showPreview ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
                        onClick={() => setShowPreview(true)}
                      >
                        Bill Preview
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-1">
                    {showPreview ? (
                      <BillPreview billData={billData} />
                    ) : (
                      <BillForm
                        billData={billData}
                        onFormChange={handleFormChange}
                        onPrint={handlePrint}
                        onSaveCustomer={saveCustomerDetails}
                        onAutoFillCustomer={autoFillCustomerDetails}
                        onSaveBill={handleSaveBill}
                      />
                    )}
                  </div>
                </div>
              ) : (
                // Desktop layout - side by side
                <div className="flex flex-wrap -mx-4">
                  <div className="w-full lg:w-1/2 px-4 mb-8">
                    <BillForm
                      billData={billData}
                      onFormChange={handleFormChange}
                      onPrint={handlePrint}
                      onSaveCustomer={saveCustomerDetails}
                      onAutoFillCustomer={autoFillCustomerDetails}
                      onSaveBill={handleSaveBill}
                    />
                  </div>
                  <div className="w-full lg:w-1/2 px-4">
                    <BillPreview billData={billData} />
                  </div>
                </div>
              )}
            </div>
          } />
          <Route path="/previous-bills" element={<PreviousBills />} />
          <Route path="/customers" element={<CustomersPage exportCustomers={exportCustomersToExcel} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;