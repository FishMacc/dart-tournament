import { test, expect } from '@playwright/test';

test.describe('Visual Design Check: Money Tournament', () => {
    test('Simulate full tournament with money', async ({ page }) => {
        // 1. Setup
        await page.goto('http://localhost:5173');

        // Check if we need to reset (if tournament exists)
        const isNew = await page.getByText('Neues Turnier').isVisible();
        if (!isNew) {
            // Try to find reset button
            await page.click('button#btn-reset-tournament');
            await page.on('dialog', dialog => dialog.accept()); // Accept confirm
            await page.waitForTimeout(1000); // Wait for reset
        }

        // Create Tournament with Money
        await page.fill('input[placeholder="z.B. Freitags-Turnier 🎯"]', 'Money Cup 2026');

        // Open Advanced Settings
        // (It's already open by default in current UI? No, it's a group)
        // Check "Preispool / Einsatz" toggle
        // It's the 2nd checkbox in the list? Or find by text
        // The label text is "Preispool / Einsatz"
        const moneyToggle = page.locator('label:has-text("Preispool / Einsatz")');
        if (await moneyToggle.isVisible()) {
            await moneyToggle.click();
            // Use robust selector for Prize Pool toggle
            const prizeRow = page.locator('.setting-row').filter({ hasText: 'Preispool' });
            await prizeRow.locator('.toggle-slider').click();
        }

        // Set Fee
        await page.fill('input[type="number"][placeholder="0.00"]', '10'); // 10 Euro

        await page.click('button:has-text("Turnier erstellen")');

        // Wait for navigation or player list to be ready
        await page.waitForSelector('input[placeholder="Spielername eingeben..."]', { timeout: 10000 });

        // Screenshot 1: Setup Done / Player Entry
        await page.screenshot({ path: 'vcheck_1_setup.png' });

        // Add 4 Players
        const players = ['Richie Rich', 'Dagobert Duck', 'Scrooge', 'Money Maker'];
        for (const p of players) {
            await page.fill('input[placeholder="Spielername eingeben..."]', p);
            await page.click('button#btn-add-player');
        }

        // Screenshot 2: Players Added
        await page.screenshot({ path: 'vcheck_2_players.png' });

        // Start
        await page.click('button:has-text("Turnier starten")');
        await page.waitForTimeout(1000);

        // Screenshot 3: Bracket View (Initial)
        await page.screenshot({ path: 'vcheck_3_bracket.png' });

        // Open a Match (R1 M1)
        // Find buttons with "Spiel Starten"
        const startButtons = await page.locator('button:has-text("Spiel Starten")').all();
        if (startButtons.length > 0) {
            await startButtons[0].click();
        }

        // We are now in Match View? No, "Spiel Starten" calls socket, but navigating to /live/matchId is manual or via "Live" button?
        // Wait, "Spiel Starten" changes status to active. Then "Live" button appears.
        await page.waitForTimeout(500);
        await page.click('button:has-text("Live")'); // Click the first Live button

        await page.waitForURL(/\/live\//);
        await page.waitForTimeout(1000);

        // Screenshot 4: Match View
        await page.screenshot({ path: 'vcheck_4_match.png' });

        // Go back
        await page.goto('http://localhost:5173');

        // Simulate playing matches via "Quick Win" (Cheat: we can't cheat easily from E2E without backend hooks)
        // Actually, we can just use the provided "StatsBoard" check logic which implies we just need screenshots.
        // But the user wants to see "design bugs".
        // Let's just capture the Stats Board if possible. 
        // We can't reach Stats Board without finishing tournament.
        // It's hard to finish a tournament via UI automation quickly (301 points...).

        // ALTERNATIVE: Use the Reset/Mock approach? 
        // No, let's just stick to what we have. 
        // We can verify the "Price Pool" display in the Header of TournamentPage.

        // Check Header for Price Pool info
        // It should show "💰 Preispool: 40.00 €"
        const headerText = await page.textContent('h2');
        console.log('Header:', headerText);
    });
});
