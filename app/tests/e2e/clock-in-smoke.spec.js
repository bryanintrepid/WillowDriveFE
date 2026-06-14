import { test, expect } from '@playwright/test'

// Regression for the time-clock fixes in views/time/clock-in.vue:
//   - a rejected punch returns clockEntry === null; the `?.` guard must render the error
//     cleanly instead of throwing (the bug was `response.data.clockEntry.clockEntryId`)
//   - the result (here, the error) holds ~3s before the screen resets, so people can read it
//
// Read-only: an hourly employee (PayPeriod=0) hitting the clock-window check gets "Closed"
// and nothing is written. The success path (biweekly insert) is intentionally NOT here because
// it mutates ClockEntries without a clean teardown.
//
// Data dependency: PIN 3026 = an active hourly (PayPeriod=0) employee, and ClockSettings has the
// window closed at run time. See agent.md > Testing (E2E) for how to find the configured DB/users.

const PASSWORD = 'WillowDriveIsMyNursery'

async function loginKiosk(page) {
  await page.goto('/login')
  await page.fill('#username', 'kiosk')
  await page.fill('#password-input', PASSWORD)
  await Promise.all([
    page.waitForURL(/\/time\/clock-in$/, { timeout: 15_000 }),
    page.click('button[type="submit"]'),
  ])
}

test('hourly rejection renders cleanly (null-guard) and holds ~3s', async ({ page }) => {
  const pageErrors = []
  page.on('pageerror', (e) => pageErrors.push(e.message))

  await loginKiosk(page)
  await page.locator('input[placeholder="PIN"]').fill('3026')
  await expect(page.getByText(/Flores, April/i)).toBeVisible({ timeout: 8_000 })

  await page.getByRole('button', { name: 'Clock In' }).click()

  const err = page.locator('.alert-danger')
  await expect(err).toBeVisible({ timeout: 8_000 })
  await expect(err).toContainText(/closed/i)

  // Still visible well before the 3s reset...
  await page.waitForTimeout(2_000)
  await expect(err).toBeVisible()
  // ...and gone after it.
  await page.waitForTimeout(1_500)
  await expect(err).toHaveCount(0)

  expect(pageErrors, 'no uncaught JS errors (null-deref regression)').toEqual([])
})
