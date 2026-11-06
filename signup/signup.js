// Sign up page

document.addEventListener('DOMContentLoaded', () => {
    setupPopup();

    // Keep the returnTo (set when a guest was sent here from the cart) so the user comes back after logging in
    document.getElementById('loginLink').href = '../login/login.html' + window.location.search;

    document.getElementById('signupForm').addEventListener('submit', handleSignup);
});

// Handle the sign up form
async function handleSignup(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const signupBtn = document.getElementById('signupBtn');

    hideFormError();

    // Checks done here: the email must contain '@' (validation.js), and the backend does not know about the "confirm" field.
    // Everything else (username length, full email format, password rules, duplicates) is validated by the backend.
    // [LEFT OUT #8] mirror the other backend rules here (live hints while typing, disabled button...)
    if (!hasAtSymbol(email)) {
        showFormError("Please enter a valid email address (it must contain '@').");
        return;
    }

    if (password !== confirmPassword) {
        showFormError('Passwords do not match.');
        return;
    }

    signupBtn.disabled = true;

    try {
        // BACKEND CALL: POST /auth/signup  {username, email, password}
        //   201 -> {id, username, email}   400 -> invalid data (message says which rule)   409 -> username/email taken
        await apiSignup(username, email, password);

        showPopup('Account created! You can log in now.', 'success');

        // Same pattern as the job portal: wait a moment, then move on
        setTimeout(() => {
            window.location.href = '../login/login.html' + window.location.search;
        }, 1500);
    } catch (error) {
        showFormError(getErrorMessage(error));
        signupBtn.disabled = false;
    }
}
