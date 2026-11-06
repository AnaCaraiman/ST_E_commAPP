/* ==========================================================================
   check_availability.pml  -  Promela model of  docs/sequence-check-availability.mermaid
   Same translation rules as add_to_cart.pml. The "alt / else" box is an if ... fi (a choice), there is no loop.
   ========================================================================== */

mtype = { CLICK_CHECK, STOCK_QUERY, STOCK_ANSWER, STOCK_ERROR,
          SHOW_AVAILABLE, SHOW_NOT_ENOUGH, SHOW_OUT_OF_STOCK, SHOW_ERROR };

chan userToBrowser   = [0] of { mtype, byte };
chan browserToServer = [0] of { mtype, byte };
chan serverToBrowser = [0] of { mtype, bool, bool };    /* kind, inStock, available */
chan browserToUser   = [0] of { mtype };

byte stock;                     /* what the warehouse has: chosen by Spin in init (0..5) */
bool productExists;             /* chosen by Spin in init */

proctype User() {
    byte quantity;
    mtype answer;

    select(quantity : 0 .. 5);                       /* 0 = the invalid quantity case */
    userToBrowser ! CLICK_CHECK, quantity;           /* arrow 1: Choose quantity, click "Check availability" */

    browserToUser ? answer;                          /* the message the user sees must match the real situation */
    if
    :: answer == SHOW_ERROR         -> assert(!productExists || quantity < 1)
    :: answer == SHOW_AVAILABLE     -> assert(productExists && quantity >= 1 && stock >= quantity)
    :: answer == SHOW_NOT_ENOUGH    -> assert(productExists && quantity >= 1 && stock > 0 && stock < quantity)
    :: answer == SHOW_OUT_OF_STOCK  -> assert(productExists && quantity >= 1 && stock == 0)
    fi
}

proctype Browser() {
    byte quantity;
    mtype kind;
    bool inStock, available;

    userToBrowser ? CLICK_CHECK, quantity;
    browserToServer ! STOCK_QUERY, quantity;         /* arrow 2: Ask if this quantity of the product is available */
    serverToBrowser ? kind, inStock, available;      /* arrow 3 or 4: the answer */
    if                                               /* what the page prints (product-detail.js) */
    :: kind == STOCK_ERROR                              -> browserToUser ! SHOW_ERROR
    :: kind == STOCK_ANSWER && !inStock                 -> browserToUser ! SHOW_OUT_OF_STOCK
    :: kind == STOCK_ANSWER && inStock && available     -> browserToUser ! SHOW_AVAILABLE
    :: kind == STOCK_ANSWER && inStock && !available    -> browserToUser ! SHOW_NOT_ENOUGH
    fi
}

proctype Server() {
    byte quantity;

    browserToServer ? STOCK_QUERY, quantity;
    /* self-arrow: look up the product's stock  ->  the alt / else box */
    if
    :: (!productExists || quantity < 1) ->           /* else branch: product not found or quantity below 1 */
           serverToBrowser ! STOCK_ERROR, false, false
    :: else ->                                       /* alt branch: product exists and quantity is valid */
           serverToBrowser ! STOCK_ANSWER, (stock > 0), (stock >= quantity)
    fi
}

init {
    select(stock : 0 .. 5);
    if
    :: productExists = true
    :: productExists = false
    fi;
    run User(); run Browser(); run Server()
}
