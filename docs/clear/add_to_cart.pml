/* ==========================================================================
   add_to_cart.pml  -  Promela model of  add-to-cart.mermaid
     lane (User, Products, Cart)  ->  one process
     arrow N (A -> B)             ->  in A: channel ! MESSAGE;     in B: channel ? MESSAGE;
   The comment on each line is the arrow number. Stock is not checked here (separate use case).
   ========================================================================== */

mtype = { SELECT_PRODUCT, PRODUCT_DETAILS, ADD_PRODUCT, FIND_PRODUCT, PRODUCT_FOUND, UPDATED_CART };

#define QUANTITY 2              /* pieces the user adds */

chan userToProducts = [0] of { mtype };
chan productsToUser = [0] of { mtype };
chan userToCart     = [0] of { mtype, byte };       /* message, quantity */
chan cartToUser     = [0] of { mtype, byte };       /* message, pieces now in the cart */
chan cartToProducts = [0] of { mtype };
chan productsToCart = [0] of { mtype };

active proctype User() {
    byte inCart;
    userToProducts ! SELECT_PRODUCT;                /* 1  select product */
    productsToUser ? PRODUCT_DETAILS;               /* 2  product details */
    userToCart ! ADD_PRODUCT, QUANTITY;             /* 3  add product (quantity) */
    cartToUser ? UPDATED_CART, inCart;              /* 6  updated cart */
    assert(inCart == QUANTITY)                      /* the cart holds what was added (it was empty before) */
}

active proctype Products() {
    userToProducts ? SELECT_PRODUCT;                /* 1 */
    productsToUser ! PRODUCT_DETAILS;               /* 2 */
    cartToProducts ? FIND_PRODUCT;                  /* 4  find product */
    productsToCart ! PRODUCT_FOUND                  /* 5  product found */
}

active proctype Cart() {
    byte items = 0, quantity;                       /* the cart starts empty */
    userToCart ? ADD_PRODUCT, quantity;             /* 3 */
    cartToProducts ! FIND_PRODUCT;                  /* 4 */
    productsToCart ? PRODUCT_FOUND;                 /* 5 */
    items = items + quantity;                       /* the product is added to the cart */
    cartToUser ! UPDATED_CART, items                /* 6 */
}
