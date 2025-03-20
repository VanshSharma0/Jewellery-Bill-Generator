import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc, 
  updateDoc 
} from 'firebase/firestore';

// Initialize Firebase (replace with your own config)
const firebaseConfig = {
  apiKey: "AIzaSyBelUvkmgzay05xMvC0sNTRexsxMV0rTCU",
  authDomain: "bill-gen-a4c7f.firebaseapp.com",
  projectId: "bill-gen-a4c7f",
  storageBucket: "bill-gen-a4c7f.firebasestorage.app",
  messagingSenderId: "682162688340",
  appId: "1:682162688340:web:b589e598ee827d556078c1",
  measurementId: "G-7M2MCZEY26"
};

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Local storage keys
const CUSTOMER_STORAGE_KEY = 'jewelryShop_customers';
const BILLS_STORAGE_KEY = 'jewelryShop_bills';

export const BillStorageService = {
  // Customer methods
  saveCustomer: async (customer) => {
    // Save to Firestore
    try {
      // Check if customer already exists by name and phone
      const customerQuery = query(
        collection(db, "customers"),
        where("customerName", "==", customer.customerName),
        where("customerPhone", "==", customer.customerPhone)
      );
      
      const querySnapshot = await getDocs(customerQuery);
      
      if (querySnapshot.empty) {
        // Create new customer
        const docRef = await addDoc(collection(db, "customers"), customer);
        console.log("Customer saved to cloud with ID: ", docRef.id);
        
        // Return the customer with the new ID
        return { ...customer, id: docRef.id };
      } else {
        // Update existing customer
        const docRef = doc(db, "customers", querySnapshot.docs[0].id);
        await updateDoc(docRef, customer);
        console.log("Customer updated in cloud with ID: ", querySnapshot.docs[0].id);
        
        // Return the customer with the existing ID
        return { ...customer, id: querySnapshot.docs[0].id };
      }
    } catch (error) {
      console.error("Error saving customer to cloud: ", error);
    }
    
    // Save to local storage
    try {
      const customers = BillStorageService.getCustomersFromLocalStorage();
      
      // Check if customer already exists by name and phone
      const existingCustomerIndex = customers.findIndex(c => 
        c.customerName === customer.customerName && c.customerPhone === customer.customerPhone
      );
      
      if (existingCustomerIndex !== -1) {
        // Update existing customer
        customers[existingCustomerIndex] = customer;
      } else {
        // Add new customer
        customers.push(customer);
      }
      
      localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(customers));
      console.log("Customer saved to local storage");
      
      return customer;
    } catch (error) {
      console.error("Error saving customer to local storage: ", error);
    }
  },
  
  getCustomersFromLocalStorage: () => {
    try {
      const customersJson = localStorage.getItem(CUSTOMER_STORAGE_KEY);
      return customersJson ? JSON.parse(customersJson) : [];
    } catch (error) {
      console.error("Error getting customers from local storage: ", error);
      return [];
    }
  },
  
  getCustomersFromCloud: async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "customers"));
      const customers = [];
      querySnapshot.forEach((doc) => {
        customers.push({ id: doc.id, ...doc.data() });
      });
      return customers;
    } catch (error) {
      console.error("Error getting customers from cloud: ", error);
      return [];
    }
  },
  
  findCustomerByName: async (name) => {
    try {
      // First check local storage
      const localCustomers = BillStorageService.getCustomersFromLocalStorage();
      const localMatch = localCustomers.find(c => 
        c.customerName.toLowerCase() === name.toLowerCase()
      );
      
      if (localMatch) {
        return localMatch;
      }
      
      // If not found locally, check cloud
      const customerQuery = query(
        collection(db, "customers"),
        where("customerName", "==", name)
      );
      
      const querySnapshot = await getDocs(customerQuery);
      
      if (!querySnapshot.empty) {
        const customer = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
        
        // Save to local storage for next time
        BillStorageService.saveCustomer(customer);
        
        return customer;
      }
      
      return null;
    } catch (error) {
      console.error("Error finding customer: ", error);
      return null;
    }
  },
  
  // Bill methods
  saveBill: async (bill) => {
    // Add timestamps
    const billWithTimestamp = { 
      ...bill, 
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Save to Firestore
    try {
      const docRef = await addDoc(collection(db, "bills"), billWithTimestamp);
      console.log("Bill saved to cloud with ID: ", docRef.id);
      
      // Return the bill with the new ID
      const savedBill = { ...billWithTimestamp, id: docRef.id };
      
      // Save to local storage
      const bills = BillStorageService.getBillsFromLocalStorage();
      bills.push(savedBill);
      localStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(bills));
      
      return savedBill;
    } catch (error) {
      console.error("Error saving bill to cloud: ", error);
      
      // Save to local storage even if cloud save fails
      try {
        const bills = BillStorageService.getBillsFromLocalStorage();
        const offlineId = `offline_${Date.now()}`;
        const offlineBill = { ...billWithTimestamp, id: offlineId, pendingSync: true };
        
        bills.push(offlineBill);
        localStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(bills));
        console.log("Bill saved to local storage with offline ID");
        
        return offlineBill;
      } catch (localError) {
        console.error("Error saving bill to local storage: ", localError);
      }
    }
  },
  
  getBillsFromLocalStorage: () => {
    try {
      const billsJson = localStorage.getItem(BILLS_STORAGE_KEY);
      return billsJson ? JSON.parse(billsJson) : [];
    } catch (error) {
      console.error("Error getting bills from local storage: ", error);
      return [];
    }
  },
  
  getBillsFromCloud: async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "bills"));
      const bills = [];
      querySnapshot.forEach((doc) => {
        // Convert Firestore timestamps to JS dates
        const data = doc.data();
        if (data.createdAt) {
          data.createdAt = data.createdAt.toDate();
        }
        if (data.updatedAt) {
          data.updatedAt = data.updatedAt.toDate();
        }
        
        bills.push({ id: doc.id, ...data });
      });
      return bills;
    } catch (error) {
      console.error("Error getting bills from cloud: ", error);
      return [];
    }
  },
  
  getBillById: async (billId) => {
    // First check local storage
    const localBills = BillStorageService.getBillsFromLocalStorage();
    const localMatch = localBills.find(b => b.id === billId);
    
    if (localMatch) {
      return localMatch;
    }
    
    // If not found locally, check cloud
    try {
      const docRef = doc(db, "bills", billId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const bill = { id: docSnap.id, ...docSnap.data() };
        
        // Convert Firestore timestamps to JS dates
        if (bill.createdAt) {
          bill.createdAt = bill.createdAt.toDate();
        }
        if (bill.updatedAt) {
          bill.updatedAt = bill.updatedAt.toDate();
        }
        
        return bill;
      } else {
        console.log("No such bill!");
        return null;
      }
    } catch (error) {
      console.error("Error getting bill: ", error);
      return null;
    }
  },
  
  // Sync offline bills to cloud when online
  syncOfflineBills: async () => {
    if (!navigator.onLine) {
      console.log("Device is offline, cannot sync bills");
      return;
    }
    
    const bills = BillStorageService.getBillsFromLocalStorage();
    const offlineBills = bills.filter(bill => bill.pendingSync);
    
    if (offlineBills.length === 0) {
      console.log("No offline bills to sync");
      return;
    }
    
    console.log(`Syncing ${offlineBills.length} offline bills...`);
    
    for (const bill of offlineBills) {
      try {
        // Remove pendingSync flag and offline ID
        const { pendingSync, id, ...billData } = bill;
        
        // Add to Firestore
        const docRef = await addDoc(collection(db, "bills"), billData);
        console.log("Offline bill synced to cloud with ID: ", docRef.id);
        
        // Update local storage
        const updatedBills = bills.map(b => {
          if (b.id === id) {
            return { ...billData, id: docRef.id };
          }
          return b;
        });
        
        localStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(updatedBills));
      } catch (error) {
        console.error("Error syncing offline bill: ", error);
      }
    }
  }
};

// Listen for online status to sync
window.addEventListener('online', () => {
  console.log("Device is online, syncing offline bills...");
  BillStorageService.syncOfflineBills();
});

export default BillStorageService;