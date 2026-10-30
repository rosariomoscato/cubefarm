# Investigation: the 8 ms walkways budget

Date: 2026-10-30. Feature branch: `feat/english-italian` (`353fe8e`, product changes in `3d438ce`). Baseline: fork `origin/main`, `7c9c148`.

Integration update: the manager subsequently authorized a draft PR for independent CI. [Fork PR #3](https://github.com/rosariomoscato/cubefarm/pull/3) passed [CI on Ubuntu, Windows and macOS](https://github.com/rosariomoscato/cubefarm/actions/runs/41084777570), including the unchanged 8 ms assertion, and was then moved to review. Following a separate explicit authorization it was merged into fork `main` as `2a5200de7ebb63b639c0dcfb6cb028659c74dd99`. No pathfinding or threshold change was made. Publication/merge restrictions mentioned below describe earlier stages; the local measurements and their limitations remain valid despite the successful remote run. Global installation and npm publication remain untouched.

## Conclusion

The observed performance-test failures are reproducible **without the EN/IT changes**. The timed pathfinding code and its runtime dependency graph are identical on the feature branch and baseline, and repeated runs of the unchanged test both pass and fail on both checkouts. This is not evidence of an EN/IT-induced pathfinding regression.

There is nevertheless a real computational cost: the existing planner can exceed its 8 ms budget on this machine, especially with variable CPU availability. A passing retry must not be used to erase earlier failures or declare a stable green performance result. These measurements do not establish whether the algorithm meets the budget on a quiet machine or whether it causes visible frame stalls in the production browser.

During the initial investigation, no application source, test assertion, timeout, dependency, power setting or provider configuration was changed. The separately authorized temporary power-plan check is recorded below, including restoration. No AI request, paid voice request, real office access, push, PR or merge was involved. Instrumentation was confined to temporary diagnostic scripts and a temporary copy of the navigation module; reported timings use the uninstrumented implementation except for the explicitly identified sampled profile. The baseline used a detached worktree and the same installed dependencies, without installing packages.

## What the test actually measures

`client/src/world/walkways.test.ts:145–157` builds/reuses the office's cached navigation data, prepares 15 deterministic desk-to-spot pairs, warms each pair once, times five batches of 15 routes and requires their median to be **strictly below 8 ms**. Grid construction is outside the timed section. The test is CPU-only: it does not render three.js or call an agent, speech service or GitHub.

The complete file also exercises reachability, collision clearance, path length and steering. Those 16 non-budget tests passed in every repeated file execution below. The current investigation does not replace the complete grouped-suite result of 2,535 passing tests and one failure, documented in [the validation report](validation-english-italian.md).

## Runtime equivalence

- `package.json`, `package-lock.json`, the Vitest configuration, the performance test and navigation/layout modules have no relevant diff from baseline.
- SHA-256 comparisons matched for all **14 runtime input modules** of `walkways.ts`, including `planPath`, collision layout and smoothing code.
- An in-memory, tree-shaken diagnostic bundle produced by the same installed esbuild, with `platform: node`, `format: esm`, `target: node22`, no minification and the respective checkout as its working directory, was **identical byte for byte**: 32,559 bytes, SHA-256 `dec76a6018065438d72bc385f034027b32848f95a696cd2bf2df8385a8bf7ede`.
- Diagnostic runs on both checkouts returned exactly the same 15 paths: serialized path-data SHA-256 `d85ed8d0bd7402e8aabbf21365b06b0de67e0b738bbb472c5725a67da30909b7`.

The diagnostic bundle is an equivalence check, not a measurement of the actual production browser bundle.

## Repeated unchanged Vitest runs

Six fresh processes were run sequentially, alternating branch order, with the original test and unchanged options:

```powershell
npm.cmd test -- client/src/world/walkways.test.ts --maxWorkers=1 --testTimeout=15000
```

| Run | Checkout | File result | Failing budget median |
| --- | --- | --- | ---: |
| 1 | Feature | 16 passed, 1 failed | 8.396 ms |
| 2 | Baseline | 17 passed | Not emitted by the unchanged passing assertion |
| 3 | Baseline | 17 passed | Not emitted by the unchanged passing assertion |
| 4 | Feature | 16 passed, 1 failed | 15.364 ms |
| 5 | Feature | 17 passed | Not emitted by the unchanged passing assertion |
| 6 | Baseline | 16 passed, 1 failed | 16.024 ms |

Previous independent file runs measured 13.469 ms on the feature branch and 8.913 ms on baseline. These results demonstrate variability on both; six runs are not sufficient to estimate a reliable failure probability or compare branch performance statistically.

## Environment and broader timing samples

- Windows x64, Node **22.23.1**, V8 **12.4.254.21-node.56**.
- CPU: AMD Ryzen 5 3550H, 8 logical processors.
- Active Windows plan: **Power saver**. Read-only queries showed the configured maximum processor state is 100% on both AC and battery, so there is no evidence of an explicit reduced maximum-state cap. The power plan alone does not prove the cause.
- A Windows performance-counter snapshot showed **83% processor time** and a reported frequency of 1,800 MHz. That is one observation, not a continuous frequency trace.
- During a longer diagnostic profile, CPU counters reported approximately **73.2% host utilization**. For that run, 1,000 batches used approximately **11.258 seconds elapsed** and **8.687 seconds of process CPU time**. Other activity, scheduling and frequency changes are plausible contributors; their individual effects were not isolated. No other applications or offices were stopped to make the test pass.

A standalone read-only harness used the original `walkways` and `findPath`, the same 15 pairs and an office/lobby all-pairs prelude followed by the test's explicit warmup. It does not reproduce every Vitest assertion or all preceding tests, so it is diagnostic, not an acceptance-test replacement. Each process measured 100 batches; branch order was alternated:

| Checkout | Median of all 100 batches | 95th percentile | Batches at or above 8 ms |
| --- | ---: | ---: | ---: |
| Feature | 24.478 ms | 119.516 ms | 100/100 |
| Baseline | 21.336 ms | 96.151 ms | 99/100 |
| Baseline | 15.609 ms | 37.105 ms | 100/100 |
| Feature | 21.507 ms | 72.623 ms | 100/100 |
| Feature | 14.120 ms | 33.874 ms | 89/100 |
| Baseline | 9.293 ms | 18.613 ms | 72/100 |

An earlier feature run had a first-five median of **7.548 ms**, but the median of all 100 batches was **9.173 ms**, with 62 batches at or above 8 ms. This illustrates why five observations near the budget can yield a passing result without stable headroom. Even the smallest observed batches and later isolated route timings changed with the environment; do not interpret this table as an EN/IT slowdown or a controlled power-plan comparison.

## Where the work goes

An inspector CPU profile sampled 1,000 batches of the unchanged feature implementation at a requested 1 ms interval, after import and warmup. Approximate **self sample shares**, not exact per-phase elapsed times:

| Function / activity | Share of 5,438 samples |
| --- | ---: |
| `planPath` | 61.7% |
| `segmentClear` | 20.7% |
| Garbage collection | 1.7% |

Inlining means `planPath` samples also cover work performed by inlined helpers; 61.7% cannot be assigned exclusively to A* search. The profile includes sampling overhead and scheduling effects and was not used as the acceptance timing. It points to planning and line-of-sight work, not translation or dominant garbage collection.

A separately instrumented temporary copy counted operations for one batch of the 15 test routes. Every returned path was compared with the original and matched exactly. Instrumented execution was **not** used for timing:

| Work per 15 routes | Count |
| --- | ---: |
| Navigation grid | 160 × 120 cells; 67 rectangles |
| Fresh typed-array storage allocated | 2,592,000 bytes, excluding heap/path objects |
| A* cells expanded | 1,108 |
| Heap pushes / pops | 4,026 / 1,262 |
| Segment visibility checks | 496 |
| Rectangle candidates checked during segment filtering | 33,232 |
| Sampled point-clearance calls / rectangle checks | 6,046 / 27,357 |
| Routes already clear in a straight line | 6 of 15 |

The planner still runs A* before smoothing even for those six straight routes. Two routes (`desk-0` → `board-backlog` and `desk-11` → `gong`) account for 267 of the 496 segment checks. These are concrete optimization candidates, not an implemented fix or a speedup claim.

## Options for the next decision

1. **Controlled environment check first (recommended).** With the manager's consent, use a quiet machine and a balanced/performance power plan, then repeat baseline and feature measurements with the same dependencies. Record the plan, host load and repeated results. This investigation did not change the system plan or close the manager's applications.
2. **Separate navigation optimization branch if needed.** Retain the 8 ms budget and investigate a safe straight-line fast path, reduced scratch-array allocation/initialization, and fewer repeated visibility checks. Validate endpoint clearance, player avoidance, collision safety, route shape/length and roomba behavior before claiming improvement. Do not mix an unverified algorithm change into the EN/IT feature.
3. **Review performance-test methodology separately.** Preserve functional tests and the performance goal, but consider separating deterministic correctness from machine-dependent benchmarks, with a documented reference environment, warmup, sample distribution and a repeatable regression signal. A blanket threshold increase or retries-until-green would conceal the present issue and is not recommended.

The controlled-environment option was subsequently attempted as recorded below, but its quiet-load precondition was not met. No algorithm or test-methodology change has been applied. A draft PR for independent CI was then authorized as noted above; the investigation does not turn the last full validation result green.

## Authorized controlled-environment attempt: blocked before tests

On 2026-10-30 the manager authorized the controlled check. The active plan was confirmed as Power saver (`a1841308-3541-4fab-bc81-f71556f20b4a`); Windows Balanced (`381b4222-f694-41f0-9685-ff5bb260df2e`) was present. Before switching plans, a five-second idle observation measured approximately **59.9% host CPU utilization**. Only the agent's remaining diagnostic browser tab was closed; no manager applications, offices or running jobs were stopped.

A ten-second Balanced pilot confirmed activation, but its final five seconds still averaged **34.4%** host CPU utilization, so it did not meet the diagnostic low-load criterion of 30%. The original plan was restored and verified.

A bounded attempt then allowed a ten-second settling observation followed by up to four five-second observation windows on Balanced. Before starting any test, it required **two consecutive windows averaging at most 30% host CPU utilization**. This is a diagnostic readiness criterion, not a replacement for or change to the test's 8 ms assertion. Planned tests were six sequential fresh-process runs of the unchanged file, alternating feature and baseline, with one worker and the original timeouts. They were not started because readiness was not reached:

| Five-second readiness window | Mean host CPU utilization | Maximum one-second observation |
| --- | ---: | ---: |
| 1 | 55.0% | 75.6% |
| 2 | 38.7% | 65.6% |
| 3 | 75.1% | 95.1% |
| 4 | 44.0% | 59.7% |

Result: **blocked by high/variable background load; zero acceptance-test runs**, not a passing or failing pathfinding result. The active plan was checked during the attempt and the original Power saver plan was restored and verified in cleanup. Dependencies, source and test thresholds were not changed; the temporary baseline worktree was removed afterwards.

The remaining action is for the manager to close/pause only nonessential activity that can safely be interrupted (for example, unused 3D demo tabs), without losing work or stopping active agent tasks unnecessarily. The same bounded readiness check can then be repeated. Balanced alone did not create a sufficiently quiet environment in this attempt; no causal power-plan performance conclusion can be drawn.

### Readiness recheck after the manager reported ready

A subsequent five-second observation still measured approximately **64.0%** host utilization. A read-only Windows process-counter snapshot showed CPU activity in `vmmemWSL`, Brave and OpenCode, among other processes. These counters are a snapshot and their per-process percentages must not be mistaken for normalized whole-machine percentages. No process was terminated or suspended.

A second ten-second Balanced readiness pilot again verified activation and restoration of the original plan. Its final five seconds averaged **99.6% host utilization**; it therefore failed the unchanged 30% low-load readiness criterion. This was not a pathfinding test: no acceptance-test process was started, and the result cannot establish that Balanced caused the load increase. Closing browser tabs did not establish a quiet host; remaining background activity needs to be reduced safely by the manager before another attempt. The original Power saver plan was restored successfully.

### Recheck after the manager reported Docker stopped

The manager subsequently reported Docker stopped. An initial five-second observation measured approximately **79.8%** host utilization. A later read-only process-counter snapshot no longer listed WSL or Brave among its ten largest CPU entries, but it still showed Windows services and OpenCode activity; this does not prove that every such process had exited.

The same bounded Balanced readiness protocol was repeated without changing its limits or stopping any process. After the ten-second settling period, its four five-second window means were **31.97%, 29.13%, 53.51% and 53.33%**. Only one window met the 30% criterion; the required two consecutive quiet windows did not occur. Consequently **zero acceptance-test runs were started**. The Power saver plan was restored and verified, and the temporary baseline worktree was removed. No EN/IT validation result was changed by this readiness attempt.

At this point repeated arbitrary application closures are not recommended. Further work should either diagnose the machine's remaining background-load variability as a separate task, or use a separate test runner such as the fork's GitHub Actions CI. At the time of the readiness checks no CI run or additional system change was initiated; the later draft-PR authorization is recorded above.

## Local evidence

Raw JSON reports, the CPU profile and diagnostic scripts were kept in the approved temporary tools directory, outside the repository. Key basenames: `walkways-vitest-repeated-summary.json`, `walkways-paired-summary.json`, `walkways-runtime-equivalence.json`, `walkways-operation-counts.json`, `walkways-pathfinding.cpuprofile`, `walkways-balanced-headroom.json`, `walkways-balanced-controlled-summary.json`, `walkways-balanced-headroom-after-ready.json`, `walkways-balanced-after-docker-stop-summary.json`. No private paths, logs or credentials are included in this report.
