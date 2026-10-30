# English/Italian branch validation

Date: 2026-10-30. Product commit: `3d438ce`, branch `feat/english-italian`, based on fork `main` at `7c9c148`.

Integration update: [fork PR #3](https://github.com/rosariomoscato/cubefarm/pull/3) was first opened as a draft for independent CI, then moved to review after a targeted self-review. The manager separately authorized its merge into the fork's `main`: commit `2a5200de7ebb63b639c0dcfb6cb028659c74dd99`. This changes integration status, not the measured local result below. No fully green local suite is claimed, and no global-install update or npm publication was performed.

## Independent CI and post-merge verification

[CI run 41084777570](https://github.com/rosariomoscato/cubefarm/actions/runs/41084777570) passed on `fa9d3e272dbdf34a130c3f1df8ecdc16d10d702a`, with the existing Node 24 workflow and unchanged thresholds:

- Windows: **230 files, 2,536 tests passed**.
- Ubuntu and macOS: **230 files passed, 2,534 tests passed and 2 existing Windows-only tests skipped** on each.
- All 17 walkways tests, TypeScript, build and demo package smoke test passed on every runner.

The local checkout was fast-forwarded to fork `main`. Its merge tree had no differences from the tested PR head. A fresh production build/TypeScript check and the **129-test, 12-file targeted regression group** passed again on the merged code. A new demo with separate state and ports verified EN/IT switching, saved Italian preference after reload, Pocket labels, simulated dictation preserving a draft without automatic sending, Esc cancellation and an Italian scripted CEO reply. No browser console errors were observed. The demo and browser tab were stopped afterwards; no live provider request or agent microphone capture was performed.

## Complete execution in groups

All **230 tracked test files** matched by the Vitest configuration were executed, with no omitted or duplicate files across these groups. JSON report file lists were compared with the tracked `client`, `server`, `shared` and `scripts` test inventory. No test threshold, test timeout or application code was changed for validation.

| Group | Files | Passed tests | Failed tests |
| --- | ---: | ---: | ---: |
| Client, shared, scripts; excluding walkways | 158 | 1,746 | 0 |
| Remaining server; excluding workspace and scale | 69 | 728 | 0 |
| Workspace alone | 1 | 44 | 0 |
| Scale and walkways | 2 | 17 | 1 |
| **Total** | **230** | **2,535** | **1** |

Commands (append `--reporter=json --outputFile=<report-path>` to save machine-readable results):

```powershell
npm.cmd test -- client shared scripts --exclude '**/walkways.test.ts' --maxWorkers=1 --testTimeout=15000
npm.cmd test -- server/ --exclude '**/workspace.test.ts' --exclude '**/scale.test.ts' --exclude '**/boxScripts.test.ts' --maxWorkers=1 --testTimeout=15000
npm.cmd test -- server/workspace.test.ts --maxWorkers=1 --testTimeout=15000
npm.cmd test -- server/scale.test.ts client/src/world/walkways.test.ts --maxWorkers=1 --testTimeout=15000
```

Vitest's positional filters match substrings: the first command also includes `server/boxScripts.test.ts`. It is excluded from the second group to avoid double counting. Workspace completed in approximately 335 seconds; the scale test passed within its existing 120-second timeout.

## Remaining performance failure and baseline check

`client/src/world/walkways.test.ts` → `findPath` → `plans a whole floor (15 walks) in well under a frame` requires a median below **8 ms**. It measured **17.243 ms** after the scale test, and **13.469 ms** when the file was rerun alone. All 16 other tests in that file passed.

For comparison, a separate, clean detached worktree of the fork's `origin/main` (`7c9c148`) was tested using the same installed dependency versions, without installing or updating dependencies:

```powershell
npm.cmd test -- client/src/world/walkways.test.ts --maxWorkers=1 --testTimeout=15000
```

That baseline also failed the same assertion, measuring **8.913 ms** against the unchanged 8 ms budget. The test and its directly imported pathfinding/layout modules have no changes between the feature branch and fork `main`. This reproduces the failure on the baseline; it does not justify treating the feature branch's suite as passing or relaxing the budget. Earlier runs passed, so the performance result has varied between runs. A separate performance/environment investigation is needed before declaring a fully green local suite.

## Other validation and publication status

- TypeScript and production build passed during feature validation. Known Rapier/bundle-size warnings remain.
- The final targeted regression run passed **129 tests in 12 files**.
- The manager confirmed normal Italian dictation, draft preservation and cancellation with Esc in Chrome. Their Brave installation did not transcribe. Browser automation separately verified startup timeout feedback, preserved drafts and successful retry using fake recognition only.
- No real AI/ElevenLabs requests, microphone capture by the coding agent, global installation changes or changes to the manager's demo were needed.
- The earlier monolithic final attempt hit the external 20-minute command limit; the grouped execution above resolves the coverage uncertainty, but not the remaining performance failure.
- At the time of this grouped local validation, push and PR creation were held back because validation was **not fully green**. The subsequent draft-PR, independent CI and separately authorized merge are recorded above; nothing was published to npm.
