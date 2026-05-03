-- Add 'na' (not applicable) to contract_status so bookings that don't
-- require a contract can be marked complete without a paper trail.

alter type contract_status add value if not exists 'na';
