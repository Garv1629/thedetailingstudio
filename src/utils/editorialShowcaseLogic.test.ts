import test from 'node:test';
import assert from 'node:assert/strict';
import { STUDIO_FAQS, STUDIO_REVIEWS } from '../data/atelierData';
import {
  clampReviewIndex,
  getNextReviewIndex,
  getPrevReviewIndex,
  toggleFaqItem,
} from './editorialShowcaseLogic';

test('review carousel index wraps seamlessly forward and backward', () => {
  assert.equal(getNextReviewIndex(0, 3), 1);
  assert.equal(getNextReviewIndex(2, 3), 0);
  assert.equal(getPrevReviewIndex(0, 3), 2);
  assert.equal(getPrevReviewIndex(2, 3), 1);
  assert.equal(clampReviewIndex(99, 3), 2);
  assert.equal(clampReviewIndex(-4, 3), 0);
});

test('FAQ accordion toggles single active item cleanly and collapses on repeat click', () => {
  assert.equal(toggleFaqItem('faq-01', 'faq-02'), 'faq-02');
  assert.equal(toggleFaqItem('faq-02', 'faq-02'), null);
  assert.equal(toggleFaqItem(null, 'faq-08'), 'faq-08');
});

test('atelierData ships all 8 sequential FAQ items and enriched studio reviews', () => {
  assert.equal(STUDIO_FAQS.length, 8);
  assert.deepEqual(
    STUDIO_FAQS.map((f) => f.number),
    ['01', '02', '03', '04', '05', '06', '07', '08'],
  );
  assert.ok(STUDIO_REVIEWS.length >= 2);
  for (const rev of STUDIO_REVIEWS) {
    assert.ok(rev.headline.length > 5);
    assert.ok(rev.showcaseImage.startsWith('/assets/detailing/'));
  }
});
