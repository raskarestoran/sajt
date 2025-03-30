// Replace with your Google Sheets published URL (CSV format)
// IMPORTANT: Ensure your sheet is published with the columns: Category, Name, Price, Description
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTZs31vUp_R5JT1aB8-hD5d6QhGApt63qWlIKZDpLHOrWRv0cJLShAn_7gtO4VfDTqY9cADH5-qZXC1/pub?output=csv'; // Keep your existing URL

// --- DOM Element References ---
const menuContainer = document.getElementById('menu');
const loader = document.getElementById('loader');
const menuPager = document.getElementById('menu-pager');
const categoryTitle = document.getElementById('category-title');
const categoryPagesContainer = document.getElementById('category-pages');
const prevButton = document.getElementById('prev-category');
const nextButton = document.getElementById('next-category');
const menuErrorContainer = document.getElementById('menu-error');
const menuEmptyContainer = document.getElementById('menu-empty');

// --- State Variables ---
let groupedMenu = {};
let categoryNames = [];
let currentCategoryIndex = 0;

// --- Main Fetch Function ---
async function fetchMenu() {
    showLoader(); // Show loader at the start

    try {
        const response = await fetch(SHEET_URL);
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }

        const csvData = await response.text();
        if (!csvData || csvData.trim().length === 0) {
            throw new Error('Received empty data from the sheet.');
        }

        const menuData = parseCSV(csvData);

        // Check if data was actually parsed
        if (!menuData || menuData.length === 0) {
             showEmptyMessage();
             return; // Stop processing
        }

        groupedMenu = groupMenuByCategory(menuData);
        categoryNames = Object.keys(groupedMenu); // Get category names

        // Sort categories alphabetically (Optional, but nice)
        categoryNames.sort((a, b) => a.localeCompare(b, 'sr')); // Serbian locale sort

        if (categoryNames.length === 0) {
            showEmptyMessage(); // No categories found or all items lack category
        } else {
            displayMenuPager(); // Build and show the pager UI
        }

    } catch (error) {
        console.error('Error fetching or processing menu:', error);
        showErrorMessage(`Došlo je do greške prilikom učitavanja menija. Proverite da li je Google Sheet pravilno objavljen i da li su nazivi kolona ("Category", "Name", "Price", "Description") tačni. (${error.message})`);
    } finally {
        hideLoader(); // Always hide loader after attempt
    }
}

// --- Helper Functions ---

function showLoader() {
    if(loader) loader.style.display = 'flex';
    if(menuPager) menuPager.style.display = 'none';
    if(menuErrorContainer) menuErrorContainer.style.display = 'none';
    if(menuEmptyContainer) menuEmptyContainer.style.display = 'none';
}

function hideLoader() {
     if(loader) loader.style.display = 'none';
}

function showErrorMessage(message) {
    hideLoader();
    if(menuPager) menuPager.style.display = 'none';
    if(menuEmptyContainer) menuEmptyContainer.style.display = 'none';
    if(menuErrorContainer) {
        menuErrorContainer.textContent = message;
        menuErrorContainer.style.display = 'block';
    }
}

function showEmptyMessage() {
    hideLoader();
     if(menuPager) menuPager.style.display = 'none';
     if(menuErrorContainer) menuErrorContainer.style.display = 'none';
     if(menuEmptyContainer) {
        menuEmptyContainer.textContent = "Meni je trenutno prazan ili nedostupan."; // Ensure Serbian message
        menuEmptyContainer.style.display = 'block';
     }
}

