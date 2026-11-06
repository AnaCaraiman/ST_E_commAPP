/* ==========================================================================
   merge_with_loop.pml  -  the ONE diagram that has a loop: docs/detailed/sequence-guest-cart-merge-at-login.mermaid
   (after login, the browser sends one "add" request for EACH line of the guest cart)

   A "loop" box in the diagram  ->  do ... od   in Promela:
        do
        :: condition -> body        (keep going while the condition holds)
        :: else -> break            (leave the loop)
        od
   ========================================================================== */

mtype = { ADD_LINE, ADDED, REFUSED };

#define LINES 3

/* guest cart: how many pieces of each product the guest wants, and what is in stock */
byte wanted[LINES] = { 1, 1, 6 };
byte stock[LINES]  = { 2, 0, 5 };

chan browserToServer = [0] of { mtype, byte };
chan serverToBrowser = [0] of { mtype };

active proctype Browser() {
    byte i = 0;
    byte problems = 0;
    mtype reply;

    do
    :: i < LINES ->                                  /* loop: one request per guest cart line */
           browserToServer ! ADD_LINE, i;
           serverToBrowser ? reply;
           if
           :: reply == REFUSED -> problems++         /* remember lines that could not be added */
           :: else -> skip
           fi;
           i++
    :: else -> break
    od;

    assert(problems == 2)                            /* lines 1 and 2 do not have enough stock */
}

active proctype Server() {
    byte line;
    byte handled = 0;

    do                                               /* the server also loops: it answers one request at a time */
    :: handled < LINES ->
           browserToServer ? ADD_LINE, line;
           if
           :: wanted[line] <= stock[line] -> serverToBrowser ! ADDED
           :: else -> serverToBrowser ! REFUSED
           fi;
           handled++
    :: else -> break
    od
}
