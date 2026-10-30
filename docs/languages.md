# Office language: English and Italian

Choose **English** or **Italiano** in **Office language** on the welcome/setup screen, the manager's console → Settings, or Pocket mode → Settings. The server saves one preference for the whole office, shared by connected devices. Older offices and unsupported saved values default to English. Missing translation keys fall back to English.

## Coverage

- Welcome/setup flow, console navigation and primary CEO/team/settings controls.
- Phone chat input, quick prompts and navigation; Pocket navigation and language settings.
- OpenCode model browser, primary project-connection and read-only analysis controls.
- CEO system instructions, messages sent to an active CEO, and new/resumed analysis sessions ask for manager-facing replies in the chosen language. Changing language does not rewrite earlier messages or interrupt a running response. The next message applies it; direct keystrokes into a CLI bypass the office's message wrapper.
- Code, commands, identifiers, file paths, GitHub issues, PRs and repository QA briefs remain in English. User names, company names, model IDs and existing repository content are never passed through UI translation.

This is an initial localization, not a complete translation of every screen. Advanced settings descriptions, some team/hiring details, mission control, games, the 3D world's labels, notifications, errors, technical logs, tours and scripted rituals may still appear in English. The demo's ordinary status chat and analysis replies support Italian; its specialized onboarding/planning/triage scripts remain English. Model-generated replies follow instructions, not a translation service or enforced language filter.

## Speech

Browser speech recognition uses `en-US` or `it-IT`, rather than the device locale. Browser speech synthesis prefers the selected voice when it matches the office language, otherwise a matching default/available voice, then the explicitly selected voice as a last fallback. Italian voices must be installed/available on the device; browser support varies.

The manager verified Italian dictation in Chrome. In their Brave installation the microphone stayed yellow without transcription. Exposing the Web Speech API does not prove that a browser's speech service works; this is not a blanket block on Brave. Yellow means startup, not active listening. If startup never completes, after approximately 10 seconds the office stops the attempt, releases audio ducking, preserves the draft and shows a localized error with permission/browser suggestions. Recognition errors are also shown when a browser does not send an end event. No automatic fallback to paid transcription is performed. On Windows, clicking the message box and pressing **Windows + H** is an alternative independent of CubeFarm's microphone button.

ElevenLabs receives `language_code: it` for Italian synthesis and transcription. Choose a multilingual model and a suitable voice. English requests retain their existing payload shape. New synthesis cache keys distinguish Italian; previously saved message clips remain unchanged and replay without new synthesis, even after switching languages. Changing language does not translate existing message text. Voice previews supplied by ElevenLabs itself may remain English.

Language changes do not make an AI or ElevenLabs request. Testing a paid voice or sending a message in a real office can consume provider quota. Validation for this feature uses fake sessions, mocked HTTP and an isolated demo only; no live AI, microphone capture or paid voice call is required.

## Adding translations

Use explicit `T`/`useT` calls from `client/src/i18n.tsx` for interface text and add its English key and Italian value to `shared/i18n.ts`. Use named placeholders (`{name}`, `{count}`), not concatenated translated fragments. Do not translate arbitrary DOM content, terminal output, user inputs or provider identifiers. The dictionary has no external service or runtime dependency.
