import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/client/index.ts", import.meta.url), "utf8");

describe("watch panel input and capture status", () => {
  it("provides a local keyboard proxy for the sidebar watch view", () => {
    expect(source).toMatch(/function createKeyboardProxy\(send\)/);
    expect(source).toMatch(/compositionend/);
    expect(source).toMatch(/send\([^,]+, 'insertText'/);
    // Floating FAB/overlay was removed in 0.9.3; only the sidebar tab remains.
    expect((source.match(/keyboardProxy\.focusAt\(e,/g) || []).length).toBe(1);
  });

  it("uses the canonical browser-window glyph for the panel header and sidebar entry", () => {
    expect(source).toMatch(/const ICON_AGENT_BROWSER = `<svg width="16" height="16" viewBox="0 0 16 16"/);
    expect(source).toMatch(/__html: ICON_AGENT_BROWSER/);
    expect(source).not.toMatch(/ICON_GLOBE/);
    // String form (panel header) + React EgoWatchIcon (sidebar) share geometry.
    expect((source.match(/M1\.4 5\.9h13\.2/g) || []).length).toBe(2);
    expect((source.match(/M8\.2 7\.0L12\.6 10\.6/g) || []).length).toBe(2);
  });

  it("does not gate control input on stream state or default missing status to CDP", () => {
    expect(source).not.toMatch(/status\.backend \|\| 'cdp'/);
    expect(source).not.toMatch(/targetValid[^\n]+streamState !== 'streaming'/);
  });

  // 幽灵拖拽回归（fork 0.8.6-fix3 的同一条缺陷，载体换成上游侧栏 stage 手柄）：
  // stage 手柄的 pointerup 可能丢失（指针在窗口外释放、指针捕获被宿主 web 层吃掉），
  // 只靠 pointerup/pointercancel 复位会残留拖拽状态，之后裸 hover 的 pointermove
  // 仍被当作拖拽继续发 /api/ego/window-size，窗口自己不停变大/变小。
  it("ends a stage resize when the pointer buttons are released instead of resizing on bare hover", () => {
    const begin = source.slice(source.indexOf("var beginResize = function (axis)"));
    expect(begin.length).toBeGreaterThan(0);

    const onMoveStart = begin.indexOf("var onMove = function (ev)");
    const onUpStart = begin.indexOf("var onUp = function ()");
    expect(onMoveStart).toBeGreaterThan(-1);
    expect(onUpStart).toBeGreaterThan(onMoveStart);
    const onMove = begin.slice(onMoveStart, onUpStart);

    // 松手后的 move（buttons === 0）必须走同一个 onUp 收尾并立即返回：
    // 不再计算增量、不再发送 window-size 请求。
    expect(onMove).toMatch(/if \(ev\.buttons === 0\) \{[^}]*onUp\(\)[^}]*return/);
    const guardAt = onMove.indexOf("ev.buttons === 0");
    expect(guardAt).toBeLessThan(onMove.indexOf("var dxTotal"));
    expect(onMove.indexOf("sendStep(")).toBeGreaterThan(guardAt);

    // 收尾只有一套：同一个 onUp 移除 move / up / cancel 三个监听，不新增第二套清理。
    expect((begin.match(/var onUp = function \(\)/g) || []).length).toBe(1);
    expect(begin).toMatch(
      /var onUp = function \(\) \{\s*document\.removeEventListener\('pointermove', onMove\)\s*document\.removeEventListener\('pointerup', onUp\)\s*document\.removeEventListener\('pointercancel', onUp\)/,
    );
  });

  it("keeps the FFmpeg option disabled until installation is ready", () => {
    expect(source).toMatch(/disabled: !ffmpegStatus\.canSelectFfmpeg/);
    expect(source).toMatch(/ffmpeg-install/);
    expect(source).toMatch(/githubMirror/);
  });
});
