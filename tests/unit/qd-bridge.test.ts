import { describe, it, expect, vi, afterEach } from 'vitest';
import { createBridge } from '../../src/scripts/qd-bridge';
import { DEMO_OUTPUT, START } from '../../src/scripts/qd-sim';

afterEach(() => { vi.useRealTimers(); });
function setup() {
  const started: string[][] = [];
  const b = createBridge({ refresh: async () => ({ lastUpdated: '09:00', providers: [] }), startCollab: a => started.push(a), simNow: () => START }, '0.5.0-rc.5');
  return { b, started };
}

describe('window.quotaDeck for the hosted tray UI', () => {
  it('offers what the web demo can answer and leaves desktop-only actions out', () => {
    const { b } = setup();
    expect(Object.keys(b.api).sort()).toEqual(['collaborationState', 'onCollaborationState', 'onSnapshot', 'openSettings', 'refreshAll', 'runCollaboration']);
  });
  it('pushes every refresh to the UI, as quota:snapshot does', () => {
    const { b } = setup(), seen: unknown[] = [];
    const off = b.api.onSnapshot(s => seen.push(s));
    b.push({ n: 1 }); off(); b.push({ n: 2 });
    expect(seen).toEqual([{ n: 1 }]);
  });
  it('a collaboration runs through running → done and returns no invented answer', async () => {
    vi.useFakeTimers();
    const { b, started } = setup(), states: boolean[] = [];
    b.api.onCollaborationState(s => states.push(s.running));
    const run = b.api.runCollaboration({ task: '分析需求', agents: ['codex', 'claude', 'nobody'] });
    expect(started).toEqual([['codex', 'claude']]);
    await vi.advanceTimersByTimeAsync(5_800);
    const r = await run;
    expect(states).toEqual([true, false]);
    expect(r.results.map(x => [x.id, x.status, x.output])).toEqual([['codex', 'done', DEMO_OUTPUT], ['claude', 'done', DEMO_OUTPUT]]);
    expect((await b.api.collaborationState()).result).toEqual(r);
  });
  it('a second run while one is running is refused with QuotaDeck\'s own message', async () => {
    vi.useFakeTimers();
    const { b } = setup();
    const first = b.api.runCollaboration({ task: '一', agents: ['codex', 'claude'] });
    await expect(b.api.runCollaboration({ task: '二', agents: ['codex', 'claude'] })).rejects.toThrow('已有协作任务运行，请等待结束');
    await vi.advanceTimersByTimeAsync(6_000);
    await expect(first).resolves.toMatchObject({ task: '一' });
  });
  it('the about box names the version and says where the data lives', async () => {
    const { b } = setup();
    expect(await b.api.openSettings()).toEqual({ status: 'available', version: '0.5.0-rc.5（网页演示）', dataLocation: '浏览器内存（网页演示，不保存）' });
  });
});
