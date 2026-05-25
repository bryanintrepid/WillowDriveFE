import { test, expect } from '@playwright/test'

// Regression for the time-entry update wire contract.
//
// Background: the backend's `TimeEntry` model uses `EntryId` (serializes as `entryId`).
// The FE previously sent `clockEntryId`, which silently failed to bind -- the API would
// return success=true but the UPDATE ran with `WHERE ClockEntryId = NULL`, affecting 0
// rows. Visible symptom: editing the date in the entries grid didn't persist.
//
// These tests assert the FE sends the right shape, so the bug can't sneak back in.

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

test.describe('Time entries edit -- wire contract', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.evaluate(() => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    })
    await login(page, 'testAdmin')
  })

  // Find the edit button on the first row that has actual time content (skips
  // placeholder rows the page shows for employees with no entry that day).
  // Real rows display an AM/PM marker in the Time In / Time Out cells; placeholder
  // rows show blank time cells.
  async function clickFirstRealEditButton(page) {
    // Wait until the entries grid has rendered at least one row with a displayed time.
    // Polls until either filter has a hit; bails out (skip) if neither appears in time.
    const amRows = page.locator('tbody tr').filter({ hasText: ' AM' })
    const pmRows = page.locator('tbody tr').filter({ hasText: ' PM' })
    const start = Date.now()
    let amCount = 0, pmCount = 0
    while (Date.now() - start < 15_000) {
      amCount = await amRows.count()
      pmCount = await pmRows.count()
      if (amCount + pmCount > 0) break
      await page.waitForTimeout(250)
    }
    if (amCount === 0 && pmCount === 0) {
      test.skip(true, 'No time entries with displayed times in default range; cannot exercise edit flow')
    }
    const realRow = pmCount > 0 ? pmRows.first() : amRows.first()
    await realRow.locator('button[title="Edit"]').click()
  }

  test('updateentry payload uses entryId, not clockEntryId', async ({ page }) => {
    await page.goto('/time/entries')
    await clickFirstRealEditButton(page)

    // Set up the request capture BEFORE clicking save.
    const updateReqPromise = page.waitForRequest(
      (req) => req.url().includes('/api/updateentry') && req.method() === 'POST',
      { timeout: 10_000 }
    )

    // Click the green check (save) button inside the editing row.
    await page.locator('button[title="Save"]').first().click()

    const request = await updateReqPromise
    const payload = request.postDataJSON()

    // The contract: must send `entryId`, must not send `clockEntryId` (which silently no-ops).
    expect(payload, 'payload should be an object').toBeTruthy()
    expect(payload, 'payload must include entryId').toHaveProperty('entryId')
    expect(payload, 'payload must NOT include clockEntryId (silent no-op against backend)').not.toHaveProperty('clockEntryId')
    expect(typeof payload.entryId, 'entryId should be numeric').toBe('number')
    expect(payload.entryId, 'entryId should be > 0 for an existing row').toBeGreaterThan(0)
  })

  test('edit form exposes separate date inputs for time in and time out', async ({ page }) => {
    await page.goto('/time/entries')
    await clickFirstRealEditButton(page)

    // After clicking edit, the editing row exposes two type="date" inputs (in + out).
    const dateInputs = page.locator('tr input[type="date"]')
    await expect(dateInputs).toHaveCount(2)
    const inDate = await dateInputs.nth(0).inputValue()
    const outDate = await dateInputs.nth(1).inputValue()
    expect(inDate, 'time-in date should be populated for a real entry').toMatch(/^\d{4}-\d{2}-\d{2}$/)
    if (outDate) {
      expect(outDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  test('orphan product (not in admin-designated list) appears as a disabled option', async ({ page }) => {
    // Toggle off any InTimeClock flag that the first editable row's product carries.
    // We do this via direct API calls so the test is self-contained and reversible.
    // (Uses the running v2 API at https://localhost:7077.)

    // 1) Login and grab a token for direct API control.
    const tokenRes = await page.request.post('https://localhost:7077/api/login', {
      data: { username: 'testAdmin', password: 'WillowDriveIsMyNursery' },
    })
    const { token } = await tokenRes.json()

    // 2) Pull the current entries for the default range and find a real entry's productId.
    await page.goto('/time/entries')
    await clickFirstRealEditButton(page)

    const inDateInput = page.locator('tr input[type="date"]').nth(0)
    await expect(inDateInput).toBeVisible()
    const productSelect = page.locator('tr select.form-select').nth(1) // 0=Type, 1=Product, 2=Year, 3=Activity
    const currentProductId = await productSelect.inputValue()
    expect(currentProductId, 'editing row should have a selected product').not.toBe('')

    // 3) Cancel the edit, toggle the product OFF (only if currently on), reload page, re-open edit.
    await page.locator('tr button[title="Cancel"]').first().click()

    // Check current InTimeClock state via getproductdata
    const pdRes = await page.request.get('https://localhost:7077/api/getproductdata', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const pd = await pdRes.json()
    const prod = pd.accountProducts.find((p) => String(p.id) === String(currentProductId))
    const wasInTimeClock = !!(prod && prod.inTimeClock)

    if (wasInTimeClock) {
      // Toggle off so it becomes an orphan from the dropdown's perspective.
      await page.request.post('https://localhost:7077/api/toggleproduct', {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: { key: String(currentProductId) },
      })
    }

    try {
      // 4) Reload to pick up new master-list state, open the edit again, inspect the product dropdown.
      await page.goto('/time/entries')
      await clickFirstRealEditButton(page)

      const refreshedSelect = page.locator('tr select.form-select').nth(1)
      const stillSelected = await refreshedSelect.inputValue()
      expect(stillSelected, 'orphan should still appear as the currently selected value').toBe(currentProductId)

      // The orphan option must be present AND disabled.
      const orphanOption = refreshedSelect.locator(`option[value="${currentProductId}"]`)
      await expect(orphanOption).toHaveCount(1)
      const orphanDisabled = await orphanOption.evaluate((el) => el.disabled)
      expect(orphanDisabled, 'orphan option must be disabled (read-only)').toBe(true)

      // The orphan option text should include the read-only hint.
      const orphanText = await orphanOption.innerText()
      expect(orphanText.toLowerCase()).toContain('read-only')
    } finally {
      // 5) Always restore state if we changed it.
      if (wasInTimeClock) {
        await page.request.post('https://localhost:7077/api/toggleproduct', {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          data: { key: String(currentProductId) },
        })
      }
    }
  })

  test('changing the time-in date sends the new date in the payload', async ({ page }) => {
    await page.goto('/time/entries')
    await clickFirstRealEditButton(page)

    // Change the time-in date to one day later -- this should appear in the payload's timeIn.
    const inDateInput = page.locator('tr input[type="date"]').nth(0)
    const currentIso = await inDateInput.inputValue()
    expect(currentIso).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    const next = new Date(currentIso + 'T00:00:00')
    next.setDate(next.getDate() + 1)
    const newIso = next.toISOString().slice(0, 10)
    // The backend serializes as MM-dd-yyyy (matches dateRef format).
    const [yy, mm, dd] = newIso.split('-')
    const newUs = `${mm}-${dd}-${yy}`

    await inDateInput.fill(newIso)

    const updateReqPromise = page.waitForRequest(
      (req) => req.url().includes('/api/updateentry') && req.method() === 'POST',
      { timeout: 10_000 }
    )
    await page.locator('button[title="Save"]').first().click()

    const request = await updateReqPromise
    const payload = request.postDataJSON()

    // timeIn must begin with the new MM-dd-yyyy and have a time component appended.
    expect(payload.timeIn, 'timeIn should start with the chosen date').toMatch(
      new RegExp(`^${newUs}\\s`)
    )
  })
})