function parseCSV(csv) {
    const rows = csv.trim().split('\n');
    if (rows.length < 2) {
        console.warn("CSV has less than 2 rows (header + data expected).");
        return []; // Need header + at least one data row
    }

    const headers = rows.shift().split(',').map(header => header.trim());

    // *** KEY CHANGE: Find indices based on the NEW header names ***
    const categoryIndex = headers.indexOf('Category'); // Expected in Column A
    const nameIndex = headers.indexOf('Name');       // Expected in Column B
    const priceIndex = headers.indexOf('Price');      // Expected in Column C
    const descIndex = headers.indexOf('Description'); // Expected in Column D

    // **Important Check:** Verify that headers were found
    if (categoryIndex === -1 || nameIndex === -1) {
        // Price and Description might be optional, but Category and Name are essential
        throw new Error("CSV is missing required headers 'Category' or 'Name'. Please ensure the first row of your Google Sheet contains exactly these names.");
    }
     // Optional: Warn if optional headers are missing
     if (priceIndex === -1) {
         console.warn("CSV header 'Price' not found. Prices will be empty.");
     }
    if (descIndex === -1) {
         console.warn("CSV header 'Description' not found. Descriptions will be empty.");
     }


    return rows.map(row => {
        // Basic CSV row parsing (handles simple quoted commas)
        const values = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(val => {
            if (val.startsWith('"') && val.endsWith('"')) {
                return val.slice(1, -1).replace(/""/g, '"').trim();
            }
            return val.trim();
         });

        const item = {};

        // *** Assign values using the found indices ***
        // Use default 'Ostalo' if category column exists but cell is empty
        item.Category = categoryIndex !== -1 ? (values[categoryIndex] || 'Ostalo').trim() : 'Ostalo';
        item.Name = nameIndex !== -1 ? (values[nameIndex] || '') : ''; // Name is required, but handle potential empty cell
        item.Price = priceIndex !== -1 ? (values[priceIndex] || '') : ''; // Default to empty string if no price col/value
        item.Description = descIndex !== -1 ? (values[descIndex] || '') : ''; // Default to empty string if no desc col/value


        // Ensure Category is not empty after trimming, default again if needed
         if (!item.Category) {
             item.Category = 'Ostalo';
         }

        return item;
    }).filter(item => item.Name); // Filter out rows that genuinely lack a Name after parsing
}

function groupMenuByCategory(menuData) {
    const grouped = {};
    menuData.forEach(item => {
        // Category already defaulted in parseCSV if needed
        const category = item.Category;
        if (!grouped[category]) {
            grouped[category] = [];
        }
        grouped[category].push(item);
    });
    return grouped;
}

function displayMenuPager() {
    categoryPagesContainer.innerHTML = ''; // Clear previous pages

    // Create a page div for each category (using the potentially sorted categoryNames)
    categoryNames.forEach((catName, index) => {
        const categoryPage = document.createElement('div');
        categoryPage.className = 'category-page';
        categoryPage.id = `category-page-${index}`; // Assign unique ID
        categoryPage.dataset.categoryIndex = index; // Store index for easy reference

        // Add menu items for this category
        groupedMenu[catName].forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.className = 'menu-item';
             // Ensure price is displayed correctly, handle potential missing price
             const priceDisplay = item.Price ? `: ${item.Price}` : '';
            menuItem.innerHTML = `
                <h3>${item.Name} ${priceDisplay}</h3>
                <p>${item.Description || ''}</p>
            `;
            categoryPage.appendChild(menuItem);
        });

        categoryPagesContainer.appendChild(categoryPage);
    });

    // Show the first category page initially
    currentCategoryIndex = 0;
    showCategoryPage(currentCategoryIndex);

    // Show the pager container itself
    menuPager.style.display = 'block';

    // Add event listeners for navigation buttons (ensure they are only added once)
    // Remove potential old listeners before adding new ones
    prevButton.removeEventListener('click', showPreviousCategory);
    nextButton.removeEventListener('click', showNextCategory);
    // Add new listeners
    prevButton.addEventListener('click', showPreviousCategory);
    nextButton.addEventListener('click', showNextCategory);

    // Update button states initially
    updateNavButtons();
}

function showCategoryPage(index) {
    // Check index bounds
    if (index < 0 || index >= categoryNames.length) {
        console.warn(`Attempted to show invalid category index: ${index}`);
        return;
    }
    // Hide all pages
    document.querySelectorAll('.category-page').forEach(page => {
        page.classList.remove('active');
    });

    // Show the selected page
    const activePage = document.getElementById(`category-page-${index}`);
    if (activePage) {
        activePage.classList.add('active');
        // Update the title
        categoryTitle.textContent = categoryNames[index];
        // Optional: Scroll to top of menu container if needed
        // menuContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
         console.warn(`Category page element not found for index: ${index}`);
    }

    currentCategoryIndex = index;
    updateNavButtons(); // Update button enable/disable state
}

function showPreviousCategory() {
    if (currentCategoryIndex > 0) {
        showCategoryPage(currentCategoryIndex - 1);
    }
}

function showNextCategory() {
    if (currentCategoryIndex < categoryNames.length - 1) {
        showCategoryPage(currentCategoryIndex + 1);
    }
}

function updateNavButtons() {
    prevButton.disabled = currentCategoryIndex <= 0;
    nextButton.disabled = currentCategoryIndex >= categoryNames.length - 1;

     // Explicitly handle the case of only one category
     if (categoryNames.length <= 1) {
         prevButton.disabled = true;
         nextButton.disabled = true;
     }
}


// --- Initial Load ---
window.onload = fetchMenu;
