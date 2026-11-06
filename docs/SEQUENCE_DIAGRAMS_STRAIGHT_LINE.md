# Straight-line versions (no `alt` box)

The same two use cases, with no branching. Each use case is split into two diagrams: the normal flow and the problem flow.
Each diagram is correct for its own scenario and reads top to bottom. Use these instead of the `alt` versions if you prefer.

Trade-off: one diagram no longer shows both outcomes, so keep the pair together (a test for the error case should point at the "problem" diagram).

## 1) Check product availability

### 1a) The server answers
```mermaid
sequenceDiagram
    actor User
    participant Browser as Web browser
    participant Server

    User->>Browser: Choose quantity, click "Check availability"
    activate Browser
    Browser->>Server: Ask if this quantity of the product is available
    activate Server
    Server->>Server: Look up the product's stock
    Server-->>Browser: Stock level, in stock yes/no, available yes/no
    deactivate Server
    Browser-->>User: Show "available", "not enough stock" or "out of stock"
    deactivate Browser
```

### 1b) Invalid request (product not found, or quantity below 1)
```mermaid
sequenceDiagram
    actor User
    participant Browser as Web browser
    participant Server

    User->>Browser: Choose quantity (below 1), click "Check availability"
    activate Browser
    Browser->>Server: Ask if this quantity of the product is available
    activate Server
    Server->>Server: Look up the product (not found, or quantity below 1)
    Server-->>Browser: Error message
    deactivate Server
    Browser-->>User: Show the error message
    deactivate Browser
```

## 2) Add products to the shopping cart

### 2a) Enough stock
```mermaid
sequenceDiagram
    actor User
    participant Browser as Web browser
    participant Server

    User->>Browser: Choose quantity, click "Add to Cart"
    activate Browser
    Browser->>Server: Add this product and quantity to the cart
    activate Server
    Server->>Server: Check the product exists and there is enough stock
    Server->>Server: Save the cart
    Server-->>Browser: Updated cart
    deactivate Server
    Browser-->>User: Show "Added to your cart", update the cart counter
    deactivate Browser
```

### 2b) Not enough stock
```mermaid
sequenceDiagram
    actor User
    participant Browser as Web browser
    participant Server

    User->>Browser: Choose quantity, click "Add to Cart"
    activate Browser
    Browser->>Server: Add this product and quantity to the cart
    activate Server
    Server->>Server: Check the product exists and there is enough stock (not enough)
    Server-->>Browser: Error: not enough stock (and how many are left)
    deactivate Server
    Browser-->>User: Show the error message
    deactivate Browser
```
