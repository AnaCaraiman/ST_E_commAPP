// Cart page. Works for guests (cart in localStorage) and for logged in users (cart in the backend),
// because every call goes through cart-service.js. Only "Place Order" needs a login.
// Every cart call returns the full updated cart, so after each action we simply draw it again.

// The cart that is on the screen; checkout() needs its total for the payment page
let currentCart = null;

// Load the cart and draw it
async function loadCart() {
    try {
        const cart = await getCart();
        renderCart(cart);
    } catch (error) {
        document.getElementById('cartContent').innerHTML =
            `<div class="state-message error" data-testid="cart-error">${escapeHtml(getErrorMessage(error))}</div>`;
    }
}

// Draw the cart (also used with the cart returned by update / remove / clear)
function renderCart(cart) {
    currentCart = cart;
    const content = document.getElementById('cartContent');

    // Keep the red number in the navigation bar in sync without another request
    const badge = document.getElementById('cartBadge');
    badge.textContent = cart.totalItems;
    badge.style.display = cart.totalItems > 0 ? 'inline-block' : 'none';

    if (!cart.items || cart.items.length === 0) {
        content.innerHTML = `
            <div class="empty-cart" data-testid="empty-cart">
                <p>Your cart is empty.</p>
                <a href="../index_login/home_page.html">Browse products</a>
            </div>
        `;
        return;
    }

    const itemsHtml = cart.items.map(item => {
        // A product deleted from the catalog comes back with name = null, price 0, stock 0
        const name = item.name || 'Product no longer available';

        return `
            <div class="cart-item ${item.available ? '' : 'unavailable'}" data-testid="cart-item" data-product-id="${escapeHtml(item.productId)}">
                <img class="cart-item-image" src="${getProductImage(item.name)}" alt="">

                <div>
                    <a class="cart-item-name" href="../product-detail/product-detail.html?id=${encodeURIComponent(item.productId)}">${escapeHtml(name)}</a>
                    <div class="cart-item-unit">${formatPrice(item.price)} each</div>
                    ${item.available ? '' : `<div class="cart-item-warning" data-testid="cart-item-warning">Only ${item.stock} in stock. Lower the quantity or remove it.</div>`}
                </div>

                <div class="quantity-control">
                    <button type="button" class="quantity-btn" data-action="decrease" data-product-id="${escapeHtml(item.productId)}" data-quantity="${item.quantity}" data-testid="cart-decrease">−</button>
                    <input type="number" class="quantity-input" min="0" value="${item.quantity}" data-action="set-quantity" data-product-id="${escapeHtml(item.productId)}" data-testid="cart-quantity">
                    <button type="button" class="quantity-btn" data-action="increase" data-product-id="${escapeHtml(item.productId)}" data-quantity="${item.quantity}" data-testid="cart-increase">+</button>
                </div>

                <div class="cart-item-subtotal" data-testid="cart-item-subtotal">${formatPrice(item.subtotal)}</div>

                <button type="button" class="remove-btn" data-action="remove" data-product-id="${escapeHtml(item.productId)}" data-testid="cart-remove">Remove</button>
            </div>
        `;
    }).join('');

    // A guest is told what happens when pressing the button
    const guestHint = getCurrentUser()
        ? ''
        : '<span class="form-hint" data-testid="guest-hint">You will be asked to log in or sign up first. Your cart is kept.</span>';

    content.innerHTML = `
        <div class="cart-layout">
            <div class="cart-items" data-testid="cart-items">${itemsHtml}</div>

            <div class="cart-summary">
                <h2>Order Summary</h2>
                <div class="summary-row"><span>Items</span><span data-testid="cart-total-items">${cart.totalItems}</span></div>
                <div class="summary-row total"><span>Total</span><span data-testid="cart-total-price">${formatPrice(cart.totalPrice)}</span></div>

                <!-- The button stays enabled even if a line is "unavailable": the backend is the one that answers 409 -->
                <!-- [LEFT OUT #10] delivery address, discount / voucher code (the backend has no fields for them yet) -->
                <button class="apply-button" id="checkoutBtn" data-action="checkout" data-testid="checkout">Place Order</button>
                ${guestHint}
                <button class="clear-cart-btn" data-action="clear" data-testid="clear-cart">Empty Cart</button>
            </div>
        </div>
    `;
}

// One listener for every button / input inside the cart (they are re-created on each render)
function setupCartActions() {
    const content = document.getElementById('cartContent');

    content.addEventListener('click', (event) => {
        const target = event.target.closest('[data-action]');
        if (!target) {
            return;
        }
        const productId = target.dataset.productId;
        const quantity = Number(target.dataset.quantity);

        switch (target.dataset.action) {
            case 'increase':
                changeQuantity(productId, quantity + 1);
                break;
            case 'decrease':
                // quantity 0 is how the backend removes a line
                changeQuantity(productId, quantity - 1);
                break;
            case 'remove':
                removeItem(productId);
                break;
            case 'clear':
                clearCart();
                break;
            case 'checkout':
                checkout();
                break;
        }
    });

    // Typing a quantity in the box and leaving it
    content.addEventListener('change', (event) => {
        if (event.target.dataset.action === 'set-quantity') {
            changeQuantity(event.target.dataset.productId, Number(event.target.value));
        }
    });
}

// Set a new quantity for one line
async function changeQuantity(productId, newQuantity) {
    try {
        // Logged in -> PUT /carts/user/{userId}/items/{productId}  {quantity}   (0 removes, 400 negative, 409 not enough stock)
        const cart = await setItemQuantity(productId, newQuantity);
        renderCart(cart);
    } catch (error) {
        showPopup(getErrorMessage(error), 'error');
        loadCart(); // put the screen back to what is really in the cart
    }
}

// Remove one line
async function removeItem(productId) {
    try {
        // Logged in -> DELETE /carts/user/{userId}/items/{productId}
        const cart = await removeItemFromCart(productId);
        renderCart(cart);
    } catch (error) {
        showPopup(getErrorMessage(error), 'error');
        loadCart();
    }
}

// Remove everything
async function clearCart() {
    try {
        // Logged in -> DELETE /carts/user/{userId}
        const cart = await emptyCart();
        renderCart(cart);
    } catch (error) {
        showPopup(getErrorMessage(error), 'error');
    }
}

// Turn the cart into an order, then go to the payment page
async function checkout() {
    const user = getCurrentUser();

    // The only place where a guest has to log in. The login page brings the visitor back here afterwards.
    if (!user) {
        window.location.href = buildLoginUrl();
        return;
    }

    const checkoutBtn = document.getElementById('checkoutBtn');
    checkoutBtn.disabled = true;

    try {
        // BACKEND CALL: POST /carts/user/{userId}/checkout
        //   201 -> OrderDTO {id, status: "PENDING"}; the stock is decremented and the cart emptied by the backend
        //   400 empty cart   |   409 not enough stock for a line (nothing is changed in that case)
        const order = await apiCheckout(user.id);

        // The order has no total in the backend, so the payment page gets it from here
        setPendingPayment({ orderId: order.id, userId: user.id, total: currentCart.totalPrice, itemCount: currentCart.totalItems });

        showPopup(`Order placed! Your order number is ${order.id}. Taking you to payment...`, 'success');

        // Same pattern as the job portal after applying: give the user time to read, then move on
        setTimeout(() => {
            window.location.href = '../payment/payment.html';
        }, 1500);
    } catch (error) {
        showPopup(getErrorMessage(error), 'error');
        loadCart();
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    renderNav('cart');
    setupPopup();
    showNotice();          // e.g. "Some items could not be added to your cart..." after a login
    setupCartActions();
    loadCart();
});
