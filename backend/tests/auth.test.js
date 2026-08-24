import test from 'node:test'
import assert from 'node:assert/strict'
import { touchStreak } from '../src/services/streakService.js'

test('touchStreak increments a consecutive day streak', () => {
  const profile = { streak: 1, longestStreak: 1, lastActiveDate: '2026-08-23' }
  const streak = touchStreak(profile, new Date('2026-08-24T00:00:00.000Z'))
  assert.equal(streak, 2)
  assert.equal(profile.longestStreak, 2)
})

test('touchStreak resets after a gap', () => {
  const profile = { streak: 5, longestStreak: 6, lastActiveDate: '2026-08-20' }
  const streak = touchStreak(profile, new Date('2026-08-24T00:00:00.000Z'))
  assert.equal(streak, 1)
  assert.equal(profile.longestStreak, 6)
})
