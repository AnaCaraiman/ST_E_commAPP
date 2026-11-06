// Payment page: shown after "Place Order" on the cart page.
// By this point the order already exists in the backend (status PENDING) - checkout created it.
// The card details are checked here in the browser ONLY: they are never sent to the backend and never stored.

// What cart.js saved after checkout: {orderId, userId, total, itemCount}
let pendingPayment = null;

// Show one of the three blocks of the page: 'paymentLayout', 'confirmation' or 'noPayment'
function showSection(id) {
    ['paymentLayout', 'confirmation', 'noPayment'].forEach(name => {
        document.getElementById(name).style.display = name === id ? '' : 'none';
    });
}

// While typing: digits only, with the maximum length of each field (see validation.js)
function setupCardInputs() {
    const cardNumber = document.getElementById('cardNumber');
    const cardExpiry = document.getElementById('cardExpiry');
    const cardCvv = document.getElementById('cardCvv');

    cardNumber.addEventListener('input', () => {
        cardNumber.value = formatCardNumber(cardNumber.value);        // max 16 digits, groups of 4
    });
    cardExpiry.addEventListener('input', () => {
        cardExpiry.value = formatExpiry(cardExpiry.value);            // MM/YY
    });
    cardCvv.addEventListener('input', () => {
        cardCvv.value = keepDigitsOnly(cardCvv.value, CVV_LENGTH);    // max 3 digits
    });
}

// Check the form and confirm the payment
function handlePayment(event) {
    event.preventDefault();
    hideFormError();

    const name = document.getElementById('cardName').value;
    const number = document.getElementById('cardNumber').value;
    const expiry = document.getElementById('cardExpiry').value;
    const cvv = document.getElementById('cardCvv').value;

    if (!isNotBlank(name)) {
        showFormError('Enter the name on the card.');
        return;
    }
    if (!isValidCardNumber(number)) {
        showFormError('The card number must have ' + CARD_NUMBER_LENGTH + ' digits.');
        return;
    }
    if (!isValidExpiry(expiry)) {
        showFormError('Enter a valid expiry date in the future, as MM/YY.');
        return;
    }
    if (!isValidCvv(cvv)) {
        showFormError('The CVV must have ' + CVV_LENGTH + ' digits.');
        return;
    }

    // [LEFT OUT #11] real payment: here the front-end would call a payment provider and then mark the order as paid
    // in the backend (PUT /orders/{id}/status?status=...). Nothing is called now, so the order stays PENDING
    // in "My Orders" even though the customer sees "Order confirmed".

    const lastFour = number.replace(/\s/g, '').slice(-4);

    document.getElementById('confirmationText').textContent =
        `Thank you! Your order ${pendingPayment.orderId} is confirmed. ` +
        `Payment of ${formatPrice(pendingPayment.total)} received with the card ending in ${lastFour}.`;

    clearPendingPayment();
    showSection('confirmation');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    const user = requireLogin();
    if (!user) {
        return;
    }

    renderNav('cart');

    // Hide the "View my orders" button if that feature is switched off (nav.js)
    if (!SHOW_MY_ORDERS_LINK) {
        document.getElementById('ordersLink').style.display = 'none';
    }

    pendingPayment = getPendingPayment();
    if (!pendingPayment || pendingPayment.userId !== user.id) {
        showSection('noPayment');
        return;
    }

    document.getElementById('summaryOrderId').textContent = pendingPayment.orderId;
    document.getElementById('summaryItems').textContent = pendingPayment.itemCount;
    document.getElementById('summaryTotal').textContent = formatPrice(pendingPayment.total);

    setupCardInputs();
    document.getElementById('paymentForm').addEventListener('submit', handlePayment);
    showSection('paymentLayout');
});
