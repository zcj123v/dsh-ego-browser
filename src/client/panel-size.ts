/**
 * Watch panel resize bounds and persistence helpers.
 *
 * Pure functions only: the floating panel mounts inside the DSH web client,
 * so every rule that decides "is this size acceptable" lives here where the
 * vitest suite can exercise it without a browser.
 */

/** Below this the header button row wraps and the picture gets too small to click. */
export const PANEL_MIN_W = 360
/** Below this the tab strip + one row of picture leave no room to aim. */
export const PANEL_MIN_H = 280
/** Factory default width (matches the pre-resize CSS width). */
export const PANEL_DEFAULT_W = 408
/** History sidebar (224px) plus its padding, added on top of the user width while the drawer is open. */
export const HISTORY_EXTRA_W = 232

export interface PanelSize {
	w: number
	h: number
}

/**
 * Clamp a panel size into [min, viewport-derived max] and round to integers.
 * The height keeps the historical 78vh ceiling; the width never covers the
 * whole viewport (the FAB and the page behind it must stay reachable).
 */
export function clampPanelSize(w: number, h: number, vw: number, vh: number): PanelSize {
	const maxW = Math.min(Math.round(vw * 0.9), 1200)
	const maxH = Math.round(vh * 0.78)
	return {
		w: Math.round(Math.max(PANEL_MIN_W, Math.min(maxW, w))),
		h: Math.round(Math.max(PANEL_MIN_H, Math.min(maxH, h))),
	}
}

/**
 * Parse a persisted `{"w":n,"h":n}` payload. Anything malformed — missing,
 * non-JSON, non-finite numbers — is rejected as null so the panel falls back
 * to the default width and content-driven height. Sizes that merely exceed
 * the *current* viewport are clamped instead of rejected (a window resized
 * between sessions should not silently discard the user's preference).
 */
export function parsePanelSize(raw: string | null, vw: number, vh: number): PanelSize | null {
	if (typeof raw !== 'string' || raw.length === 0) return null
	try {
		const parsed: unknown = JSON.parse(raw)
		if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return null
		const { w, h } = parsed as Record<string, unknown>
		if (typeof w !== 'number' || !Number.isFinite(w)) return null
		if (typeof h !== 'number' || !Number.isFinite(h)) return null
		return clampPanelSize(w, h, vw, vh)
	} catch {
		return null
	}
}
