import { useEffect, useState } from 'react';
import { api } from '../api';
import { T, useT } from '../i18n';
import { httpsOfficeUrl, phoneAccessState, PREVIEW_CHECK_PATH, previewCheckResult, tailscaleServeCommand, type PhoneAccessInfo, type PhoneConnection } from '../../../shared/phoneAccess';
import { onOfficeComputer } from './channels';
import './phoneAccess.css';

export function browserPhoneConnection(): PhoneConnection {
  return { local: onOfficeComputer(location), protocol: location.protocol, secure: window.isSecureContext, serviceWorker: 'serviceWorker' in navigator };
}

/** A manual guide. No network configuration, installs, AI work or project execution happens here. */
export function PhoneAccess({ blocked = false }: { blocked?: boolean }) {
  const t = useT();
  const [open, setOpen] = useState(blocked);
  const [method, setMethod] = useState<'tailscale' | 'proxy'>('tailscale');
  const [info, setInfo] = useState<PhoneAccessInfo | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [address, setAddress] = useState('');
  const [nonce, setNonce] = useState<string | null>(null);
  const [check, setCheck] = useState<'idle' | 'checking' | 'passed' | 'failed'>('idle');
  const [copied, setCopied] = useState(false);
  const connection = browserPhoneConnection();
  const state = phoneAccessState(connection);
  const canCheck = connection.secure && connection.serviceWorker;
  const secureUrl = httpsOfficeUrl(address);
  const command = info?.supportsLoopbackProxy ? tailscaleServeCommand(info.port) : null;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadError(false);
    void api.phoneAccess().then((data) => { if (!cancelled) setInfo(data); }, () => { if (!cancelled) setLoadError(true); });
    return () => { cancelled = true; };
  }, [open, retry]);

  useEffect(() => {
    if (!nonce) return;
    const receive = (event: MessageEvent) => {
      const frame = document.getElementById(`phone-access-${nonce}`) as HTMLIFrameElement | null;
      if (event.origin !== location.origin || event.source !== frame?.contentWindow || !previewCheckResult(event.data, nonce)) return;
      setCheck(event.data.worker && event.data.script && event.data.styles ? 'passed' : 'failed');
      setNonce(null);
    };
    window.addEventListener('message', receive);
    const timer = setTimeout(() => { setCheck('failed'); setNonce(null); }, 15_000);
    return () => { clearTimeout(timer); window.removeEventListener('message', receive); };
  }, [nonce]);

  const verify = () => {
    if (!canCheck) return;
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    setCheck('checking');
    setNonce(Array.from(bytes, b => b.toString(16).padStart(2, '0')).join(''));
  };

  return (
    <section className={`card phone-access ${blocked ? 'phone-access-blocked' : ''}`} aria-label={t('Phone access')}>
      <h3><T>📱 Phone access</T></h3>
      <p role={blocked ? 'alert' : 'status'}>
        {t(state === 'local' ? 'You are on the office computer. Local previews need no remote setup.' : state === 'https' ? 'HTTPS and service workers are available in this browser. Verify the preview transport below.' : state === 'remote-http' ? 'Remote HTTP cannot load previews reliably. CSS and scripts may go missing. Use a private HTTPS address.' : 'This browser cannot use the preview service worker. Check the certificate, browser support and whether an insecure page is embedding the office.')}
      </p>
      {!open ? <button className="btn" onClick={() => setOpen(true)}><T>Set up phone access</T></button> : (
        <>
          <p className="term-error"><T>HTTPS encrypts the connection; it does not authorize visitors. Anyone with access to this office can control agents and run commands. Keep it private or behind authentication.</T></p>
          <p className="muted small"><T>This guide never changes your network, certificates, firewall or office settings. Run commands yourself on the office computer only after reviewing them.</T></p>
          {info && !info.loopbackOnly && <p className="term-error"><T>The office currently listens beyond loopback. HTTPS will not close that existing access. Review the bind address and firewall separately.</T></p>}
          <div className="seg" role="group" aria-label={t('HTTPS setup method')}>
            <button className={`seg-btn ${method === 'tailscale' ? 'seg-on' : ''}`} aria-pressed={method === 'tailscale'} onClick={() => setMethod('tailscale')}>Tailscale</button>
            <button className={`seg-btn ${method === 'proxy' ? 'seg-on' : ''}`} aria-pressed={method === 'proxy'} onClick={() => setMethod('proxy')}><T>Own HTTPS proxy</T></button>
          </div>
          {method === 'tailscale' ? (
            <ol>
              <li><T>Install Tailscale on the office computer and phone, sign in to your tailnet, and allow only trusted users/devices in its access rules.</T></li>
              <li><T>On the office computer, inspect existing Serve routes first. Do not overwrite a route used by another service.</T><pre className="term">tailscale serve status</pre></li>
              <li>
                <T>After reviewing the route and any HTTPS/certificate prompts, run the following command yourself. It persists across restarts.</T>
                {command ? <><pre className="term">{command}</pre><button className="btn btn-small" disabled={!navigator.clipboard?.writeText} onClick={() => void navigator.clipboard.writeText(command).then(() => setCopied(true), () => setCopied(false))}>{t(copied ? 'Copied' : 'Copy command')}</button></> : <p className="muted small">{t(loadError ? 'Could not read the office port. Retry; no command has been generated.' : info ? 'This bind address is not confirmed reachable through 127.0.0.1. Review SWARM_HOST on the office computer before configuring a loopback proxy.' : 'Reading the actual office port…')}</p>}
                {loadError && <button className="btn btn-small" onClick={() => setRetry(n => n + 1)}><T>Retry port check</T></button>}
              </li>
              <li><T>Use the HTTPS address printed by Serve on your phone. Enable HTTPS in the tailnet if Tailscale asks. Serve is private to your tailnet; do not use Funnel or open a public router port.</T></li>
            </ol>
          ) : (
            <ol>
              <li><T>Use a trusted private proxy or an identity-aware HTTPS proxy. Put authentication/access control in front of the whole office, including API, preview and WebSocket routes; a public certificate alone is not enough.</T></li>
              <li><T>Mount the office at the root of a dedicated HTTPS origin, not a subpath. Forward all paths unchanged, support WebSocket upgrades, and proxy to the office’s local listening port.</T>{info && <pre className="term">{t('Office listening port: {port}', { port: info.port })}</pre>}</li>
              <li><T>Use a certificate trusted by the phone. Do not bypass browser certificate warnings or disable browser security. Follow your proxy’s authentication and TLS documentation.</T></li>
            </ol>
          )}
          <p className="small"><a href="https://tailscale.com/kb/1242/tailscale-serve" target="_blank" rel="noopener noreferrer"><T>Tailscale Serve documentation ↗</T></a></p>
          <label className="field"><span><T>Your private HTTPS office address</T></span><input type="url" value={address} onChange={e => setAddress(e.target.value)} placeholder="https://your-office.example" autoComplete="off" spellCheck={false} /></label>
          {address && !secureUrl && <p className="term-error"><T>Enter an HTTPS origin only, without a path, query, fragment or embedded credentials.</T></p>}
          {secureUrl && <a className="btn" href={secureUrl} target="_blank" rel="noopener noreferrer"><T>Open HTTPS office ↗</T></a>}
          <p className="muted small"><T>After verifying the address, you may enter it under Notifications → Office address for links. That field only changes notification links; it does not configure remote access.</T></p>
          <h4><T>Verify on the phone</T></h4>
          <p className="muted small"><T>Open the private HTTPS office on your phone and run this check there. A local check does not validate the phone or your access rules.</T></p>
          <button className="btn" disabled={!canCheck || check === 'checking'} onClick={verify}>{t(check === 'checking' ? 'Checking preview transport…' : 'Check preview CSS and scripts')}</button>
          {!canCheck && <p className="muted small"><T>The check needs a secure browser context with service workers. Reopen the office over trusted HTTPS first.</T></p>}
          {check === 'passed' && <p role="status"><T>✓ The preview worker loaded the test CSS and JavaScript correctly in this browser.</T></p>}
          {check === 'failed' && <p role="alert"><T>The transport check failed or timed out. Check the certificate, browser service-worker permissions and proxy routes, then retry. No project was started.</T></p>}
          <p className="muted small"><T>This uses synthetic test assets only, with no AI work or dependency installs. It verifies worker/CSS/JavaScript routing, not every app’s compatibility, authentication or WebSocket connection.</T></p>
          {nonce && <iframe id={`phone-access-${nonce}`} key={nonce} hidden title={t('Preview transport check')} sandbox="allow-scripts allow-same-origin" src={`${PREVIEW_CHECK_PATH}?nonce=${nonce}`} />}
        </>
      )}
    </section>
  );
}
