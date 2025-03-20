// src/components/PrintableBill.jsx
import React from 'react';
import { formatIndianCurrency } from '../utils/currencyFormatter';
import logo from '../assets/logo.png'; 

function PrintableBill({ billData }) {
  // Calculate totals 
  const subtotal = billData.items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  const discountAmount = (subtotal * (billData.discount / 100)) || 0;
  const taxableAmount = subtotal - discountAmount;
  const makingChargeAmount = (taxableAmount * (billData.makingChargeRate / 100)) || 0;
  const sgstAmount = (taxableAmount * (billData.sgstRate / 100)) || 0;
  const cgstAmount = (taxableAmount * (billData.cgstRate / 100)) || 0;
  const grandTotal = taxableAmount + makingChargeAmount + sgstAmount + cgstAmount;

  // Format the date 
  const formattedDate = new Date(billData.date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="bill-preview border border-gray-800 rounded shadow-lg mx-auto p-6"> 
      <table className="w-full">
        <tbody>
          {/* Header with Logo */}
          <tr>
            <td className="p-4 bg-white border border-gray-800 rounded shadow-lg">
              {/* Logo */}
              <img src={logo} alt="Company Logo" className="w-24 h-24" /> 
              {/* Company Name */}
              <h1 className="text-2xl font-bold mb-2">Murti Jewellers</h1> 
              {/* Address */}
              <p className="text-gray-600">
                Address Line 1 <br />
                Address Line 2 <br />
                City, State, Pincode 
              </p>
              <p className="text-gray-600 mt-2"><span className="font-semibold">GSTIN:</span> {billData.gstin}</p> 
            </td>
          </tr>

          {/* Customer Details */}
          <tr>
            <td className="px-4 py-2 border-b border-gray-800">
              <h3 className="font-bold text-xs mb-1">Details of Receiver (Billed To):</h3>
              <div className="grid grid-cols-2 gap-1">
                <div>
                  <p className="text-xs"><span className="font-semibold">Name:</span> {billData.customerName}</p>
                  <p className="text-xs"><span className="font-semibold">Address:</span> {billData.customerAddress}</p>
                  <p className="text-xs"><span className="font-semibold">GSTIN No:</span> {billData.customerGstin || "N/A"}</p> 
                </div>
                <div className="text-right">
                  <p className="text-xs"><span className="font-semibold">State:</span> {billData.customerState}</p>
                  <p className="text-xs"><span className="font-semibold">State Code:</span> {billData.customerStateCode}</p>
                  <p className="text-xs"><span className="font-semibold">Phone:</span> {billData.customerPhone}</p>
                </div>
              </div>
            </td>
          </tr>

          {/* Invoice Details */}
          <tr>
            <td className="px-4 py-2 border-b border-gray-800">
              <div className="flex justify-between">
                <div className="w-1/2">
                  <h2 className="text-sm font-bold">GST INVOICE</h2> 
                </div>
                <div className="w-1/2 text-right">
                  <p className="text-xs"><span className="font-semibold">SERIAL NO:</span> {billData.invoiceNumber}</p>
                  <p className="text-xs"><span className="font-semibold">DATE:</span> {formattedDate}</p>
                </div>
              </div>
            </td>
          </tr>

          {/* Item Details */}
          <tr>
            <td className="px-4 py-2">
              <table className="w-full text-sm"> 
                <thead>
                  <tr className="text-left font-bold">
                    <th className="px-4 py-2 border-b border-gray-800">DESCRIPTION</th>
                    <th className="px-4 py-2 border-b border-gray-800 text-right">QTY</th> 
                    <th className="px-4 py-2 border-b border-gray-800 text-right">RATE</th> 
                    <th className="px-4 py-2 border-b border-gray-800 text-right">AMOUNT</th> 
                  </tr>
                </thead>
                <tbody>
                  {billData.items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-400">
                      <td className="px-4 py-2">{item.description}</td>
                      <td className="px-4 py-2 text-right">{item.quantity}</td>
                      <td className="px-4 py-2 text-right">{item.rate}</td>
                      <td className="px-4 py-2 text-right">{formatIndianCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </td>
          </tr>

          {/* Payment and Calculations */}
          <tr>
            <td className="px-4 py-2 border-b border-gray-800">
              <div className="flex justify-between">
                <div className="w-1/2">
                  <p className="text-sm font-bold">MODE OF PAYMENT: {billData.paymentMode}</p>
                  <div className="mt-1">
                    <h4 className="text-sm font-bold">Terms & Conditions</h4>
                    <p className="text-xs">1. NO RETURN VALUE OF STONE, PEARLS & MEENA</p> 
                    <p className="text-xs">2. No encashment or exchange without presentation of SALE Voucher</p> 
                    <p className="text-xs">3. Subject to Delhi jurisdiction</p> 
                  </div>
                </div>
                <div className="w-1/2 border-l border-gray-800 pl-4">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr>
                        <td className="py-1 font-semibold">WHOLE MARK PER PCS</td>
                        <td className="py-1 text-right">₹{formatIndianCurrency(subtotal)}</td> 
                      </tr>
                      <tr>
                        <td className="py-1 font-semibold">DISCOUNT ({billData.discount}%)</td>
                        <td className="py-1 text-right">₹{formatIndianCurrency(discountAmount)}</td>
                      </tr>
                      <tr className="border-t border-gray-400">
                        <td className="py-1 font-semibold">TAXABLE AMOUNT</td>
                        <td className="py-1 text-right">₹{formatIndianCurrency(taxableAmount)}</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-semibold">MAKING CHARGES ({billData.makingChargeRate}%)</td>
                        <td className="py-1 text-right">₹{formatIndianCurrency(makingChargeAmount)}</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-semibold">SGST ({billData.sgstRate}%)</td>
                        <td className="py-1 text-right">₹{formatIndianCurrency(sgstAmount)}</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-semibold">CGST ({billData.cgstRate}%)</td>
                        <td className="py-1 text-right">₹{formatIndianCurrency(cgstAmount)}</td> 
                      </tr>
                      <tr className="border-t border-gray-400">
                        <td className="py-1 font-bold">GRAND TOTAL</td>
                        <td className="py-1 text-right font-bold">₹{formatIndianCurrency(grandTotal)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </td>
          </tr>

          {/* Declaration */}
          <tr>
            <td className="px-4 py-2 border-b border-gray-800">
              <p className="text-justify text-xs leading-tight">
                I have voluntarily, willingly and after fully satisfying myself of the quality, purity, standard, design and 
                specification(s) of the article(s) of goods ornament(s), mentioned in this Bill with full and complete 
                understanding of the contents of this bill, explanation and clarifications.
              </p>
            </td>
          </tr>

          {/* Signatures */}
          <tr>
            <td className="px-4 py-2">
              <div className="flex justify-between pt-2">
                <div>
                  <p className="text-xs">Customer's Signature</p>
                </div>
                <div>
                  <p className="text-xs font-bold">For MURTI JEWELLERS</p> 
                  <p className="mt-2 text-xs">Authorised Signatory</p>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default PrintableBill;
