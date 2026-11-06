// Product detail page. The product data comes from the backend (the job portal had it hard-coded in jobData)

// The product currently shown, kept so addToCart() can use its name and id
let currentProduct = null;

// Get product ID from URL  (product-detail.html?id=...)
function getProductIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Load product details
async function loadProductDetails() {
    const container = document.getElementById('productDetailContent');
    const productId = getProductIdFromURL();

    if (!productId) {
        container.innerHTML = '<p data-testid="product-error">Product not found.</p>';
        return;
    }

    try {
        // BACKEND CALL: GET /products/{id}   ->  ProductDTO   |  404 if it does not exist
        const product = await apiGetProductById(productId);
        currentProduct = product;

        // BACKEND CALL: GET /categories/{id}  - only used to show the category name; if it fails we simply skip the name
        let categoryName = 'Uncategorized';
        try {
            if (product.categoryId) {
                const category = await apiGetCategoryById(product.categoryId);
                categoryName = category.name;
            }
        } catch (categoryError) {
            // not important enough to stop the page
        }

        renderProduct(product, categoryName);
    } catch (error) {
        const message = error.status === 404 ? 'Product not found.' : getErrorMessage(error);
        container.innerHTML = `<p data-testid="product-error">${escapeHtml(message)}</p>`;
    }
}

// Draw the page for one product
function renderProduct(product, categoryName) {
    const stockInfo = getStockInfo(product.stock);
    const outOfStock = !product.stock || product.stock <= 0;
    const title = product.name || truncateText(product.description, 40) || 'Unnamed product';

    // The picture comes from images.js (the backend has no image field). [LEFT OUT #9] real photos / gallery
    const html = `
        <img class="product-detail-image" src="${getProductImage(product.name, categoryName)}" alt="${escapeHtml(title)}" data-testid="product-image">

        <div class="product-detail-info">
        <div class="product-header">
            <h1 class="product-title" data-testid="product-title">${escapeHtml(title)}</h1>
            <div class="product-category" data-testid="product-category">${escapeHtml(categoryName)}</div>
            <div class="product-tags">
                <span class="tag ${stockInfo.cssClass}" data-testid="product-stock-tag">${stockInfo.label}</span>
            </div>
            <div class="product-price" data-testid="product-price">${formatPrice(product.price)}</div>
        </div>

        <div class="product-meta">
            <div class="meta-item">📦 ${product.stock} in stock</div>
            <div class="meta-item">🆔 ${escapeHtml(product.id)}</div>
        </div>

        <div class="section">
            <h2 class="section-title">Description</h2>
            <div class="section-content">
                <p data-testid="product-description">${escapeHtml(product.description)}</p>
            </div>
        </div>

        <div class="buy-row">
            <div class="quantity-control">
                <button type="button" class="quantity-btn" id="quantityMinus" data-testid="quantity-minus" ${outOfStock ? 'disabled' : ''}>−</button>
                <input type="number" class="quantity-input" id="quantityInput" data-testid="quantity-input" value="1" min="1" ${outOfStock ? 'disabled' : ''}>
                <button type="button" class="quantity-btn" id="quantityPlus" data-testid="quantity-plus" ${outOfStock ? 'disabled' : ''}>+</button>
            </div>
            <button class="apply-button" id="addToCartBtn" data-testid="add-to-cart" ${outOfStock ? 'disabled' : ''}>
                ${outOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button type="button" class="check-btn" id="checkStockBtn" data-testid="check-availability">Check availability</button>
        </div>
        <div class="availability-result" id="availabilityResult" data-testid="availability-result"></div>
        </div>
    `;

    document.getElementById('productDetailContent').innerHTML = html;

    // Event listeners for the elements we just created
    const quantityInput = document.getElementById('quantityInput');
    document.getElementById('quantityMinus').addEventListener('click', () => {
        quantityInput.value = Math.max(1, (parseInt(quantityInput.value, 10) || 1) - 1);
    });
    document.getElementById('quantityPlus').addEventListener('click', () => {
        // No upper limit on purpose: the backend is the one that refuses more than the stock (409)
        quantityInput.value = (parseInt(quantityInput.value, 10) || 0) + 1;
    });

    document.getElementById('checkStockBtn').addEventListener('click', handleCheckAvailability);

    const addToCartBtn = document.getElementById('addToCartBtn');
    if (!outOfStock) {
        addToCartBtn.addEventListener('click', handleAddToCart);
    }
}

// Ask the backend whether the chosen quantity can be bought right now (nothing is added to the cart)
async function handleCheckAvailability() {
    const result = document.getElementById('availabilityResult');
    const quantity = Number(document.getElementById('quantityInput').value);

    try {
        // BACKEND CALL: GET /products/{id}/stock?quantity=N  ->  {productId, stock, inStock, requestedQuantity, available}
        //   400 quantity < 1   |   404 unknown product
        const stock = await apiCheckStock(currentProduct.id, quantity);

        if (!stock.inStock) {
            result.className = 'availability-result no';
            result.textContent = 'Out of stock.';
        } else if (stock.available) {
            result.className = 'availability-result yes';
            result.textContent = `${stock.requestedQuantity} available (${stock.stock} in stock).`;
        } else {
            result.className = 'availability-result no';
            result.textContent = `Not enough stock: ${stock.requestedQuantity} requested, only ${stock.stock} left.`;
        }
    } catch (error) {
        result.className = 'availability-result no';
        result.textContent = getErrorMessage(error);
    }
}

// Add the product to the cart (works for guests too, see cart-service.js)
async function handleAddToCart() {
    const quantity = Number(document.getElementById('quantityInput').value);

    if (!Number.isInteger(quantity)) {
        showPopup('Please enter a whole number for the quantity.', 'error');
        return;
    }

    try {
        // Logged in -> BACKEND CALL: POST /carts/user/{userId}/items  {productId, quantity}
        //   200 -> the whole updated cart   |   400 quantity < 1   |   409 not enough stock
        // Guest     -> saved in localStorage after the same stock check (GET /products/{id})
        // (the quantity is ADDED to what is already in the cart, and the total is checked against the stock)
        await addItemToCart(currentProduct.id, quantity);

        showPopup(`Added ${quantity} × ${currentProduct.name || 'product'} to your cart.`, 'success');
        updateCartBadge();
    } catch (error) {
        showPopup(getErrorMessage(error), 'error');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // No login needed to look at products or to fill the cart
    renderNav('home');
    setupPopup();
    loadProductDetails();
});
