// src/utils/currencyFormatter.js
export const formatIndianCurrency = (num) => {
  // Check if num is a valid number before formatting
  if (typeof num === 'number' && !isNaN(num)) { 
    return new Intl.NumberFormat('en-IN', { 
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
      style: 'currency', // Apply currency formatting
      currency: 'INR' // Use Indian Rupees (INR)
    }).format(num);
  } else {
    // Handle the case where 'num' is not a valid number
    return 'N/A'; // Or any other default value you prefer 
  }
};
