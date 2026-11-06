/* ==========================================================================
   add_to_cart.pml  -  Promela model of  docs/sequence-add-to-cart.mermaid

   How a sequence diagram becomes Promela:
     lane (User, Web browser, Server)  ->  one process (proctype)
     arrow                             ->  one send  (channel ! message)  and one receive  (channel ? message)
     "alt ... else ..." box            ->  if :: ... :: ... fi      (a CHOICE, not a loop)
     self-arrow on the Server          ->  a plain statement inside the Server process
   There is no loop in this diagram, so there is no do ... od in the model: every process runs top to bottom once.
   ========================================================================== */

mtype = { CLICK_ADD, ADD_REQUEST, CART_UPDATED, NOT_ENOUGH_STOCK, SHOW_ADDED, SHOW_ERROR };

#define STOCK 3                 /* pieces of the product in the warehouse */

/* [0] = rendezvous channel: sender and receiver meet, like an arrow in the diagram */
chan userToBrowser   = [0] of { mtype, byte };
chan browserToServer = [0] of { mtype, byte };
chan serverToBrowser = [0] of { mtype };
chan browserToUser   = [0] of { mtype };

byte inCart = 0;                /* pieces of the product in the cart saved on the server */

active proctype User() {
    byte quantity;
    mtype answer;

    select(quantity : 1 .. 5);                       /* the user may pick any quantity: Spin tries all of them */
    userToBrowser ! CLICK_ADD, quantity;             /* arrow 1: Choose quantity, click "Add to Cart" */

    browserToUser ? answer;                          /* last arrow(s): what the user sees */
    if
    :: answer == SHOW_ADDED -> assert(quantity <= STOCK)    /* "Added" only when there was enough stock */
    :: answer == SHOW_ERROR -> assert(quantity >  STOCK)    /* error only when there was not */
    fi
}

active proctype Browser() {
    byte quantity;
    mtype reply;

    userToBrowser ? CLICK_ADD, quantity;
    browserToServer ! ADD_REQUEST, quantity;         /* arrow 2: Add this product and quantity to the cart */
    serverToBrowser ? reply;                         /* arrow 3 or 4: the server's answer */
    if                                               /* the browser shows the matching message */
    :: reply == CART_UPDATED     -> browserToUser ! SHOW_ADDED
    :: reply == NOT_ENOUGH_STOCK -> browserToUser ! SHOW_ERROR
    fi
}

active proctype Server() {
    byte quantity;

    browserToServer ? ADD_REQUEST, quantity;
    /* self-arrow: check the product exists and there is enough stock  ->  the alt / else box */
    if
    :: (inCart + quantity <= STOCK) ->               /* alt: enough stock */
           inCart = inCart + quantity;               /*      save the cart */
           serverToBrowser ! CART_UPDATED            /*      reply: updated cart */
    :: else ->                                       /* else: not enough stock */
           serverToBrowser ! NOT_ENOUGH_STOCK        /*      reply: error */
    fi
}

/* Property: the cart can never hold more than the stock (checked by Spin on every possible run) */
ltl never_oversell { [] (inCart <= STOCK) }
