export interface MerchantLedgerLockResult {
  ledgerEffect: "merchant_escrow_locked";
}

export const lockMerchantEscrow = (): MerchantLedgerLockResult => ({
  ledgerEffect: "merchant_escrow_locked"
});
