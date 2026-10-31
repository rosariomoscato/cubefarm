# Phone access and preview transport

Open **Manager’s console → Settings → Phone access**, **Settings → Phone access** in pocket mode, or **Phone access** in the app viewer. The guide is available
in English and Italian. Local use on the office computer is unchanged: it needs no remote setup.

## What the guide does (and does not do)

- Checks the **current browser’s** origin, secure-context status and service-worker availability. It does not trust
  forwarded headers as proof that a browser is secure.
- On unsupported remote connections, replaces the app-viewer frame with an explanation and setup steps, instead
  of showing a misleading unstyled app. Running previews are not stopped. A new-tab preview link is unavailable
  there until the browser supports the transport. This is guidance, not an access-control boundary.
- Reads the server’s **actual listening port**, including a custom port, to generate a manual command. A proxy’s
  external port is not necessarily the office port. The guide never uses a user-supplied hostname in a shell command.
- Never installs Tailscale, executes commands, changes certificates, firewall, listening address, preview settings,
  notification links or account credentials. It never enables automatic assignment/merge or starts an AI job.
- The address field validates an HTTPS **origin** only, without credentials, a path, query or fragment. Opening it is
  an explicit browser navigation. The office never fetches an arbitrary URL to “test” it (no server-side URL probe).

## Keep the office private

**HTTPS is encryption, not authorization.** CubeFarm can run agents and commands on the office computer. Anyone
who can reach the office can use those capabilities. Keep the server on loopback and put a trusted access boundary
in front of **every** route: the UI, API, previews, WebSockets and callbacks as appropriate to your installation.
Do not publish a bare office on the internet or bypass certificate errors. The guide warns if the server already
listens beyond loopback; adding HTTPS does not close that existing route.

### Tailscale Serve

Install Tailscale yourself on both devices and sign into your tailnet. Restrict its access rules to trusted users and
devices; membership in a shared tailnet is not the same as “only me”. On the **office computer**:

1. Run `tailscale serve status` and review existing routes. Do not replace another service’s route.
2. Review the guide’s command and Tailscale’s HTTPS/certificate prompts. For an office on port `4317`, it shows:

   ```sh
   tailscale serve --bg --https=443 http://127.0.0.1:4317
   ```

   The guide substitutes the real port. If the office is bound to a specific address not confirmed reachable on
   `127.0.0.1`, it withholds this command and asks you to review `SWARM_HOST`; it does not change that setting.
3. If requested, enable HTTPS for the tailnet. Open the **HTTPS address printed by Serve** on the phone. Do not
   guess the machine name or disable certificate validation. Serve may request administrator/tailnet permissions;
   provisioning certificates can publish certificate names in public certificate-transparency logs.

`--bg` makes this sharing persist across restarts. To remove it, inspect the existing routes and follow Tailscale’s
instructions for disabling **only the route you configured**; do not reset unrelated Serve configuration. Use
[Serve, not Funnel](https://tailscale.com/kb/1242/tailscale-serve): Funnel publishes services to the internet.

### Your own HTTPS proxy

Use a private proxy or an identity-aware gateway such as Cloudflare Access in front of a tunnel. A public tunnel
or a bare HTTPS reverse proxy without access control is not sufficient. Configure it yourself using its TLS and
authentication documentation:

- Use a certificate trusted by the phone and a **dedicated HTTPS origin**, mounted at `/`, not a subpath.
- Forward all paths without stripping `/api/`, `/preview/` or `/ws`; support WebSocket upgrades.
- Target the office’s local listening port, displayed by the guide. Preserve the office’s loopback binding.
- Protect all routes consistently; do not exempt previews or API/WebSocket routes from authentication.
- Verify access rules and certificate trust independently. A successful page load does not prove privacy.

## Verify from the phone

Open the private HTTPS office **on the phone**, open the guide and choose **Check preview CSS and scripts**.
This loads a hidden diagnostic page using the real preview boot script and service worker. Its root-relative CSS
and JavaScript must be routed through the preview mount and have the right effects before it reports success.
The parent validates the message’s origin, source frame and per-attempt nonce; failure/timeout remains visible and
can be retried. Closing the panel removes the listener/timer/frame.

The reserved virtual mount `/preview/0/__cubefarm_check__` and its two exact asset routes serve fixed synthetic
content only. They never connect to a project, another port or an external URL. No preview needs to be running and
no dependencies are installed. The routes are read-only (GET/HEAD); other virtual-port paths remain invalid.

**A passing check proves worker/CSS/JavaScript routing in that browser only.** It does not verify proxy authentication,
all of an app’s assets or compatibility, WebSockets/HMR, client-side routers or another device. Apps may still block
framing, need framework-specific proxy configuration, or interpret `/preview/<port>/` as part of their route. Local
previews on the office PC remain direct connections. Directly opening a gateway URL outside the app viewer on an
unsupported browser can still fail; the guide does not rewrite arbitrary applications.

After verifying the address, optionally put it in **Notifications → Office address for links**. That field changes
the links sent in notifications; it does not configure HTTPS or remote access, and the guide never writes it for you.
