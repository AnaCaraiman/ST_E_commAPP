/* ==========================================================================
   validation.js  -  checks and input formatting for the forms (pure functions, no page access)
   Because they only take a value and return a value, they are the easiest thing in the project to unit test.
   The BACKEND still validates signup/login on its own (UserService.java); these checks only
   give the user a faster answer. Payment is front-end only (see payment.js).
   ========================================================================== */

const CARD_NUMBER_LENGTH = 16;
const CVV_LENGTH = 3;


/* ---------- EMAIL ---------- */

// The only email rule asked for in the front-end: it must contain an '@'
// (the backend checks the full pattern name@domain.ext and answers 400 otherwise)
function hasAtSymbol(email) {
    return typeof email === 'string' && email.includes('@');
}


/* ---------- GENERAL ---------- */

function isNotBlank(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

// "12a-3 4" -> "1234", cut to maxLength digits (no cut when maxLength is not given)
function keepDigitsOnly(value, maxLength) {
    return String(value || '').replace(/\D/g, '').slice(0, maxLength);
}


/* ---------- CARD (payment page) ---------- */

// Typing helper: digits only, at most 16, shown in groups of 4 ("4111 1111 1111 1111")
function formatCardNumber(value) {
    return keepDigitsOnly(value, CARD_NUMBER_LENGTH).replace(/(\d{4})(?=\d)/g, '$1 ');
}

// Typing helper: digits only, "MM/YY"
function formatExpiry(value) {
    const digits = keepDigitsOnly(value, 4);
    return digits.length > 2 ? digits.slice(0, 2) + '/' + digits.slice(2) : digits;
}

// Exactly 16 digits (spaces are ignored). No Luhn check, so demo numbers like 1111 1111 1111 1111 work.
function isValidCardNumber(value) {
    return /^\d{16}$/.test(String(value || '').replace(/\s/g, ''));
}

// "MM/YY", month 01-12, and the card must not be expired (valid until the end of that month)
function isValidExpiry(value, now) {
    const match = /^(\d{2})\/(\d{2})$/.exec(String(value || ''));
    if (!match) {
        return false;
    }
    const month = Number(match[1]);
    const year = 2000 + Number(match[2]);
    if (month < 1 || month > 12) {
        return false;
    }
    return new Date(year, month, 1) > (now || new Date());
}

function isValidCvv(value) {
    return /^\d{3}$/.test(String(value || ''));
}
