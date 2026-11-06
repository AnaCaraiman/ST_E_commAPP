# Sequence diagrams with the API call shown

Same style as the reference diagram, with the technical detail added: how the request is sent and where the data is read and saved.
Error cases are not drawn.

## How the request is made

* The page's JavaScript calls a function in `js/api.js` (for example `apiAddToCart`), which uses the browser's `fetch()` to send an **HTTP request**
  to the backend REST API at `http://localhost:8080`.
* The request carries the data as **JSON** in the body (POST/PUT) or in the address (GET): this is the "API call".
* The backend (Spring Boot: controller -> service -> repository) reads/saves data in **MongoDB** and answers with **JSON** and an HTTP status (200 OK, ...).
* The server does **not** send a page back. The browser's JavaScript reads the JSON and updates the screen itself (no page reload).
* There is no login token: the logged-in user's id is part of the address (`/carts/user/USERID/...`).

## 1) Check product availability
```mermaid
sequenceDiagram
    actor User
    participant Browser as Web browser (JavaScript)
    participant Server as Server (Spring Boot REST API)
    participant DB as Database (MongoDB)

    User->>Browser: Choose quantity, click "Check availability"
    activate Browser
    Browser->>Server: API call: GET /products/ID/stock?quantity=N
    activate Server
    Server->>DB: Read the product
    DB--)Server: Product (with stock)
    Server->>Server: Compare the stock with the requested quantity
    Server--)Browser: 200 OK (JSON: stock, inStock, requestedQuantity, available)
    deactivate Server
    Browser--)User: Display "available", "not enough stock" or "out of stock" (no page reload)
    deactivate Browser

    Note over Server,DB: Read only: nothing is reserved or changed
```

## 2) Add products to the shopping cart
```mermaid
sequenceDiagram
    actor User
    participant Browser as Web browser (JavaScript)
    participant Server as Server (Spring Boot REST API)
    participant DB as Database (MongoDB)

    User->>Browser: Choose quantity, click "Add to Cart"
    activate Browser
    Browser->>Server: API call: POST /carts/user/USERID/items (JSON: productId, quantity)
    activate Server
    Server->>DB: Check the user, read the product and the user's cart
    DB--)Server: User, product (with stock) and cart
    Server->>Server: Check there is enough stock, add the quantity to the cart
    Server->>DB: Save the cart
    DB--)Server: Saved
    Server--)Browser: 200 OK (JSON: updated cart with items, totalItems, totalPrice)
    deactivate Server
    Browser--)User: Show "Added to your cart" and update the cart counter (no page reload)
    deactivate Browser

    Note over Browser,Server: The counter is then refreshed with a small second call: GET /carts/user/USERID
    Note over Browser: A guest (not logged in) has no server cart: the item is saved in the browser (localStorage) after a stock check with GET /products/ID
```
