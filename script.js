// Replace with your Google Sheets published URL (CSV format)
const SHEET_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTZs31vUp_R5JT1aB8-hD5d6QhGApt63qWlIKZDpLHOrWRv0cJLShAn_7gtO4VfDTqY9cADH5-qZXC1/pub?output=csv"; // Keep your existing URL

// --- DOM Element References ---
const menuContainer = document.getElementById("menu");
const loader = document.getElementById("loader");
const menuPager = document.getElementById("menu-pager");
const categoryNavLinksContainer = document.getElementById("category-nav-links"); // New Ref
const categoryTitle = document.getElementById("category-title");
const categoryPagesContainer = document.getElementById("category-pages");
const prevButton = document.getElementById("prev-category");
const nextButton = document.getElementById("next-category");
const menuErrorContainer = document.getElementById("menu-error");
const menuEmptyContainer = document.getElementById("menu-empty");

// --- State Variables ---
let groupedMenu = {};
let categoryNames = [];
let currentCategoryIndex = 0;

// --- Main Fetch Function ---
async function fetchMenu() {
    showLoader();

    try {
        const response = await fetch(SHEET_URL);
        if (!response.ok) {
            throw new Error(
                `Network response was not ok: ${response.statusText}`
            );
        }
        const csvData = await response.text();
        if (!csvData || csvData.trim().length === 0) {
            throw new Error("Received empty data from the sheet.");
        }

        const menuData = parseCSV(csvData);
        if (!menuData || menuData.length === 0) {
            showEmptyMessage();
            return;
        }

        groupedMenu = groupMenuByCategory(menuData);
        categoryNames = Object.keys(groupedMenu);
        categoryNames.sort((a, b) => a.localeCompare(b, "sr"));

        if (categoryNames.length === 0) {
            showEmptyMessage();
        } else {
            displayMenuPager(); // This function will now also build the links
        }
    } catch (error) {
        console.error("Error fetching or processing menu:", error);
        showErrorMessage(
            `Došlo je do greške prilikom učitavanja menija. Proverite da li je Google Sheet pravilno objavljen i da li su nazivi kolona ("Category", "Name", "Price", "Description") tačni. (${error.message})`
        );
    } finally {
        hideLoader();
    }
}

// --- Helper Functions ---

function showLoader() {
    if (loader) loader.style.display = "flex";
    if (menuPager) menuPager.style.display = "none";
    if (categoryNavLinksContainer)
        categoryNavLinksContainer.style.display = "none"; // Hide links
    if (menuErrorContainer) menuErrorContainer.style.display = "none";
    if (menuEmptyContainer) menuEmptyContainer.style.display = "none";
}

function hideLoader() {
    if (loader) loader.style.display = "none";
}

function showErrorMessage(message) {
    hideLoader();
    if (menuPager) menuPager.style.display = "none";
    if (categoryNavLinksContainer)
        categoryNavLinksContainer.style.display = "none"; // Hide links
    if (menuEmptyContainer) menuEmptyContainer.style.display = "none";
    if (menuErrorContainer) {
        menuErrorContainer.textContent = message;
        menuErrorContainer.style.display = "block";
    }
}

function showEmptyMessage() {
    hideLoader();
    if (menuPager) menuPager.style.display = "none";
    if (categoryNavLinksContainer)
        categoryNavLinksContainer.style.display = "none"; // Hide links
    if (menuErrorContainer) menuErrorContainer.style.display = "none";
    if (menuEmptyContainer) {
        menuEmptyContainer.textContent =
            "Meni je trenutno prazan ili nedostupan.";
        menuEmptyContainer.style.display = "block";
    }
}

