/* ==========================================================================
   nav.js  -  the navigation bar, built in ONE place because it depends on who is logged in
   Every page has <nav id="mainNav"></nav> and calls renderNav('home') (or 'cart', 'orders', 'profile')
   in its DOMContentLoaded. The name tells which link gets the white "active" look.
   Needs api.js, common.js and cart-service.js to be loaded first.
   ========================================================================== */

// Switch for the "My Orders" link. The page orders/orders.html always works if you type the address;
// set this to false to hide the link until you want to present the feature.
const SHOW_MY_ORDERS_LINK = true;

function renderNav(activePage) {
    const user = getCurrentUser();
    const activeClass = (page) => page === activePage ? ' class="active"' : '';
    const link = (page, href, label) =>
        `<li><a href="${href}"${activeClass(page)} data-testid="nav-${page}">${label}</a></li>`;

    let html = link('home', '../index_login/home_page.html', 'Home');
    html += `<li><a href="../cart/cart.html" id="cartLink"${activeClass('cart')} data-testid="nav-cart">Cart<span class="cart-badge" id="cartBadge" data-testid="cart-badge" style="display: none;">0</span></a></li>`;

    if (user) {
        if (SHOW_MY_ORDERS_LINK) {
            html += link('orders', '../orders/orders.html', 'My Orders');
        }
        html += link('profile', '../profile/profile.html', 'My Profile');
        html += `<li class="nav-user" id="navUser" data-testid="nav-user">Hi, ${escapeHtml(user.username)}</li>`;
        html += `<li><a href="../index_login/home_page.html" class="logout-btn" id="logoutLink" data-testid="nav-logout">Log Out</a></li>`;
    } else {
        html += '<li class="nav-user"></li>'; // pushes the login links to the right
        html += `<li><a href="${buildLoginUrl()}" id="loginLink" data-testid="nav-login">Log In</a></li>`;
        html += link('signup', '../signup/signup.html', 'Sign Up');
    }

    document.getElementById('mainNav').innerHTML = '<ul>' + html + '</ul>';

    // Log out = forget the user, then the link takes the visitor to the home page as a guest
    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) {
        logoutLink.addEventListener('click', clearCurrentUser);
    }

    updateCartBadge();
}

// Writes the number of pieces into the red badge next to "Cart".
// A guest's count comes from localStorage; a logged in user's from GET /carts/user/{userId} (see getCartCount).
// The badge is not essential, so a failing call just hides it instead of showing an error on every page.
async function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    if (!badge) {
        return;
    }
    try {
        const count = await getCartCount();
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    } catch (error) {
        badge.style.display = 'none';
    }
}
