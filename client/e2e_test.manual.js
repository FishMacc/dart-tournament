import { test, expect } from '@playwright/test';

test('E2E Crash Test', async ({ page }) => {
    // 1. Create tournament
    console.log('Navigating to home...');
    await page.goto('http://localhost:5173');
    console.log('Selecting options...');
    await page.locator('#select-game-type').selectOption('501');
    await page.locator('#select-legs').selectOption('1');

    // Check if tournament is already created (if server state persisted)
    // If #btn-create-tournament is visible, click it.
    // If not, maybe we are already in setup mode with players?
    // Or active?
    // But local dev server usually restarts fresh or keeps memory?
    // "server.js" uses `let currentTournament = null;`.
    // So on server restart (which I might not have triggered properly?), it clears.
    // But `npm run dev` (client) + `npm start` (server).
    // The server process ID changed in Step 109.
    // So it should be clean.

    console.log('Creating tournament...');
    await page.locator('#btn-create-tournament').click();

    console.log('Adding players...');

    // Add Player 1
    await page.locator('#input-player-name').fill('AutoP1');
    await page.locator('#btn-add-player').click();

    // Add Player 2
    await page.locator('#input-player-name').fill('AutoP2');
    await page.locator('#btn-add-player').click();

    // Start Tournament
    await page.locator('#btn-start-tournament').click();


    // 2. Start Match
    await page.waitForTimeout(1000);
    // Click "Start" on the first match (Waiting)
    await page.locator('.match-card .btn-primary').first().click();

    // 3. Get Match ID from URL
    const matchUrl = page.url();
    const matchId = matchUrl.split('/').pop();
    console.log('Match ID:', matchId);

    // 4. Get PIN from Host View (Wait for modal/text to appear)
    // In active match card
    const pinElement = page.locator('.active-match-pin .pin-value').first();
    const pinText = await pinElement.innerText();
    console.log('PIN found:', pinText);

    // 5. Navigate to Mobile Scoring
    const mobileUrl = `http://localhost:5173/mobile/match/${matchId}`;
    await page.goto(mobileUrl);

    // 6. Enter PIN
    await page.getByPlaceholder('● ● ● ●').fill(pinText);
    await page.getByRole('button', { name: 'Bestätigen' }).click();

    // 7. Check for Crash or Success
    // Wait for either ErrorBoundary text OR Player Name
    try {
        await Promise.race([
            page.waitForSelector('text=Ein Fehler ist aufgetreten', { timeout: 5000 }),
            page.waitForSelector('text=AutoP1', { timeout: 5000 })
        ]);
    } catch (e) {
        // Timeout
    }

    const crashText = await page.getByText('Ein Fehler ist aufgetreten').isVisible();
    if (crashText) {
        // Screenshot on crash
        await page.screenshot({ path: 'crash-screenshot.png' });
        console.error('CRASH DETECTED! Saved screenshot to crash-screenshot.png');

        // Log the error message
        const errorDetails = await page.locator('pre').innerText();
        console.error('Error Details:', errorDetails);
        throw new Error('App Crashed on PIN Entry: ' + errorDetails);
    }

    expect(await page.getByText('AutoP1').isVisible()).toBeTruthy();
    console.log('SUCCESS: Entered scoring view without crash.');

    // 8. Test Scoring
    console.log('Throwing darts...');
    // Default multiplier is Single. Click 20.
    // ScorePad buttons usually have text "20".
    // Check ScorePad.jsx: <button className="number-btn">{number}</button>
    // So getByRole('button', { name: '20' })
    await page.getByRole('button', { name: '20', exact: true }).click();

    // Check update
    // .current-throw-value should show S20 (20)
    await expect(page.locator('.current-throw-value')).toContainText('S20');
    console.log('SUCCESS: Threw S20 (Score updated)');

    // Test Undo
    console.log('Testing Undo...');
    // Click Undo button (↩)
    await page.getByRole('button', { name: '↩' }).click();

    // Confirm dialog handling
    page.on('dialog', dialog => dialog.accept());

    // Check if score reverted (or current throw cleared)
    // Actually, onUndo triggers a socket emit.
    // The UI should update.
    // "Letzter Wurf" might disappear or change to "Player X ist dran".
    await expect(page.locator('.current-throw-label')).toContainText('ist dran');
    console.log('SUCCESS: Undo worked');
});
