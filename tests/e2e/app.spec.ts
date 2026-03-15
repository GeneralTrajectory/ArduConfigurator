import { expect, test, type Page } from '@playwright/test'

async function connectToVehicle(page: Page, transportMode: 'demo' | 'websocket' = 'demo'): Promise<void> {
  await page.goto('/')

  if (transportMode !== 'demo') {
    await page.getByTestId('transport-mode-select').selectOption(transportMode)
  }

  await page.getByTestId('connect-button').click()
  await expect(page.getByTestId('session-vehicle-name')).toHaveText('ArduCopter')
  await expect(page.getByTestId('session-parameter-summary')).toHaveText('125 params')
}

async function openView(page: Page, viewId: string): Promise<void> {
  await page.getByTestId(`view-button-${viewId}`).click()
}

test.describe('browser configurator regression flows', () => {
  test('bundled websocket demo keeps core configuration surfaces reachable', async ({ page }) => {
    await connectToVehicle(page, 'websocket')

    await expect(page.getByTestId('view-button-setup')).toBeVisible()
    await expect(page.getByTestId('view-button-ports')).toBeVisible()
    await expect(page.getByTestId('view-button-receiver')).toBeVisible()
    await expect(page.getByTestId('view-button-outputs')).toBeVisible()
    await expect(page.getByTestId('view-button-power')).toBeVisible()
    await expect(page.getByTestId('view-button-snapshots')).toBeVisible()
    await expect(page.getByTestId('view-button-tuning')).toBeVisible()
    await expect(page.getByTestId('view-button-presets')).toBeVisible()
    await expect(page.getByTestId('view-button-parameters')).toHaveCount(0)

    await openView(page, 'ports')
    await expect(page.getByRole('heading', { name: 'Ports & Peripherals' })).toBeVisible()
    await expect(page.getByText('Video OSD')).toBeVisible()
    await expect(page.getByText('Video transmitter')).toBeVisible()

    await openView(page, 'receiver')
    await expect(page.getByText('Receiver status')).toBeVisible()
    await expect(page.getByText('Receiver link & signal setup')).toBeVisible()

    await openView(page, 'outputs')
    await expect(page.getByText('Output assignments', { exact: true })).toBeVisible()
    await expect(page.getByText('LED & buzzer notifications', { exact: true })).toBeVisible()

    await openView(page, 'power')
    await expect(page.getByRole('heading', { name: 'Power & Failsafe' })).toBeVisible()
    await expect(page.getByText('Power & failsafe configuration')).toBeVisible()

    await page.getByTestId('product-mode-expert').click()
    await expect(page.getByTestId('view-button-parameters')).toBeVisible()
  })

  test('snapshots and presets round-trip through the bundled websocket demo bridge', async ({ page }) => {
    await connectToVehicle(page, 'websocket')

    await openView(page, 'snapshots')
    await page.getByTestId('snapshot-label-input').fill('E2E baseline')
    await page.getByTestId('snapshot-protected-toggle').check()
    await page.getByTestId('capture-live-snapshot-button').click()

    await expect(page.getByText('Saved snapshot "E2E baseline" with 125 parameters.')).toBeVisible()
    await expect(page.getByTestId('active-baseline-label')).toHaveText('E2E baseline')

    await openView(page, 'presets')
    await page.getByTestId('preset-card-flight-feel-soft').click()
    await page.getByTestId('preset-apply-ack').check()
    await page.getByTestId('apply-preset-button').click()

    await expect(page.getByText(/Applied preset "Smooth Explorer" with 4 verified write\(s\)\./)).toBeVisible()

    await openView(page, 'snapshots')
    await expect(page.getByText('ArduCopter pre-preset Smooth Explorer')).toBeVisible()
    await expect(page.getByText('restore available')).toBeVisible()

    await page.getByTestId('snapshot-restore-ack').check()
    await page.getByTestId('apply-snapshot-restore-button').click()

    await expect(page.getByText('already matched')).toBeVisible()
    await expect(page.getByTestId('active-baseline-label')).toHaveText('E2E baseline')
  })

  test('websocket transport connects through the bundled demo bridge', async ({ page }) => {
    await connectToVehicle(page, 'websocket')

    await expect(page.getByText('WebSocket (ws://127.0.0.1:14550)')).toBeVisible()
    await openView(page, 'ports')
    await expect(page.getByRole('heading', { name: 'Ports & Peripherals' })).toBeVisible()
  })
})
