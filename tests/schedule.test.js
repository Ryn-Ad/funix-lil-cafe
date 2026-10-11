import test from 'node:test'
import assert from 'node:assert/strict'
import { getCornerStatus, describeSchedule } from '../shared/schedule.js'

// 12:00 WIB = 05:00 UTC. 11 Oct 2026 is a Sunday.
const wib = (day, hh, mm = 0) => Date.UTC(2026, 9, day, hh - 7, mm)

test('salad is open Sunday 12:00, closed at 20:00 sharp', () => {
  assert.equal(getCornerStatus('salad', wib(11, 12)).isOpen, true)
  assert.equal(getCornerStatus('salad', wib(11, 19, 59)).isOpen, true)
  assert.equal(getCornerStatus('salad', wib(11, 20)).isOpen, false)
  assert.equal(getCornerStatus('salad', wib(11, 11, 59)).reason, 'outside_hours')
})

test('salad is closed Friday and Saturday', () => {
  assert.equal(getCornerStatus('salad', wib(9, 13)).reason, 'closed_day') // Fri
  assert.equal(getCornerStatus('salad', wib(10, 13)).reason, 'closed_day') // Sat
  assert.equal(getCornerStatus('salad', wib(8, 13)).isOpen, true) // Thu
})

test('coffee is open Monday-Friday 08:00-16:00 only', () => {
  assert.equal(getCornerStatus('coffee', wib(12, 7, 59)).isOpen, false) // Mon
  assert.equal(getCornerStatus('coffee', wib(12, 8)).isOpen, true)
  assert.equal(getCornerStatus('coffee', wib(9, 15, 59)).isOpen, true) // Fri
  assert.equal(getCornerStatus('coffee', wib(9, 16)).isOpen, false)
  assert.equal(getCornerStatus('coffee', wib(11, 10)).reason, 'closed_day') // Sun
})

test('works the same when the server clock is UTC and it is already tomorrow there', () => {
  // Mon 12 Oct 00:30 WIB is still Sun 11 Oct 17:30 on a UTC server
  const mondayJustAfterMidnightWib = Date.UTC(2026, 9, 11, 17, 30)
  assert.equal(getCornerStatus('coffee', mondayJustAfterMidnightWib).reason, 'outside_hours')
})

test("an admin's 'closed' override only lasts that day", () => {
  const closedToday = { date: '2026-10-11', state: 'closed' }
  assert.equal(getCornerStatus('salad', wib(11, 13), closedToday).reason, 'override_closed')
  assert.equal(getCornerStatus('salad', wib(12, 13), closedToday).isOpen, true) // Mon, next day
})

test("an 'open' override waives the day rule but not the hours", () => {
  const openToday = { date: '2026-10-09', state: 'open' } // Friday
  assert.equal(getCornerStatus('salad', wib(9, 13), openToday).isOpen, true)
  assert.equal(getCornerStatus('salad', wib(9, 21), openToday).isOpen, false)
})

test('schedule text reads naturally', () => {
  assert.equal(describeSchedule('salad'), 'Sun–Thu, 12:00–20:00')
  assert.equal(describeSchedule('coffee'), 'Mon–Fri, 08:00–16:00')
})
