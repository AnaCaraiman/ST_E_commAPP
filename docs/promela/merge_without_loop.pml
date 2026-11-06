/* ==========================================================================
   merge_without_loop.pml  -  the same cart merge, drawn WITHOUT a loop.

   Loop-free option: ONE message for the whole guest cart (instead of one per line).
   The sequence diagram then has two arrows: "Add all guest cart lines" and "Result: how many lines were refused".
   Promela: no do ... od, only a straight line of statements (the lines are checked one after another, written out).

   Honest note: the real front-end sends one request per line (the backend has no "add many" endpoint), so this
   is a simplification of the real system, fine for a general-idea diagram. If you want the model to match
   the real code exactly, use merge_with_loop.pml.
   ========================================================================== */

mtype = { ADD_ALL, RESULT };

byte wanted[3] = { 1, 1, 6 };
byte stock[3]  = { 2, 0, 5 };

chan browserToServer = [0] of { mtype };
chan serverToBrowser = [0] of { mtype, byte };         /* RESULT, number of refused lines */

active proctype Browser() {
    byte problems;

    browserToServer ! ADD_ALL;                       /* arrow 1: Add all guest cart lines */
    serverToBrowser ? RESULT, problems;              /* arrow 2: Result (how many lines were refused) */
    assert(problems == 2)
}

active proctype Server() {
    byte refused = 0;

    browserToServer ? ADD_ALL;
    if :: wanted[0] > stock[0] -> refused++ :: else -> skip fi;   /* line 0 */
    if :: wanted[1] > stock[1] -> refused++ :: else -> skip fi;   /* line 1 */
    if :: wanted[2] > stock[2] -> refused++ :: else -> skip fi;   /* line 2 */
    serverToBrowser ! RESULT, refused
}
