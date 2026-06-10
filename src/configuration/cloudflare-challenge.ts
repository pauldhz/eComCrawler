export async function isChallengeCallback(page: any): Promise<boolean> {
    return page.evaluate(() => 
    document.querySelector(
        '#switchLanguage_subtitle'
    )?.textContent === 'Merci de confirmer que vous n’êtes pas un robot.');
}

export async function clickPositionCallback(
    page: any,
): Promise<{ x: number; y: number } | null> {
    const bb = await page
        .evaluate(() => {
            const div = document.querySelector(
                '.main-wrapper',
            );

            return div?.getBoundingClientRect();
        })
        .catch(() => null);

    if (!bb) return null;

    const randomOffset = (range: number) =>
        Math.round(100 * range * Math.random()) / 100;

    // Mirror Crawlee's current behavior: fixed offset inside the box + small jitter.
    const x = bb.x + 15 + randomOffset(10);
    const y = bb.y + randomOffset(10);

    return { x, y };
}