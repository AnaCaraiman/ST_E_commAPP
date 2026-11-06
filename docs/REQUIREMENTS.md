# Requirements - Fake Emag (front-end + Spring Boot backend)

Status: **Met** = works in the code as delivered, **Partial** = works with a limitation (stated), **Not yet** = planned / left out on purpose (see the `[LEFT OUT #n]` markers).
Backend findings come from reading the source (`ST_E_commAPP`), front-end behaviour was exercised in a browser-like test (jsdom) against a mock of the backend API.

## Functional requirements

### Accounts
| ID | Requirement | Status | Where |
|---|---|---|---|
| FR-01 | A visitor can create an account with a username (min 3 chars), an email and a password (min 6 chars with a lowercase letter, an uppercase letter and a digit). The form also asks to repeat the password. | Met | `signup/`, backend `UserService` |
| FR-02 | The sign up and login forms refuse an email that has no "@" before sending anything to the backend. | Met | `validation.js: hasAtSymbol` |
| FR-03 | A customer can log in with an email and a password; a wrong combination shows one generic message. | Met | `login/`, `POST /auth/login` |
| FR-04 | A customer can log out and then keeps browsing as a guest. | Met | `nav.js` |
| FR-05 | The customer's data (username, email, id) can be viewed. | Met | `profile/` |
| FR-06 | A customer can edit the profile, change the password or delete the account. | Not yet (#7, no update endpoint) | - |

### Browsing
| ID | Requirement | Status | Where |
|---|---|---|---|
| FR-07 | Anyone (guest or customer) can browse products without logging in. | Met | `index_login/` |
| FR-08 | Each product shows a picture, name, price, category and stock level. | Met (pictures are front-end placeholders) | `images.js` |
| FR-09 | Products can be filtered by category (the filter runs in the backend). | Met | `GET /products/category/{id}` |
| FR-10 | A product page shows the picture, description, category and stock. | Met | `product-detail/` |
| FR-11 | The customer can check whether the chosen quantity is available before adding it. | Met | `GET /products/{id}/stock` |
| FR-12 | Products can be searched and sorted (name, price). | Not yet (#4) | - |
| FR-13 | A "bestsellers" list is shown. | Not yet (#2, backend ranking looks wrong) | - |

### Cart
| ID | Requirement | Status | Where |
|---|---|---|---|
| FR-14 | Anyone can add a product to the cart without logging in. | Met | `cart-service.js` |
| FR-15 | The system refuses a quantity above the stock, counting what is already in the cart, and tells how many are available. | Met | backend 409, same message for guests |
| FR-16 | The cart can be edited: change a quantity (0 removes the line), remove a line, empty the cart; totals update. | Met | `cart/` |
| FR-17 | A logged in customer's cart is stored by the backend and follows the customer to another browser. | Met | `/carts/user/{id}` |
| FR-18 | A guest's cart is kept in the browser and moved into the customer's cart at login; lines that cannot be moved (stock) are reported. | Met | `mergeGuestCart` |
| FR-19 | A line whose stock dropped below its quantity is flagged in the cart. | Met | `available` flag |

### Ordering and payment
| ID | Requirement | Status | Where |
|---|---|---|---|
| FR-20 | Logging in is required only to place an order: a guest pressing "Place Order" is sent to login and returns to the cart afterwards. | Met | `cart.js`, `?returnTo=` |
| FR-21 | Placing an order creates it in the backend, decrements the stock, empties the cart and shows an "Order placed" message. | Met | `POST /carts/user/{id}/checkout` |
| FR-22 | After placing an order the customer is taken to a payment page showing the order number, item count and total. | Met | `payment/` |
| FR-23 | On the payment page the name on the card is required; the card number accepts digits only and at most 16; the expiry is MM/YY, a real month, not in the past; the CVV is exactly 3 digits. | Met | `validation.js` |
| FR-24 | After a valid payment the customer sees an "Order confirmed" message. | Met (simulated, see FR-26) | `payment.js` |
| FR-25 | The customer can see all their orders (id, status, date), newest first, on a separate "My Orders" page that can be hidden from the menu. | Met | `orders/`, `SHOW_MY_ORDERS_LINK` |
| FR-26 | A confirmed payment changes the order status in the backend. | Not yet (#11) | - |
| FR-27 | The orders list shows what was bought, and a pending order can be cancelled. | Not yet (#3, backend returns no lines) | - |
| FR-28 | Delivery address and discount codes at checkout. | Not yet (#10) | - |

### Support and administration
| ID | Requirement | Status |
|---|---|---|
| FR-29 | A customer can report a problem about an order (support ticket). | Not yet (#1, backend ready) |
| FR-30 | An administrator can add, edit and delete products, categories and images. | Not yet (#6, #9) |

## Non-functional requirements

### Security
| ID | Requirement | Status |
|---|---|---|
| NFR-01 | Passwords are stored hashed and are never returned by the backend. | To verify in `UserEntity` (login uses BCrypt) |
| NFR-02 | Card details are validated in the browser only; they are never sent to the backend, never stored, and the page says it is a demo. | Met |
| NFR-03 | Text coming from the backend (names, descriptions, messages) is escaped before it is shown. | Met |
| NFR-04 | The `returnTo` address after login accepts only the site's own pages (no redirect to other sites). | Met |
| NFR-05 | Every user-specific endpoint requires authentication and checks that the caller owns the data (today anyone can use any user id). | Not met (backend) |
| NFR-06 | Admin endpoints (create/delete products, list all users or orders) are restricted by role. | Not met (backend) |
| NFR-07 | In production all traffic uses HTTPS and the backend allows only the real front-end address (CORS). | Not met (dev ports only) |

### Reliability and data integrity
| ID | Requirement | Status |
|---|---|---|
| NFR-08 | Stock never goes below zero, even when two customers buy the last piece at the same moment. | Not guaranteed (check then update is not atomic) |
| NFR-09 | Stock is checked when adding, when changing a quantity, and again at checkout; a failed checkout changes nothing. | Met |
| NFR-10 | Every backend error has the same JSON shape (`status`, `error`) and a readable message. | Met |
| NFR-11 | When the backend cannot be reached, the pages show a clear message instead of an empty or broken page. | Met |
| NFR-12 | Data survives a backend restart. | Met with a real MongoDB; lost with the embedded one |

### Performance
| ID | Requirement | Status |
|---|---|---|
| NFR-13 | Product list and product page answer in under 500 ms at the 95th percentile with 100 concurrent users. | Unknown, to measure (no pagination) |
| NFR-14 | A page is usable within 2 seconds on a normal connection (no build step, no external libraries, small SVG images). | Likely met |
| NFR-15 | The navigation badge of a guest needs no backend request. | Met |

### Usability and accessibility
| ID | Requirement | Status |
|---|---|---|
| NFR-16 | The path from a product to a confirmed order is: add to cart, place order, log in if needed, pay: at most 5 screens. | Met |
| NFR-17 | The layout works from 360 px wide to desktop (one breakpoint at 800 px). | Partial, to test on devices |
| NFR-18 | Forms have labels, can be used with the keyboard, and errors are shown next to the form. | Partial (no screen reader testing) |
| NFR-19 | The application works in current Chrome, Firefox, Edge and Safari. | Not verified |

### Maintainability and testability
| ID | Requirement | Status |
|---|---|---|
| NFR-20 | Every backend call is made in one file (`api.js`); each concern has its own file (validation, images, cart, navigation, common helpers). | Met |
| NFR-21 | Validation rules are pure functions so they can be unit tested without a page. | Met |
| NFR-22 | Important elements have a stable `id` and `data-testid` for UI tests. | Met |
| NFR-23 | Test data can be recreated with one command (`node tools/seed.js`). | Met |
| NFR-24 | The backend keeps at least 80% line coverage (JaCoCo is configured). | To measure |
| NFR-25 | The backend address is one setting (`API_BASE_URL`), and the allowed front-end origins are an environment variable. | Met |
