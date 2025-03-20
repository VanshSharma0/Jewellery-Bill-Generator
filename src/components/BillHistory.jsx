import { useState, useEffect } from 'react'; 
import { BillStorageService } from './BillStorageService';

function BillHistory({ onViewBill }) {
  const [bills, setBills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'recent', 'customer'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    setIsLoading(true);
    try {
      // First load from local storage for immediate display
      const localBills = BillStorageService.getBillsFromLocalStorage();
      setBills(localBills);
      
      // Then fetch from cloud to get latest
      const cloudBills = await BillStorageService.getBillsFromCloud();
      
      // Merge and deduplicate, preferring cloud versions
      const allBills = [...cloudBills];
      localBills.forEach(localBill => {
        // Add local bills that aren't in cloud yet (pending sync)
        if (localBill.pendingSync || !cloudBills.some(b => b.id === localBill.id)) {
          allBills.push(localBill);
        }
      });
      
      setBills(allBills);
    } catch (error) {
      console.error("Error loading bills: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredBills = () => {
    return bills.filter(bill => {
      // Apply search filter
      const matchesSearch = searchTerm === '' || 
        (bill.customerName && bill.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (bill.billNumber && bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Apply type filter
      let matchesType = true;
      if (filterType === 'recent') {
        // Show bills from last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        matchesType = bill.createdAt && new Date(bill.createdAt) >= thirtyDaysAgo;
      } else if (filterType === 'customer') {
        // Filter bills by customer name
        matchesType = bill.customerName && bill.customerName.toLowerCase().includes(searchTerm.toLowerCase());
      }
      
      return matchesSearch && matchesType;
    }).sort((a, b) => {
      // Sort bills based on the sort order
      if (sortOrder === 'asc') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  };

  const handleViewBill = (billId) => {
    onViewBill(billId); // Trigger the parent function to view the bill details
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      {/* Search and Filter Controls */}
      <div className="mb-4 flex items-center justify-between">
        <input 
          type="text" 
          placeholder="Search by Bill Number or Customer Name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 border border-gray-300 rounded"
        />
        <div className="flex gap-4">
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="p-2 border border-gray-300 rounded"
          >
            <option value="all">All Bills</option>
            <option value="recent">Recent Bills</option>
            <option value="customer">Customer Bills</option>
          </select>
          <select 
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="p-2 border border-gray-300 rounded"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Bill List */}
      <div>
        {isLoading ? (
          <p>Loading bills...</p>
        ) : (
          <ul>
            {getFilteredBills().map(bill => (
              <li key={bill.id} className="p-2 border-b hover:bg-gray-100 cursor-pointer" onClick={() => handleViewBill(bill.id)}>
                <div className="flex justify-between">
                  <span>{bill.billNumber}</span>
                  <span>{bill.customerName}</span>
                  <span>{new Date(bill.createdAt).toLocaleDateString()}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default BillHistory;
