// Login page. Reached from the "Log In" link, or when a guest tries to place an order (?returnTo=cart/cart.html)

document.addEventListener('DOMContentLoaded', () => {
    // Already logged in? Nothing to do here
    if (getCurrentUser()) {
        window.location.href = '../' + getReturnPath();
        return;
    }

    // Keep the returnTo through the signup page and back
    document.getElementById('signupLink').href = '../signup/signup.html' + window.location.search;

    if (new URLSearchParams(window.location.search).get('returnTo')) {
        document.getElementById('authSubtitle').textContent = 'Log in to continue. Your cart will be kept.';
    }

    document.getElementById('loginForm').addEventListener('submit', handleLogin);
});

// Handle the login form
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');

    hideFormError();

    // Front-end check (validation.js): the email must contain an '@'
    if (!hasAtSymbol(email)) {
        showFormError("Please enter a valid email address (it must contain '@').");
        return;
    }

    // [LEFT OUT #8] the other client-side checks (empty password, live hints...). For now an empty password
    // is sent as it is and the backend answers 400 "Username and password are required".

    loginBtn.disabled = true;

    try {
        // BACKEND CALL: POST /auth/login  {username: <email>, password}  ->  200 {id, username, email}  |  401 invalid credentials
        // The backend's login DTO only has a field called "username", but UserService.login() treats any value
        // containing '@' as an EMAIL, so we send the email in that field.
        const user = await apiLogin(email, password);

        // The backend gives no token, so we keep the user object and use user.id in later calls
        setCurrentUser(user);

        // BACKEND CALLS (one per line): POST /carts/user/{userId}/items - moves the guest cart into the user's cart
        const problems = await mergeGuestCart(user.id);

        if (problems.length > 0) {
            // Some items could not be moved (usually not enough stock): show the reasons on the cart page
            setNotice('Some items could not be added to your cart: ' + problems.join(' '));
            window.location.href = '../cart/cart.html';
            return;
        }

        window.location.href = '../' + getReturnPath();
    } catch (error) {
        showFormError(getErrorMessage(error));
        loginBtn.disabled = false;
    }
}
