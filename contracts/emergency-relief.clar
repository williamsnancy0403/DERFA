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

;; Public functions
(define-public (submit-claim (amount uint) (description (string-utf8 500)) (category (string-utf8 50)))
    (let
        (
            (claim-id (var-get total-claims))
            (new-claim {
                beneficiary: tx-sender,
                amount: amount,
                description: description,
                category: category,
                timestamp: block-height,
                status: "pending",
                yes-votes: u0,
                no-votes: u0,
                total-votes: u0
            })
        )
        (asserts! (> amount u0) ERR-INVALID-AMOUNT)
        (map-set claims claim-id new-claim)
        (var-set total-claims (+ claim-id u1))
        (ok claim-id)
    )
)

(define-public (vote-on-claim (claim-id uint) (vote-type bool))
    (let
        (
            (claim (unwrap! (get-claim claim-id) ERR-CLAIM-NOT-FOUND))
            (voter-status (get-vote claim-id tx-sender))
        )
        (asserts! (is-none voter-status) ERR-ALREADY-VOTED)
        (asserts! (< (- block-height (get timestamp claim)) VOTING_PERIOD) ERR-CLAIM-EXPIRED)

        (map-set votes
            { claim-id: claim-id, voter: tx-sender }
            { voted: true }
        )

        (map-set claims claim-id
            (merge claim {
                yes-votes: (if vote-type (+ (get yes-votes claim) u1) (get yes-votes claim)),
                no-votes: (if vote-type (get no-votes claim) (+ (get no-votes claim) u1)),
                total-votes: (+ (get total-votes claim) u1)
            })
        )
        (ok true)
    )
)

(define-public (finalize-claim (claim-id uint))
    (let
        (
            (claim (unwrap! (get-claim claim-id) ERR-CLAIM-NOT-FOUND))
            (total-votes (get total-votes claim))
            (yes-votes (get yes-votes claim))
            (approval-percentage (/ (* yes-votes u100) total-votes))
        )
        (asserts! (>= total-votes MIN_VOTES_REQUIRED) ERR-NOT-AUTHORIZED)
        (asserts! (>= (- block-height (get timestamp claim)) VOTING_PERIOD) ERR-CLAIM-EXPIRED)

        (if (>= approval-percentage APPROVAL_THRESHOLD)
            (begin
                (try! (as-contract (stx-transfer? (get amount claim)
                                                 (as-contract tx-sender)
                                                 (get beneficiary claim))))
                (map-set claims claim-id
                    (merge claim { status: "approved" }))
                (var-set fund-balance (- (var-get fund-balance) (get amount claim)))
                (ok true)
            )
            (begin
                (map-set claims claim-id
                    (merge claim { status: "rejected" }))
                (ok false)
            )
        )
    )
)

