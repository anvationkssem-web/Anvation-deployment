import assert from 'node:assert/strict';
import test from 'node:test';
import { extractTransactionIds, ocrContainsTransactionId } from '../src/utils/upiVerification';

// A realistic PhonePe success screen OCR dump. The 12-digit UTR is present in
// the middle of the "UPI transaction ID" line.
const RECEIPT_WITH_MATCHING_UTR = [
  'PhonePe Merchant: KSSEM Anvation 2026 Desk',
  'Amount: INR 500.00',
  'UPI transaction ID 129346921001',
  'Status: Success',
  'Date: 08-Oct-2026 11:42:07',
].join('\n');

// A receipt where the UTR does NOT match the entered reference.
const RECEIUT_WITH_DIFFERENT_UTR = [
  'PhonePe Merchant: KSSEM Anvation 2026 Desk',
  'Amount: INR 500.00',
  'UPI transaction ID 428901239812',
  'Status: Success',
].join('\n');

test('extracts the canonical 12-digit UTR from a PhonePe receipt', () => {
  assert.deepEqual(extractTransactionIds(RECEIPT_WITH_MATCHING_UTR), ['129346921001']);
});

test('OCR match gates registration: entered UTR present on proof => verified', () => {
  assert.equal(ocrContainsTransactionId(RECEIPT_WITH_MATCHING_UTR, '129346921001'), true);
});

test('OCR mismatch blocks registration and allows a screenshot retry', () => {
  // The participant entered 129346921001 but the receipt actually shows
  // 428901239812 — the verification must fail so they can retry.
  assert.equal(ocrContainsTransactionId(RECEIUT_WITH_DIFFERENT_UTR, '129346921001'), false);
});

test('Google Pay transaction IDs are ignored so only the real UTR matches', () => {
  const ocr = [
    'Google transaction ID',
    '304219207040',
    'UPI transaction ID 129346921001',
  ].join('\n');
  assert.equal(ocrContainsTransactionId(ocr, '129346921001'), true);
  assert.equal(ocrContainsTransactionId(ocr, '304219207040'), false);
});