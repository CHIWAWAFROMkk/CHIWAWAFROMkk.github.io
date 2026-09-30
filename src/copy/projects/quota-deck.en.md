![A data desk of a computer, spreadsheets and drawings](/assets/editorial/analysis-desk.webp)
*AI-generated illustration · not a real project scene or product screenshot*

One desktop entry point for quotas scattered across agents and APIs: first see how much is left, then open the models and their consumption multipliers, then hand a task to several local agents at once.

## From a model list to a usage decision

When one account balance appears under a dozen models, it looks as if each model had its own allowance. The project keeps pools, models and billing apart, and shows only what each provider actually reports.

The current version is the 0.5.0 release candidate (0.5.0-rc.5), and its source is public.

### Quota

Folded by provider, with a shared pool shown only once. Claude Code shows its five-hour and weekly subscription windows; Antigravity shows its quota windows, reset times and sampled burn rate; WorkBuddy shows each model's consumption multiplier.

### Models

Collects the models the connected services currently return, with search. Each model's strengths are marked as a local suggestion, so heuristic tags are never mistaken for official benchmarks.

### Parallel hand-off

The same task goes to the agents you tick: Codex drafts the technical plan, Claude Code reviews independently, Antigravity proposes an alternative, WorkBuddy shapes the deliverable; their independent results appear side by side. Nothing starts until the user ticks the agents.

![How pools, models and tasks relate (diagram in Chinese)](/assets/editorial/quota-pools.svg)

A structural sketch of shared quota sources and model choice. It holds no private balances and is not a picture of the running interface.

## Connections and current scope

| Service | Data source | Current limits |
|---|---|---|
| Codex | Local CLI: account windows, model list | Shared quota is never split into invented per-model shares |
| Claude Code | Subscription windows and session model forwarded by the official statusLine | One-click connect in the app; an existing status line keeps working through a chained bridge, and one click disconnects and restores it exactly |
| Antigravity | The local service's quota and model catalogue, falling back to the CLI | Experimental interface that may change with client versions; burn rate is sampled per pool |
| DeepSeek | Official API for balance and models | Needs the user's own API key; the account balance is shared |
| WorkBuddy | An official web snapshot the user saved | Does not refresh the web page automatically; balance and multipliers are as of the snapshot time |

The catalogue covers what the connectors return; it does not promise to discover any local agent. Third-party names and trademarks belong to their owners.

## How to read a multiplier

On the same billing basis, a lower consumption multiplier means the same balance goes further. The interface uses the reciprocal of the multiplier to help compare.

### A worked example, not an account measurement

Suppose two models have multipliers of 0.5× and 1×. Under the same input and output conditions, the first gives twice the relative usage of the second.

This does not convert into an exact number of requests: context length, output length, caching and discounts all change real consumption. When a provider does not publish a multiplier, it stays unknown.

## Implementation and verification

An Electron tray window with Node.js connectors. Data reads and model calls stay in the main process; the interface acts through a restricted bridge.

### Verified

61 automated checks cover shared-quota mapping, output parsing, status boundaries, the Claude Code chained bridge, connector hardening, packaging and security boundaries; on the development machine, short parallel tasks ran end to end through Codex, Antigravity and WorkBuddy. CI checks and builds never call real account models.

If the interface fails it can recover automatically within limits, or be reloaded from the tray; collaboration state for the current run stays in memory, and a reload never calls the models again.

### Still to build

Multi-round cross-review, automatic summaries, discovery of arbitrary agents and exact per-model consumption attribution are not implemented. Capability suggestions come from name rules and have not been calibrated against real benchmarks.

## Run it on your own computer

You need Windows 11, Node.js 22+ and PowerShell 7; install and sign in to the CLIs you need as the repository README describes.

```
git clone https://github.com/CHIWAWAFROMkk/quota-deck.git
cd quota-deck
npm ci
npm run check
npm start
```

You can also build a portable package with the repository's packaging script (an unsigned release candidate that does not bypass Windows security prompts; the package ships a per-file SHA-256 manifest).

Neither the public source nor the builds contain private usage snapshots, sign-in credentials or API keys. This page only describes the features; it never connects to a visitor's computer or reads any account. Real parallel tasks consume quota at the providers you choose.

- [Source and setup guide](https://github.com/CHIWAWAFROMkk/quota-deck) · [Builds and checks](https://github.com/CHIWAWAFROMkk/quota-deck/actions) · [MIT licence](https://github.com/CHIWAWAFROMkk/quota-deck/blob/main/LICENSE)
