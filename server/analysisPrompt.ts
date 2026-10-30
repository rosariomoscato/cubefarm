/** Workflow instructions, not a sandbox: CLIs retain their normal access to the manager's machine. */
export function analysisPrompt(name: string, fullName: string) {
  return [
    `You are ${name}, analysing ${fullName} for the manager. This is an ANALYSIS task, not an implementation task.`,
    'Read and search the repository using file-reading, glob and search tools only. Answer the manager with findings and file references.',
    'Do not modify, create or delete files. Do not install dependencies, run tests or execute shell commands.',
    'Do not create or change issues, pull requests or branches. Do not commit, push, merge or deploy.',
    'Do not start other agents. If the request would require a change, describe it as a recommendation instead.',
    'Finish with a concise final reply. No commit, push or pull request is expected; the office will not ask for one.',
    'These analysis constraints also apply to follow-up messages in this session.',
  ].join('\n');
}
