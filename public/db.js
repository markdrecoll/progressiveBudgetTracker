const indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;

let db;
// request new database
const request = indexedDB.open('budget', 1);

request.onupgradeneeded = function (event) {

  let db = event.target.result;

  // create an object store for budget transactions
  db.createObjectStore('BudgetTable', {
    autoIncrement: true
  });
};

request.onsuccess = function (event) {
  db = event.target.result;

  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function (event) {
  console.log(event.target.err);
};

function saveRecord(record) {
  // save records into the database
  const transaction = db.transaction(['BudgetTable'], 'readwrite');
  const BudgetStore = transaction.objectStore('BudgetTable');
  BudgetStore.add(record);
}

function checkDatabase() {
  const transaction = db.transaction(['BudgetTable'], 'readwrite');
  const BudgetStore = transaction.objectStore('BudgetTable');
  // get records from store and save them
  const getAll = BudgetStore.getAll();
  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
        .then((response) => {
          return response.json();
        })
        .then(() => {
          const transaction = db.transaction(['BudgetTable'], 'readwrite');
          const objectStore = transaction.objectStore('BudgetTable');
          // clear the object store
          objectStore.clear();
        });
    }
  };
}

// check if app is online
window.addEventListener('online', checkDatabase);