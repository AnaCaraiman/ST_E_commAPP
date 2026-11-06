# Sequence diagrams (same style as the reference diagram)

One diagram per use case: User, Web browser, Server, one straight path, no branching.
Solid arrows go forward, dashed arrows are replies. Error cases are not drawn (see the other versions in `docs/` for those).

## 1) Check product availability
Request: `GET /products/{id}/stock?quantity=N`

```mermaid
sequenceDiagram
    actor User
    participant Browser as Web browser
    participant Server

    User->>Browser: Check availability of a product in a chosen quantity
    activate Browser
    Browser->>Server: Request the stock of the product for that quantity
    activate Server
    Server--)Browser: Return stock level (in stock, quantity available or not)
    deactivate Server
    Browser--)User: Display "available", "not enough stock" or "out of stock"
    deactivate Browser
```

## 2) Add products to the shopping cart
Request: `POST /carts/user/{userId}/items` (a guest's cart is kept in the browser instead)

```mermaid
sequenceDiagram
    actor User
    participant Browser as Web browser
    participant Server

    User->>Browser: Add specific product and quantity to shopping cart
    activate Browser
    Browser->>Server: Update shopping cart with chosen product (stock is checked)
    activate Server
    Server--)Browser: Return updated shopping cart
    deactivate Server
    Browser--)User: Display updated shopping cart (message and cart counter)
    deactivate Browser
```
