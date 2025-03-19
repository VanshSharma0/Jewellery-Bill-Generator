// src/utils/currencyFormatter.js
export const formatIndianCurrency = (num) => {
    return num.toLocaleString('en-IN', {
      maximumFractionDigits: 2, // Set maximum decimal places to 2
      minimumFractionDigits: 2, // Ensure always 2 decimal places 
      style: 'currency', // Apply currency formatting
      currency: 'INR' // Use Indian Rupees (INR)
    });
  };
  