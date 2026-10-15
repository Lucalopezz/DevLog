import { expect, it } from 'vitest'

it('uses jsdom local storage through both browser and global access', () => {
  expect(localStorage).toBe(jsdom.window.localStorage)
  localStorage.setItem('devlog-test', 'local value')
  expect(window.localStorage.getItem('devlog-test')).toBe('local value')
})

it('uses jsdom session storage through both browser and global access', () => {
  expect(sessionStorage).toBe(jsdom.window.sessionStorage)
  sessionStorage.setItem('devlog-test', 'session value')
  expect(window.sessionStorage.getItem('devlog-test')).toBe('session value')
})
