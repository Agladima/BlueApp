import test from 'node:test'
import assert from 'node:assert/strict'
import { recordAnswer } from '../src/services/masteryService.js'

test('recordAnswer uses 1 day on incorrect answers', () => {
  const progressMap = {}
  const progress = recordAnswer(progressMap, 'AA', false, new Date('2026-08-24T00:00:00.000Z'))
  assert.equal(progress.correct, 0)
  assert.equal(progress.wrong, 1)
  assert.equal(new Date(progress.nextReview).toISOString(), '2026-08-25T00:00:00.000Z')
})

test('recordAnswer uses mastery thresholds for review spacing', () => {
  const progressMap = { AA: { correct: 6, wrong: 1, lastAnswered: null, nextReview: null } }
  const progress = recordAnswer(progressMap, 'AA', true, new Date('2026-08-24T00:00:00.000Z'))
  assert.equal(progress.correct, 7)
  assert.equal(progress.wrong, 1)
  assert.equal(new Date(progress.nextReview).toISOString(), '2026-08-31T00:00:00.000Z')
})
