This repo provides the source and documentation for ION configuration tools.

To get started as a developer you must first have node.js installed.
See: https://nodejs.org/en/download

Once node.js is installed, see DEV_README in the editor/ directory and
see DEV_README in the cli/ directory for more.


NODE IDENTITY: 2-PART AND 3-PART ipn EIDs

RFC 9758 allows an ipn EID to name a node either as "<node>" (2-part) or as
"<allocator>.<node>" (3-part).  Both forms are valid indefinitely; neither is
a transitional step toward the other.  IonConfig supports both, and a node's
identity is never normalized between them -- a node entered as "1000" stays
2-part everywhere it is emitted, and a node entered as "6.1000" stays 3-part.
Leave the allocator empty for a 2-part node.

ION represents either form internally as a Fully Qualified Node Number
(FQNN), a 64-bit value holding the allocator in the high 32 bits and the node
number in the low 32.  ION's getFqn() parses the dotted text and a bare
number to the same value, and prints the allocator only when it is non-zero,
so a 2-part node's generated config is byte-for-byte what it was before
3-part support existed.  IonConfig emits the dotted form, which is what ION
asks for in site-docs/docs/ipn-naming-scheme-transition.md.

A 3-part identity requires ION 4.1.4 or later; 3-part support arrived in
4.1.4-a.2.  The earlier ION versions in the version map (4.0.0 through
4.1.1) have no FQNN concept, so only 2-part identities are meaningful there.


KNOWN ION LIMITATIONS WITH A NON-ZERO ALLOCATOR

Most ION admin programs read a node identity with getFqn() and so accept the
dotted form: ionrc (own node number, contacts and ranges), the ipn: EIDs in
bprc, ltprc "a span", bssprc "a span", and the LTP duct names in bprc.

Two paths do not, because they parse an engine ID with a plain integer
parser instead.  Both affect only protocols that are deprecated or unused,
so neither ION nor IonConfig is going to work around them.  Avoid pairing an
allocator-qualified node with either one; IonConfig does not currently warn
when you do.

  - BSSP duct names.  bsspclo parses its duct name with strtovast(), which
    stops at the "." and silently yields the allocator number instead of the
    engine ID -- a wrong answer rather than an error.  BSSP is deprecated as
    of ION 4.2.1-a.1, where it is disabled by default and scheduled for
    removal in 4.2.1.  Note that BSSP still exists in the ION versions this
    release targets.

  - ltpsecrc authentication rules.  ltpsecadmin parses the engine ID into a
    32-bit int.  "a ltprecvauthrule" and "a ltpxmitauthrule" reject a dotted
    value outright, while the "c" variants use atoi() and truncate it
    silently.  A 64-bit FQNN does not fit that int either, so a non-zero
    allocator cannot be expressed here in any form.  ltpsec is not formally
    deprecated in ION, but it is believed to have no users.

