/* ==========================================================================
   check_availability.pml  -  Promela model of  check-availability.mermaid
     lane (User, Products, Stock)  ->  one process
     arrow N (A -> B)              ->  in A: channel ! MESSAGE;     in B: channel ? MESSAGE;
   The comment on each line is the arrow number.
   ========================================================================== */

mtype = { SELECT_PRODUCT, PRODUCT_DETAILS, CHECK_AVAILABILITY, GET_STOCK, STOCK_LEVEL, AVAILABILITY_RESULT };

#define STOCK    5              /* pieces of the product in stock */
#define QUANTITY 2              /* quantity the user asks about */

chan userToProducts  = [0] of { mtype, byte };      /* message, quantity */
chan productsToUser  = [0] of { mtype, byte };      /* message, 1/0 = available yes/no (result) */
chan productsToStock = [0] of { mtype };
chan stockToProducts = [0] of { mtype, byte };      /* message, pieces in stock */

active proctype User() {
    byte available, unused;
    userToProducts ! SELECT_PRODUCT, 0;                         /* 1  select product */
    productsToUser ? PRODUCT_DETAILS, unused;                   /* 2  product details */
    userToProducts ! CHECK_AVAILABILITY, QUANTITY;              /* 3  check availability (quantity) */
    productsToUser ? AVAILABILITY_RESULT, available;            /* 6  available / not enough stock / out of stock */
    assert(available == (STOCK >= QUANTITY))                    /* the answer is the right one */
}

active proctype Products() {
    byte quantity, stock, unused;
    userToProducts ? SELECT_PRODUCT, unused;                    /* 1 */
    productsToUser ! PRODUCT_DETAILS, 0;                        /* 2 */
    userToProducts ? CHECK_AVAILABILITY, quantity;              /* 3 */
    productsToStock ! GET_STOCK;                                /* 4  get stock level */
    stockToProducts ? STOCK_LEVEL, stock;                       /* 5  stock level */
    productsToUser ! AVAILABILITY_RESULT, (stock >= quantity)   /* 6  1 if available, 0 if not */
}

active proctype Stock() {
    productsToStock ? GET_STOCK;                                /* 4 */
    stockToProducts ! STOCK_LEVEL, STOCK                        /* 5 */
}
