// My Orders page (own file, so it can be shown or hidden with SHOW_MY_ORDERS_LINK in nav.js).
// Needs a login: the orders belong to user.id.

// Load the order history and draw it
async function loadOrders(user) {
    const list = document.getElementById('ordersList');

    try {
        // BACKEND CALL: GET /orders/history/{userId}  ->  [{id, userId, status, createdAt}]
        // productOrders is null in every order (backend limitation), so we can only show id, status and date.
        // [LEFT OUT #3] order details (what was bought) and "Cancel order"  ->  GET /orders/{id}, PUT /orders/{id}/status
        // [LEFT OUT #1] "Report a problem" button on each order  ->  POST /support-tickets
        const orders = await apiGetOrderHistory(user.id);

        if (orders.length === 0) {
            list.innerHTML = `
                <div class="no-orders" data-testid="no-orders">
                    You haven't placed any orders yet. <a href="../index_login/home_page.html">Browse products</a>
                </div>`;
            return;
        }

        // An order that was placed but not paid yet can go back to the payment page
        // (only the most recent checkout is remembered, see setPendingPayment in common.js)
        const pending = getPendingPayment();

        // Newest first
        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        list.innerHTML = orders.map(order => {
            const canPay = pending && pending.orderId === order.id && pending.userId === user.id;

            return `
                <div class="order-item" data-testid="order-item" data-order-id="${escapeHtml(order.id)}">
                    <div>
                        <div class="order-title">Order</div>
                        <div class="order-id">${escapeHtml(order.id)}</div>
                        <span class="status-pill ${escapeHtml(String(order.status || '').toLowerCase())}" data-testid="order-status">${escapeHtml(order.status)}</span>
                        ${canPay ? '<a class="pay-link" href="../payment/payment.html" data-testid="pay-now">Pay now</a>' : ''}
                    </div>
                    <div class="order-date">Placed: ${escapeHtml(formatDate(order.createdAt))}</div>
                </div>
            `;
        }).join('');
    } catch (error) {
        list.innerHTML = `<div class="no-orders" data-testid="orders-error">${escapeHtml(getErrorMessage(error))}</div>`;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    const user = requireLogin();
    if (!user) {
        return;
    }

    renderNav('orders');
    loadOrders(user);
});
