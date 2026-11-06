/* ==========================================================================
   common.js  -  helpers used by every page (no backend calls in this file)
   Load order in every HTML page:  api.js -> common.js -> (other js/ files) -> <page>.js
   ========================================================================== */


/* ---------- SESSION (who is logged in) ----------
   The backend has NO tokens / sessions: POST /auth/login just returns {id, username, email}.
   So the front-end keeps that object in localStorage under the key 'currentUser',
   and sends user.id in the URL of every cart / order call (/carts/user/{id}, /orders/history/{id}).
   No user in localStorage = a guest. Guests can browse and fill a cart (see cart-service.js),
   they only have to log in to place an order. */

// Get the logged in user, or null for a guest
function getCurrentUser() {
    const stored = localStorage.getItem('currentUser');
    return stored ? JSON.parse(stored) : null;
}

// Save the user returned by the backend after login
function setCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

// Forget the user (log out)
function clearCurrentUser() {
    localStorage.removeItem('currentUser');
}

// "cart/cart.html" - the last two parts of the address of the page we are on
function getCurrentPagePath() {
    return window.location.pathname.split('/').filter(Boolean).slice(-2).join('/');
}

// Login page address that remembers where to come back to (used from pages that live one folder deep)
function buildLoginUrl() {
    return '../login/login.html?returnTo=' + encodeURIComponent(getCurrentPagePath());
}

// Where to go after login/signup. Only our own pages are accepted ("cart/cart.html"),
// so a link like ?returnTo=https://evil.com is ignored.
function getReturnPath() {
    const value = new URLSearchParams(window.location.search).get('returnTo');
    return value && /^[a-z0-9_-]+\/[a-z0-9_-]+\.html$/i.test(value) ? value : 'index_login/home_page.html';
}

// Call at the start of every page that needs a login (payment, orders, profile).
// Returns the user, or sends the visitor to the login page and comes back afterwards.
function requireLogin() {
    const user = getCurrentUser();
    if (!user || !user.id) {
        window.location.href = buildLoginUrl();
        return null;
    }
    return user;
}


/* ---------- POPUP ----------
   Same markup as the job portal, on every page that shows messages:
   <div class="overlay" id="overlay"></div>
   <div class="popup" id="popup"><div class="popup-message" id="popupMessage"></div><button class="popup-close" id="popupClose">OK</button></div> */

// type is 'success' or 'error' (decides the colored top border)
function showPopup(message, type) {
    const popup = document.getElementById('popup');
    const popupMessage = document.getElementById('popupMessage');
    popup.className = 'popup ' + (type || 'success');
    popupMessage.textContent = message;
    document.getElementById('overlay').style.display = 'block';
    popup.style.display = 'block';
}

function closePopup() {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('popup').style.display = 'none';
}

// Wire the OK button and the dark overlay to closePopup()
function setupPopup() {
    document.getElementById('popupClose').addEventListener('click', closePopup);
    document.getElementById('overlay').addEventListener('click', closePopup);
}

// Turn anything that was thrown into text for the user.
// ApiError.message already contains the backend's message (e.g. "Not enough stock for product 'X': requested 5, available 2")
function getErrorMessage(error) {
    if (error && error.message) {
        return error.message;
    }
    return 'Something went wrong. Please try again.';
}

// A message to show on the NEXT page (the login page redirects, so it cannot show a popup itself)
function setNotice(message) {
    localStorage.setItem('notice', message);
}

// Show the stored message once (needs the popup markup + setupPopup() on the page)
function showNotice() {
    const message = localStorage.getItem('notice');
    if (message) {
        localStorage.removeItem('notice');
        showPopup(message, 'error');
    }
}


/* ---------- PENDING PAYMENT ----------
   The backend order has no total, so after "Place Order" the cart page saves what the payment page needs:
   {orderId, userId, total, itemCount}. It is removed when the payment is confirmed. */

function setPendingPayment(payment) {
    localStorage.setItem('pendingPayment', JSON.stringify(payment));
}

function getPendingPayment() {
    const stored = localStorage.getItem('pendingPayment');
    return stored ? JSON.parse(stored) : null;
}

function clearPendingPayment() {
    localStorage.removeItem('pendingPayment');
}


/* ---------- FORMATTING ---------- */

// Prices are whole numbers (Long) in the backend; the currency is only a label
const CURRENCY = 'RON';

function formatPrice(amount) {
    return Number(amount || 0).toLocaleString('en-US') + ' ' + CURRENCY;
}

// The backend sends LocalDateTime as "2026-10-18T14:30:12.123"
// (Jackson could also send an array [2026,10,18,14,30,12] if timestamps are turned on, so both are handled)
function formatDate(value) {
    if (!value) {
        return '-';
    }
    const date = Array.isArray(value)
        ? new Date(value[0], value[1] - 1, value[2], value[3] || 0, value[4] || 0, value[5] || 0)
        : new Date(value);
    return isNaN(date.getTime()) ? '-' : date.toLocaleString();
}

// Product names / descriptions are typed by people, so never put them into innerHTML as they are
function escapeHtml(value) {
    return String(value === null || value === undefined ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Cut long text for the product cards on the home page
function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) {
        return text || '';
    }
    return text.substring(0, maxLength).trim() + '...';
}

// Stock level -> label + css class (see .tag.in-stock / .low-stock / .out-of-stock in styles.css)
// LOW_STOCK_LIMIT is a business rule that lives ONLY in the front-end (boundary value testing: 0, 1, 5, 6)
const LOW_STOCK_LIMIT = 5;

function getStockInfo(stock) {
    if (!stock || stock <= 0) {
        return { label: 'Out of stock', cssClass: 'out-of-stock' };
    }
    if (stock <= LOW_STOCK_LIMIT) {
        return { label: 'Only ' + stock + ' left', cssClass: 'low-stock' };
    }
    return { label: 'In stock', cssClass: 'in-stock' };
}


/* ---------- INLINE FORM ERROR (login, signup, payment) ----------
   <div class="form-error" id="formError"></div> sits above the submit button */

function showFormError(message) {
    const box = document.getElementById('formError');
    box.textContent = message;
    box.style.display = 'block';
}

function hideFormError() {
    const box = document.getElementById('formError');
    box.textContent = '';
    box.style.display = 'none';
}
