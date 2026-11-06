/* ==========================================================================
   api.js  -  THE ONLY FILE THAT TALKS TO THE BACKEND

   Backend: https://github.com/AnaCaraiman/ST_E_commAPP  (Spring Boot + MongoDB)

   How the communication works (same for every call below):

     page JS (home.js, cart.js, ...)
        |  calls e.g. apiAddToCart(userId, productId, 2)
        v
     api.js  ->  apiRequest()  ->  fetch("http://localhost:8080/carts/user/ID/items", {method:"POST", body: JSON})
        |                                         |
        |                                         v
        |                  Spring Controller (CartController) -> Service (CartService) -> Mongo
        |                                         |
        |        success: JSON body (a DTO, e.g. CartDTO)      <---+
        |        failure: {"status": 409, "error": "message"}  <---+  (GlobalExceptionHandler.java)
        v
     apiRequest() returns the parsed JSON, or throws an ApiError(status, message, details)
        v
     page JS shows the data, or shows error.message in a popup

   Why one file? For testing:
     - unit tests can mock fetch() or the apiXxx functions in ONE place
     - integration tests only need to change API_BASE_URL
     - every endpoint of the backend is listed here, so coverage is easy to see
   ========================================================================== */


/* ---------- CONFIG ---------- */

// BACKEND CONNECTION POINT #1: where the Spring Boot app listens.
// The backend only accepts browser calls from http://localhost:3000, :5173 and :4200 (CorsConfig.java),
// so serve this front-end on one of those ports (see README.md), or start the backend with
// CORS_ALLOWED_ORIGINS=http://localhost:5500 (for example).
const API_BASE_URL = 'http://localhost:8080';


/* ---------- ERROR TYPE ---------- */

// Thrown by apiRequest() for every failed call. Mirrors the backend error body {status, error}.
//   status  : HTTP status (400, 401, 404, 409...) or 0 when the server could not be reached at all
//   message : text meant for the user (from the backend's "error" field)
//   details : the full error body; for 409 "not enough stock" it also contains {productId, available}
class ApiError extends Error {
    constructor(status, message, details) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.details = details || null;
    }
}


/* ---------- THE ONE FUNCTION THAT CALLS fetch() ---------- */

// method : 'GET' | 'POST' | 'PUT' | 'DELETE'
// path   : e.g. '/products' (it is appended to API_BASE_URL)
// body   : optional JS object, sent as JSON
async function apiRequest(method, path, body) {
    const options = { method, headers: {} };

    if (body !== undefined) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }

    let response;
    try {
        // BACKEND CONNECTION POINT #2: the actual network call
        response = await fetch(API_BASE_URL + path, options);
    } catch (networkError) {
        // Server down, wrong port, CORS blocked, no internet...
        throw new ApiError(0, 'Cannot reach the server. Is the backend running on ' + API_BASE_URL + '?');
    }

    // Some endpoints answer with an empty body (DELETE -> 200/204, or GET /orders/{id} -> null).
    const text = await response.text();
    let data = null;
    if (text) {
        try {
            data = JSON.parse(text);
        } catch (parseError) {
            data = null;
        }
    }

    if (!response.ok) {
        // GlobalExceptionHandler.java always answers {"status": 409, "error": "message"}
        const message = (data && data.error) ? data.error : 'Request failed (HTTP ' + response.status + ')';
        throw new ApiError(response.status, message, data);
    }

    return data;
}


/* ==========================================================================
   AUTH            AuthController.java   (@RequestMapping("/auth"))
   ========================================================================== */

// POST /auth/signup   body {username, email, password}
//   201 -> {id, username, email}
//   400 -> invalid username (<3 chars) / email / password (min 6, 1 lower, 1 upper, 1 digit)
//   409 -> username or email already taken
function apiSignup(username, email, password) {
    return apiRequest('POST', '/auth/signup', { username, email, password });
}

// POST /auth/login   body {username, password}
//   The login form asks for an EMAIL: we send it in the "username" field, because UserService.login() looks the user up
//   by email when the value contains '@' (and by username otherwise).
//   200 -> {id, username, email}      NOTE: there is no token/JWT - the front-end just remembers the user id
//   401 -> invalid credentials (same message for unknown user and wrong password)
function apiLogin(username, password) {
    return apiRequest('POST', '/auth/login', { username, password });
}


/* ==========================================================================
   PRODUCTS        ProductController.java   (@RequestMapping("/products"))
   ========================================================================== */

// GET /products  ->  [{id, name, description, price, stock, categoryId}]
function apiGetProducts() {
    return apiRequest('GET', '/products');
}

// GET /products/{id}  ->  ProductDTO   |  404 if the id does not exist
function apiGetProductById(productId) {
    return apiRequest('GET', '/products/' + encodeURIComponent(productId));
}

// GET /products/{id}/stock?quantity=N  ->  StockDTO {productId, stock, inStock, requestedQuantity, available}
//   inStock   = stock > 0            available = stock >= quantity
//   400 if quantity < 1 (or not a number)   |   404 if the product does not exist
//   Read-only: it changes nothing, it only answers "can I buy N pieces right now?"
function apiCheckStock(productId, quantity) {
    return apiRequest('GET', '/products/' + encodeURIComponent(productId) + '/stock?quantity=' + encodeURIComponent(quantity));
}

// GET /products/category/{categoryId}  ->  [ProductDTO]
function apiGetProductsByCategory(categoryId) {
    return apiRequest('GET', '/products/category/' + encodeURIComponent(categoryId));
}


