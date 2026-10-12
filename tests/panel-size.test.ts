import { describe, it, expect } from 'vitest'
import {
	clampPanelSize,
	parsePanelSize,
	PANEL_MIN_W,
	PANEL_MIN_H,
	PANEL_DEFAULT_W,
	HISTORY_EXTRA_W,
} from '../src/client/panel-size'

// Viewport used for the "typical desktop window" assertions below.
const VW = 1512
const VH = 900

describe('clampPanelSize', () => {
	it('keeps sizes inside [min, viewport-derived max] and rounds to integers', () => {
		expect(clampPanelSize(500, 400, VW, VH)).toEqual({ w: 500, h: 400 })
		expect(clampPanelSize(499.6, 399.4, VW, VH)).toEqual({ w: 500, h: 399 })
	})

	it('raises undersized values to the minimums', () => {
		expect(clampPanelSize(120, 50, VW, VH)).toEqual({ w: PANEL_MIN_W, h: PANEL_MIN_H })
	})

	it('caps width at 90% of the viewport and height at 78vh', () => {
		// Viewport narrow enough that 90% < the 1200px absolute ceiling.
		expect(clampPanelSize(4000, 4000, 1000, 800)).toEqual({ w: 900, h: 624 })
	})

	it('caps width at the absolute 1200px ceiling on very wide viewports', () => {
		expect(clampPanelSize(4000, 400, 3000, VH)).toEqual({ w: 1200, h: 400 })
	})

	it('the drawer stack (default + HISTORY_EXTRA_W) fits the default viewport ceiling', () => {
		// The pre-resize behaviour must survive: opening the history drawer on a
		// factory-sized panel keeps the same width the old fixed CSS gave (640).
		expect(PANEL_DEFAULT_W + HISTORY_EXTRA_W).toBe(640)
		expect(clampPanelSize(PANEL_DEFAULT_W + HISTORY_EXTRA_W, 500, VW, VH).w).toBe(640)
	})
})

describe('parsePanelSize', () => {
	it('parses a valid persisted payload', () => {
		expect(parsePanelSize('{"w":640,"h":520}', VW, VH)).toEqual({ w: 640, h: 520 })
	})

	it('clamps instead of rejecting when the viewport shrank since the save', () => {
		expect(parsePanelSize('{"w":1100,"h":700}', 1000, 800)).toEqual({ w: 900, h: 624 })
	})

	it('rejects null, empty, non-JSON and non-object payloads', () => {
		expect(parsePanelSize(null, VW, VH)).toBeNull()
		expect(parsePanelSize('', VW, VH)).toBeNull()
		expect(parsePanelSize('not json', VW, VH)).toBeNull()
		expect(parsePanelSize('"480x320"', VW, VH)).toBeNull()
		expect(parsePanelSize('[640,520]', VW, VH)).toBeNull()
		expect(parsePanelSize('null', VW, VH)).toBeNull()
	})

	it('rejects missing or non-finite dimensions', () => {
		expect(parsePanelSize('{}', VW, VH)).toBeNull()
		expect(parsePanelSize('{"w":640}', VW, VH)).toBeNull()
		expect(parsePanelSize('{"w":"640","h":520}', VW, VH)).toBeNull()
		expect(parsePanelSize('{"w":NaN,"h":520}', VW, VH)).toBeNull()
		expect(parsePanelSize('{"w":Infinity,"h":520}', VW, VH)).toBeNull()
	})
})