function parseCSV(csv) {
    const rows = csv.trim().split("\n");
    if (rows.length < 2) {
        console.warn("CSV has less than 2 rows (header + data expected).");
        return [];
    }
    const headers = rows
        .shift()
        .split(",")
        .map((header) => header.trim());
    const categoryIndex = headers.indexOf("Category");
    const nameIndex = headers.indexOf("Name");
    const priceIndex = headers.indexOf("Price");
    const descIndex = headers.indexOf("Description");

    if (categoryIndex === -1 || nameIndex === -1) {
        throw new Error(
            "CSV is missing required headers 'Category' or 'Name'. Please ensure the first row of your Google Sheet contains exactly these names."
        );
    }
    if (priceIndex === -1)
        console.warn("CSV header 'Price' not found. Prices will be empty.");
    if (descIndex === -1)
        console.warn(
            "CSV header 'Description' not found. Descriptions will be empty."
        );

    return rows
        .map((row) => {
            const values = row
                .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
                .map((val) => {
                    if (val.startsWith('"') && val.endsWith('"')) {
                        return val.slice(1, -1).replace(/""/g, '"').trim();
                    }
                    return val.trim();
                });
            const item = {};
            item.Category = (categoryIndex !== -1
                ? values[categoryIndex] || "Ostalo"
                : "Ostalo"
            ).trim();
            item.Name = nameIndex !== -1 ? values[nameIndex] || "" : "";
            item.Price = priceIndex !== -1 ? values[priceIndex] || "" : "";
            item.Description = descIndex !== -1 ? values[descIndex] || "" : "";
            if (!item.Category) item.Category = "Ostalo"; // Ensure default if trimming resulted in empty
            return item;
        })
        .filter((item) => item.Name);
}

function groupMenuByCategory(menuData) {
    const grouped = {};
    menuData.forEach((item) => {
        const category = item.Category;
        if (!grouped[category]) {
            grouped[category] = [];
        }
        grouped[category].push(item);
    });
    return grouped;
}

function displayMenuPager() {
    // --- 1. Build Category Links ---
    categoryNavLinksContainer.innerHTML = ""; // Clear previous links
    categoryNames.forEach((catName, index) => {
        const link = document.createElement("a");
        link.href = "#"; // Prevent page jump
        link.className = "category-link";
        link.textContent = catName;
        link.dataset.categoryIndex = index; // Store index to know which page to show

        link.addEventListener("click", (event) => {
            event.preventDefault(); // Stop '#' from changing URL
            const clickedIndex = parseInt(
                event.target.dataset.categoryIndex,
                10
            );
            showCategoryPage(clickedIndex);
        });

        categoryNavLinksContainer.appendChild(link);
    });

    // --- 2. Build Category Pages ---
    categoryPagesContainer.innerHTML = ""; // Clear previous pages
    categoryNames.forEach((catName, index) => {
        const categoryPage = document.createElement("div");
        categoryPage.className = "category-page";
        categoryPage.id = `category-page-${index}`;
        categoryPage.dataset.categoryIndex = index;

        groupedMenu[catName].forEach((item) => {
            const menuItem = document.createElement("div");
            menuItem.className = "menu-item";
            const priceDisplay = item.Price ? `: ${item.Price}` : "";
            menuItem.innerHTML = `
                <h3>${item.Name} ${priceDisplay}</h3>
                <p>${item.Description || ""}</p>
            `;
            categoryPage.appendChild(menuItem);
        });
        categoryPagesContainer.appendChild(categoryPage);
    });

    // --- 3. Show Initial State & Setup Nav ---
    currentCategoryIndex = 0;
    showCategoryPage(currentCategoryIndex); // Show first page AND update active link

    // Show the containers
    categoryNavLinksContainer.style.display = "flex"; // Use flex for links container
    menuPager.style.display = "block";

    // Add event listeners for navigation buttons
    prevButton.removeEventListener("click", showPreviousCategory);
    nextButton.removeEventListener("click", showNextCategory);
    prevButton.addEventListener("click", showPreviousCategory);
    nextButton.addEventListener("click", showNextCategory);

    updateNavButtons(); // Update button states initially
}

function showCategoryPage(index) {
    if (index < 0 || index >= categoryNames.length) return; // Index bounds check

    // --- 1. Update Page Content Visibility ---
    document.querySelectorAll(".category-page").forEach((page) => {
        page.classList.remove("active");
    });
    const activePage = document.getElementById(`category-page-${index}`);
    if (activePage) {
        activePage.classList.add("active");
        categoryTitle.textContent = categoryNames[index]; // Update page title
    }

    // --- 2. Update Active Category Link ---
    document.querySelectorAll(".category-link").forEach((link) => {
        link.classList.remove("active");
        // Check dataset.categoryIndex and add 'active' class if it matches the current index
        if (parseInt(link.dataset.categoryIndex, 10) === index) {
            link.classList.add("active");
        }
    });

    currentCategoryIndex = index;
    updateNavButtons();
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
    if (categoryNames.length <= 1) {
        prevButton.disabled = true;
        nextButton.disabled = true;
    }
}

// --- Initial Load ---
window.onload = fetchMenu;