/* ==========================================================================
   CATEGORIES      CategoryController.java   (@RequestMapping("/categories"))
   ========================================================================== */

// GET /categories  ->  [{id, name, description}]
function apiGetCategories() {
    return apiRequest('GET', '/categories');
}

// GET /categories/{id}  ->  CategoryDTO  |  404
function apiGetCategoryById(categoryId) {
    return apiRequest('GET', '/categories/' + encodeURIComponent(categoryId));
}


/* ==========================================================================
   CART            CartController.java   (@RequestMapping("/carts/user/{userId}"))
   Every cart call returns the whole updated cart:
     CartDTO = {id, userId, items:[{productId, name, price, quantity, subtotal, stock, available}], totalItems, totalPrice}
   The cart lives in the database (not in localStorage), so it follows the user across browsers.
   ========================================================================== */

// GET /carts/user/{userId}  ->  CartDTO (an empty cart if nothing was added yet)
function apiGetCart(userId) {
    return apiRequest('GET', '/carts/user/' + encodeURIComponent(userId));
}

// POST /carts/user/{userId}/items   body {productId, quantity}
//   200 -> CartDTO   |   409 -> not enough stock (details.available tells how many are left)
//   If the product is already in the cart the quantities are added together (and re-checked against the stock).
function apiAddToCart(userId, productId, quantity) {
    return apiRequest('POST', '/carts/user/' + encodeURIComponent(userId) + '/items', { productId, quantity });
}

// PUT /carts/user/{userId}/items/{productId}   body {quantity}
//   Sets the quantity (not "adds"). quantity 0 removes the line. 409 if not enough stock.
function apiUpdateCartItem(userId, productId, quantity) {
    return apiRequest('PUT', '/carts/user/' + encodeURIComponent(userId) + '/items/' + encodeURIComponent(productId), { quantity });
}

// DELETE /carts/user/{userId}/items/{productId}  ->  CartDTO  |  404 if the product is not in the cart
function apiRemoveCartItem(userId, productId) {
    return apiRequest('DELETE', '/carts/user/' + encodeURIComponent(userId) + '/items/' + encodeURIComponent(productId));
}

// DELETE /carts/user/{userId}  ->  empty CartDTO
function apiClearCart(userId) {
    return apiRequest('DELETE', '/carts/user/' + encodeURIComponent(userId));
}

// POST /carts/user/{userId}/checkout   (no body)
//   201 -> OrderDTO {id, userId, status: "PENDING", createdAt}   - stock is decremented NOW, and the cart is emptied
//   400 -> cart is empty   |   409 -> not enough stock for one of the lines
function apiCheckout(userId) {
    return apiRequest('POST', '/carts/user/' + encodeURIComponent(userId) + '/checkout');
}


/* ==========================================================================
   ORDERS          OrderController.java   (@RequestMapping("/orders"))
   ========================================================================== */

// GET /orders/history/{userId}  ->  [{id, userId, status, createdAt}]
//   WATCH OUT: productOrders is always null in this response (OrderService builds the DTO without the lines),
//   so the front-end cannot show WHAT was ordered yet. Good candidate for a backend/front-end bug ticket.
function apiGetOrderHistory(userId) {
    return apiRequest('GET', '/orders/history/' + encodeURIComponent(userId));
}


/* ==========================================================================
   NOT WIRED TO ANY PAGE YET  -  intentionally left out, to be re-introduced later.
   The endpoints exist in the backend; un-comment the function, then build the UI.
   See the "LEFT OUT" list in README.md (the numbers match the [LEFT OUT #n] markers in the pages).
   ========================================================================== */

// [LEFT OUT #2] Bestsellers section on the home page
// GET /products/top-ordered?limit=5  ->  [ProductDTO]
// function apiGetTopProducts(limit) {
//     return apiRequest('GET', '/products/top-ordered?limit=' + encodeURIComponent(limit));
// }

// [LEFT OUT #3] Order details page / cancelling an order
// GET /orders/{id}  ->  OrderDTO   (returns an EMPTY body with 200 when the id does not exist -> apiRequest gives null)
// PUT /orders/{id}/status?status=CANCELLED   (status is a QUERY parameter, not a JSON body)
// function apiGetOrderById(orderId) {
//     return apiRequest('GET', '/orders/' + encodeURIComponent(orderId));
// }
// function apiUpdateOrderStatus(orderId, status) {
//     return apiRequest('PUT', '/orders/' + encodeURIComponent(orderId) + '/status?status=' + encodeURIComponent(status));
// }

// [LEFT OUT #1] Support tickets (button on each order of orders/orders.html)
// POST /support-tickets?orderId=..&complaint=..   (BOTH are QUERY parameters, no JSON body!)
// GET  /support-tickets  ->  [{id, orderId, complaint, createdAt}]
// function apiCreateSupportTicket(orderId, complaint) {
//     return apiRequest('POST', '/support-tickets?orderId=' + encodeURIComponent(orderId) + '&complaint=' + encodeURIComponent(complaint));
// }
// function apiGetSupportTickets() {
//     return apiRequest('GET', '/support-tickets');
// }

// [LEFT OUT #6] Admin: manage the catalog (the seed script in tools/seed.js uses these same endpoints)
// POST /categories {name, description}   |   PUT /categories/{id}   |   DELETE /categories/{id}
// POST /products {name, description, price, stock, categoryId}   |   PUT /products/{id}   |   DELETE /products/{id}

// [LEFT OUT #7] Account management
// GET /users/{id}  |  GET /users/username/{username}  |  DELETE /users/{id}
// (there is NO "update user" / "change password" endpoint in the backend)
