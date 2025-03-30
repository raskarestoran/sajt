// Replace with your Google Sheets published URL (CSV format)
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTZs31vUp_R5JT1aB8-hD5d6QhGApt63qWlIKZDpLHOrWRv0cJLShAn_7gtO4VfDTqY9cADH5-qZXC1/pub?output=csv';

async function fetchMenu() {
  const menuContainer = document.getElementById('menu'); // Get container reference

  try {
    const response = await fetch(SHEET_URL);

    // Check if the network request itself was successful (e.g., not 404)
    if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
    }

    const csvData = await response.text();

    // Check if we actually got some data
    if (!csvData || csvData.trim().length === 0) {
        throw new Error('Received empty data from the sheet.');
    }

    const menuData = parseCSV(csvData);
    displayMenu(menuData);

  } catch (error) {
    console.error('Error fetching or processing menu:', error);
    // Display an error message directly in the menu container
    menuContainer.innerHTML = `<p style="color: red; text-align: center; padding: 20px;">Došlo je do greške prilikom učitavanja menija. Molimo pokušajte ponovo kasnije ili obavestite osoblje.</p>`; // Serbian Error Message
  }
}

function parseCSV(csv) {
  // Split rows, handling potential empty lines at the end
  const rows = csv.trim().split('\n');
  if (rows.length < 1) return []; // Handle empty CSV

  // Extract headers, trimming whitespace
  const headers = rows.shift().split(',').map(header => header.trim());

  return rows.map(row => {
    const values = row.split(',');
    return headers.reduce((obj, header, index) => {
      // Assign value, trim whitespace, handle potentially missing values
      obj[header] = (values[index] || '').trim();
      return obj;
    }, {});
  }).filter(item => item.Name); // Filter out rows that might lack a 'Name' after parsing
}

function displayMenu(menu) {
  const menuContainer = document.getElementById('menu');
  // *** KEY CHANGE: Clear the container (removes the loading spinner) ***
  menuContainer.innerHTML = '';

  // Check if the menu is empty after parsing/filtering
  if (!menu || menu.length === 0) {
      menuContainer.innerHTML = `<p style="text-align: center; padding: 20px;">Meni je trenutno prazan.</p>`; // Serbian "Menu is empty" message
      return;
  }

  menu.forEach(item => {
    // Check if the item has a Name before creating the element
    if (item.Name) {
        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item';
        // Use || '' as a fallback for potentially missing Price or Description
        menuItem.innerHTML = `
          <h3>${item.Name} : ${item.Price || ''}</h3>
          <p>${item.Description || ''}</p>
        `;
        menuContainer.appendChild(menuItem);
    }
  });
}

// Load the menu when the window has finished loading
window.onload = fetchMenu;
