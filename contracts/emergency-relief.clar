;; emergency-relief-dao.clar
;; Implements the core DAO functionality for emergency relief fund management

;; Constants
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-INVALID-AMOUNT (err u101))
(define-constant ERR-CLAIM-NOT-FOUND (err u102))
(define-constant ERR-ALREADY-VOTED (err u103))
(define-constant ERR-CLAIM-EXPIRED (err u104))
(define-constant VOTING_PERIOD u144) ;; ~24 hours in blocks
(define-constant MIN_VOTES_REQUIRED u3)
(define-constant APPROVAL_THRESHOLD u75) ;; 75% approval needed

;; Data vars
(define-data-var fund-balance uint u0)
(define-data-var total-claims uint u0)
(define-data-var dao-owner principal tx-sender)

;; Data maps
(define-map claims
    uint ;; claim-id
    {
        beneficiary: principal,
        amount: uint,
        description: (string-utf8 500),
        category: (string-utf8 50),
        timestamp: uint,
        status: (string-utf8 20),
        yes-votes: uint,
        no-votes: uint,
        total-votes: uint
    }
)

(define-map votes
    { claim-id: uint, voter: principal }
    { voted: bool }
)

;; Read-only functions
(define-read-only (get-claim (claim-id uint))
    (map-get? claims claim-id)
)

(define-read-only (get-vote (claim-id uint) (voter principal))
    (map-get? votes { claim-id: claim-id, voter: voter })
)

(define-read-only (get-fund-balance)
    (var-get fund-balance)
)
