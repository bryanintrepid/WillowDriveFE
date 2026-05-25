import { test, expect } from '@playwright/test'

// E2E tests for kiosk-mode FE lockdown.
//
// The guard in router/index.js + the post-login redirect in Login.vue both rely on
// utils/auth.js#isKioskUser(user). A user whose only role is "Kiosk" gets pinned to
// the clock-in view. Any other user (incl. those with Kiosk plus other roles) is
// treated normally.
//
// Prereqs:
//   - v2 API at https://localhost:7077
//   - DB has `kiosk` user (roles=[Kiosk]) and `testAdmin` user (broad roles)
//     Both passwords = WillowDriveIsMyNursery

const PASSWORD = 'WillowDriveIsMyNursery'

async function login(page, username) {
  await page.goto('/login')
  await page.fill('#username', username)
  await page.fill('#password-input', PASSWORD)
  await Promise.all([
    page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 15_000 }),
    page.click('button[type="submit"]'),
  ])
}

test.describe('Kiosk lockdown', () => {
  test.beforeEach(async ({ page }) => {
    // Start with a clean storage so the auth guard sees no prior session.
    await page.goto('/login')
    await page.evaluate(() => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    })
  })

  test('unauthenticated user is redirected to /login when hitting a protected route', async ({ page }) => {
    await page.goto('/employees')
    await expect(page).toHaveURL(/\/login/)
  })

  test('kiosk user lands on the clock-in view after login', async ({ page }) => {
    await login(page, 'kiosk')
    await expect(page).toHaveURL(/\/time\/clock-in$/)
  })

  test.describe('after kiosk login', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, 'kiosk')
    })

    test('navigating to /employees bounces back to /kiosk', async ({ page }) => {
      await page.goto('/employees')
      await expect(page).toHaveURL(/\/(kiosk|time\/clock-in)$/)
    })

    test('navigating to /payroll/view bounces back to /kiosk', async ({ page }) => {
      await page.goto('/payroll/view')
      await expect(page).toHaveURL(/\/(kiosk|time\/clock-in)$/)
    })

    test('navigating to /time/admin bounces back to /kiosk', async ({ page }) => {
      await page.goto('/time/admin')
      await expect(page).toHaveURL(/\/(kiosk|time\/clock-in)$/)
    })

    test('navigating to /time/entries bounces back to /kiosk', async ({ page }) => {
      await page.goto('/time/entries')
      await expect(page).toHaveURL(/\/(kiosk|time\/clock-in)$/)
    })

    test('/kiosk alias resolves without bouncing', async ({ page }) => {
      await page.goto('/kiosk')
      await expect(page).toHaveURL(/\/kiosk$/)
    })

    test('/time/clock-in resolves without bouncing', async ({ page }) => {
      await page.goto('/time/clock-in')
      await expect(page).toHaveURL(/\/time\/clock-in$/)
    })

    test('visiting /login while authenticated as kiosk redirects to clock-in', async ({ page }) => {
      await page.goto('/login')
      await expect(page).toHaveURL(/\/time\/clock-in$/)
    })

    test('localStorage carries a single-role Kiosk user', async ({ page }) => {
      const user = await page.evaluate(() => JSON.parse(localStorage.getItem('user') || 'null'))
      expect(user).not.toBeNull()
      expect(user.roles).toEqual(['Kiosk'])
    })
  })

  test.describe('after admin login', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, 'testAdmin')
    })

    test('admin can navigate to /employees', async ({ page }) => {
      await page.goto('/employees')
      await expect(page).toHaveURL(/\/employees$/)
    })

    test('admin can navigate to /payroll/view', async ({ page }) => {
      await page.goto('/payroll/view')
      await expect(page).toHaveURL(/\/payroll\/view$/)
    })

    test('admin can navigate to /time/admin', async ({ page }) => {
      await page.goto('/time/admin')
      await expect(page).toHaveURL(/\/time\/admin$/)
    })

    test('admin localStorage has multiple roles (no Kiosk lockdown)', async ({ page }) => {
      const user = await page.evaluate(() => JSON.parse(localStorage.getItem('user') || 'null'))
      expect(user).not.toBeNull()
      expect(user.roles.length).toBeGreaterThan(1)
      expect(user.roles).toContain('Admin')
    })
  })
})
