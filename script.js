// Replace with your Google Sheets published URL (CSV format)
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQO83OsrtawRdq3qXgo0xzdCbc0o0ask3hqkDrrZCvL4tw2F-2StZaujVsNOr-4adB1lfmCm9IWom6e/pub?output=csv';

async function fetchMenu() {
  try {
    const response = await fetch(SHEET_URL);
    const csvData = await response.text();
    displayMenu(parseCSV(csvData));
  } catch (error) {
    console.error('Error fetching menu:', error);
  }
}

function parseCSV(csv) {
  const rows = csv.split('\n');
  const headers = rows.shift().split(',');
  return rows.map(row => {
    const values = row.split(',');
    return headers.reduce((obj, header, index) => {
      obj[header.trim()] = values[index]?.trim();
      return obj;
    }, {});
  });
}

function displayMenu(menu) {
  const menuContainer = document.getElementById('menu');
  menuContainer.innerHTML = ''; // Clear existing menu
  menu.forEach(item => {
    const menuItem = document.createElement('div');
    menuItem.className = 'menu-item';
    menuItem.innerHTML = `
      <h3>${item.Name} - ${item.Price}</h3>
      <p>${item.Description}</p>
    `;
    menuContainer.appendChild(menuItem);
  });
}

// Load the menu on page load
window.onload = fetchMenu;
