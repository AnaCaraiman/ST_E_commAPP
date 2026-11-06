/* ==========================================================================
   cart-service.js  -  ONE cart API for the pages, whether the visitor is logged in or not

   Logged in : every function calls the backend (api.js) - the cart is stored in the database.
   Guest     : the backend cannot hold a cart without a real user id (CartService.ensureUserExists -> 404),
               so the guest's cart is kept in localStorage as [{productId, quantity}].
               Names, prices and stock are always read from the backend, so they are never out of date.
   At login  : mergeGuestCart() moves the guest's items into the user's backend cart.

   Both kinds return the same shape (CartDTO):
   {items:[{productId, name, price, quantity, subtotal, stock, available}], totalItems, totalPrice}
   so cart.js does not care which one it got.
   ========================================================================== */

const GUEST_CART_KEY = 'guestCart';


/* ---------- GUEST CART STORAGE ---------- */

function loadGuestItems() {
    const stored = localStorage.getItem(GUEST_CART_KEY);
    return stored ? JSON.parse(stored) : [];
}

function saveGuestItems(items) {
    if (items.length === 0) {
        localStorage.removeItem(GUEST_CART_KEY);
    } else {
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    }
}

// Same message and fields as the backend's InsufficientStockException (409), so the pages handle both the same way
function ensureGuestStock(product, requested) {
    const stock = product.stock || 0;
    if (requested > stock) {
        throw new ApiError(409,
            "Not enough stock for product '" + (product.name || product.id) + "': requested " + requested + ", available " + stock,
            { status: 409, productId: product.id, available: stock });
    }
}

// Turn the stored {productId, quantity} lines into a CartDTO-shaped object
async function buildGuestCart() {
    const items = loadGuestItems();
    let products = [];

    if (items.length > 0) {
        // BACKEND CALL: GET /products  (one request gives the current name, price and stock of every line)
        products = await apiGetProducts();
    }

    const lines = items.map(item => {
        const product = products.find(p => p.id === item.productId);
        // A product deleted from the catalog is shown as unavailable (same as the backend does for logged in carts)
        if (!product) {
            return { productId: item.productId, name: null, price: 0, quantity: item.quantity, subtotal: 0, stock: 0, available: false };
        }
        return {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: item.quantity,
            subtotal: product.price * item.quantity,
            stock: product.stock,
            available: product.stock >= item.quantity
        };
    });

    return {
        id: null,
        userId: null,
        items: lines,
        totalItems: lines.reduce((sum, line) => sum + line.quantity, 0),
        totalPrice: lines.reduce((sum, line) => sum + line.subtotal, 0)
    };
}


/* ---------- THE CART API USED BY THE PAGES ---------- */

// Get the whole cart
async function getCart() {
    const user = getCurrentUser();
    if (user) {
        return apiGetCart(user.id);                      // BACKEND CALL: GET /carts/user/{userId}
    }
    return buildGuestCart();
}

// Number of pieces in the cart, for the red badge. A guest needs no request at all.
async function getCartCount() {
    const user = getCurrentUser();
    if (user) {
        const cart = await apiGetCart(user.id);          // BACKEND CALL: GET /carts/user/{userId}
        return cart.totalItems;
    }
    return loadGuestItems().reduce((sum, item) => sum + item.quantity, 0);
}

// Add pieces of a product (they are ADDED to what the cart already has). Throws ApiError 400 / 404 / 409.
async function addItemToCart(productId, quantity) {
    const user = getCurrentUser();
    if (user) {
        return apiAddToCart(user.id, productId, quantity);   // BACKEND CALL: POST /carts/user/{userId}/items
    }

    if (quantity < 1) {
        throw new ApiError(400, 'Quantity must be at least 1');
    }
    const product = await apiGetProductById(productId);      // BACKEND CALL: GET /products/{id}  (404 if it does not exist)
    const items = loadGuestItems();
    const existing = items.find(item => item.productId === productId);
    const newQuantity = (existing ? existing.quantity : 0) + quantity;

    ensureGuestStock(product, newQuantity);

    if (existing) {
        existing.quantity = newQuantity;
    } else {
        items.push({ productId: productId, quantity: newQuantity });
    }
    saveGuestItems(items);
}

// SET the quantity of a line (0 removes it). Throws ApiError 400 / 404 / 409. Returns the updated cart.
async function setItemQuantity(productId, quantity) {
    const user = getCurrentUser();
    if (user) {
        return apiUpdateCartItem(user.id, productId, quantity);  // BACKEND CALL: PUT /carts/user/{userId}/items/{productId}
    }

    if (quantity === null || isNaN(quantity) || quantity < 0) {
        throw new ApiError(400, 'Quantity must be 0 or more');
    }
    const items = loadGuestItems();
    const item = items.find(i => i.productId === productId);
    if (!item) {
        throw new ApiError(404, 'Product ' + productId + ' in cart not found');
    }

    if (quantity === 0) {
        saveGuestItems(items.filter(i => i !== item));
    } else {
        const product = await apiGetProductById(productId);  // BACKEND CALL: GET /products/{id}
        ensureGuestStock(product, quantity);
        item.quantity = quantity;
        saveGuestItems(items);
    }
    return buildGuestCart();
}

// Remove one line. Returns the updated cart.
async function removeItemFromCart(productId) {
    const user = getCurrentUser();
    if (user) {
        return apiRemoveCartItem(user.id, productId);    // BACKEND CALL: DELETE /carts/user/{userId}/items/{productId}
    }

    saveGuestItems(loadGuestItems().filter(item => item.productId !== productId));
    return buildGuestCart();
}

// Remove everything. Returns the empty cart.
async function emptyCart() {
    const user = getCurrentUser();
    if (user) {
        return apiClearCart(user.id);                    // BACKEND CALL: DELETE /carts/user/{userId}
    }

    saveGuestItems([]);
    return buildGuestCart();
}


/* ---------- AFTER LOGIN ---------- */

// Move the guest's items into the user's backend cart, then forget the guest cart.
// The backend decides what is possible (stock!), so one line can fail while the others succeed.
// Returns a list of problem messages (empty when everything was added).
async function mergeGuestCart(userId) {
    const items = loadGuestItems();
    const problems = [];

    for (const item of items) {
        try {
            // BACKEND CALL: POST /carts/user/{userId}/items  (once per line)
            await apiAddToCart(userId, item.productId, item.quantity);
        } catch (error) {
            problems.push(getErrorMessage(error));
        }
    }

    saveGuestItems([]);
    return problems;
}
