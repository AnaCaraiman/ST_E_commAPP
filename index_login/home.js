// Home page: category filters + product grid

// categoryId -> category name, filled once from the backend and used to label the cards
let categoryNames = {};

document.addEventListener('DOMContentLoaded', async () => {
    // No login needed to browse
    renderNav('home');

    await loadHomePage();
});

// Load categories and products at the same time (two independent backend calls)
async function loadHomePage() {
    try {
        // BACKEND CALLS: GET /categories  and  GET /products
        const [categories, products] = await Promise.all([apiGetCategories(), apiGetProducts()]);

        categories.forEach(category => {
            categoryNames[category.id] = category.name;
        });

        renderCategoryFilters(categories);
        renderProducts(products);
    } catch (error) {
        showGridMessage(getErrorMessage(error), true);
    }
}

// Create one button per category (the "All" button already exists in the HTML)
function renderCategoryFilters(categories) {
    const filters = document.getElementById('categoryFilters');

    categories.forEach(category => {
        const button = document.createElement('button');
        button.className = 'filter-btn';
        button.dataset.category = category.id;
        button.dataset.testid = 'filter-' + category.name;
        button.textContent = category.name;
        filters.appendChild(button);
    });

    // One click handler for all buttons, "All" included
    filters.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', () => handleFilterClick(button));
    });
}

// Highlight the clicked button, then ask the backend for the matching products.
// The job portal filtered the cards already on the page (data-type); here the FILTERING HAPPENS IN THE BACKEND.
async function handleFilterClick(button) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    const categoryId = button.dataset.category;
    showGridMessage('Loading products...', false);

    try {
        // BACKEND CALL: GET /products   or   GET /products/category/{categoryId}
        const products = categoryId === 'all'
            ? await apiGetProducts()
            : await apiGetProductsByCategory(categoryId);
        renderProducts(products);
    } catch (error) {
        showGridMessage(getErrorMessage(error), true);
    }
}

// Build the product cards. The picture comes from images.js (the backend has no image field)
function renderProducts(products) {
    const grid = document.getElementById('productsGrid');

    if (!products || products.length === 0) {
        showGridMessage('No products found.', false);
        return;
    }

    grid.innerHTML = products.map(product => {
        const stockInfo = getStockInfo(product.stock);
        const categoryName = categoryNames[product.categoryId] || 'Uncategorized';

        // "name" is optional in the backend (only the description is mandatory), so fall back to something readable
        const title = product.name || truncateText(product.description, 40) || 'Unnamed product';

        return `
            <a href="../product-detail/product-detail.html?id=${encodeURIComponent(product.id)}" class="product-card" data-testid="product-card" data-product-id="${escapeHtml(product.id)}">
                <img class="product-image" src="${getProductImage(product.name, categoryName)}" alt="${escapeHtml(title)}" loading="lazy">

                <div class="product-header">
                    <div>
                        <div class="product-title">${escapeHtml(title)}</div>
                        <div class="product-category">${escapeHtml(categoryName)}</div>
                    </div>
                    <div class="product-price">${formatPrice(product.price)}</div>
                </div>

                <div class="product-tags">
                    <span class="tag ${stockInfo.cssClass}">${stockInfo.label}</span>
                </div>

                <div class="product-description">
                    ${escapeHtml(truncateText(product.description, 160))}
                </div>

                <div class="product-meta">
                    <div class="meta-item">📦 ${product.stock} in stock</div>
                </div>
            </a>
        `;
    }).join('');
}

// Loading / empty / error text inside the grid
function showGridMessage(message, isError) {
    document.getElementById('productsGrid').innerHTML =
        `<div class="state-message ${isError ? 'error' : ''}" data-testid="grid-message">${escapeHtml(message)}</div>`;
}
