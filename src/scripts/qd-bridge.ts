import { AGENT_FLOW, collabEnd, collabResult, type AgentId } from './qd-sim';

export interface CollabState { running: boolean; result: ReturnType<typeof collabResult> | null; error: string | null }
export interface BridgeHost {
  /** Re-reads every provider at the current simulated time and returns the UI snapshot (QuotaDeck's refreshAll). */
  refresh(): Promise<any>;
  startCollab(agents: AgentId[]): void;
  simNow(): number;
}
const AGENT_IDS: readonly string[] = AGENT_FLOW.map(a => a.id);

/** window.quotaDeck for the hosted tray UI: the desktop app's preload API (src/main/preload.cjs), answered by the page.
 *  Desktop-only actions — the tray, the Claude statusLine hook-up, the WorkBuddy login, the help file — are left out, so
 *  the UI shows its own "use the desktop app" messages instead of pretending. */
export function createBridge(host: BridgeHost, version: string) {
  const snapshots = new Set<(s: any) => void>(), collabs = new Set<(s: CollabState) => void>();
  let state: CollabState = { running: false, result: null, error: null };
  const notify = () => collabs.forEach(cb => cb(state));
  const api = {
    refreshAll: () => host.refresh(),
    openSettings: async () => ({ status: 'available', version: `${version}（网页演示）`, dataLocation: '浏览器内存（网页演示，不保存）' }),
    // The flow of the desktop app's collab:run handler (src/main/main.cjs), with the agents' work replaced by the demo.
    runCollaboration: async (request: { task: string; agents: string[] }) => {
      if (state.running) throw new Error('已有协作任务运行，请等待结束');
      const agents = [...new Set(request.agents.filter(id => AGENT_IDS.includes(id)))] as AgentId[];
      state = { running: true, result: null, error: null }; notify();
      host.startCollab(agents);
      await new Promise(resolve => setTimeout(resolve, collabEnd(agents) * 1000));
      const result = collabResult(String(request.task), agents, host.simNow());
      state = { running: false, result, error: null }; notify();
      return result;
    },
    collaborationState: async () => state,
    onCollaborationState: (cb: (s: CollabState) => void) => { collabs.add(cb); return () => { collabs.delete(cb); }; },
    onSnapshot: (cb: (s: any) => void) => { snapshots.add(cb); return () => { snapshots.delete(cb); }; },
  };
  return { api, push(snapshot: any) { snapshots.forEach(cb => cb(snapshot)); }, state: () => state };
}
