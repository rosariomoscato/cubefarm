import type { IncomingMessage, ServerResponse } from 'node:http';
import { PREVIEW_CHECK_EVENT, PREVIEW_CHECK_PATH } from '../shared/phoneAccess.ts';

// Reserved virtual port 0: these exact routes serve synthetic assets only, never an arbitrary upstream port.
const CSS = '/__cubefarm_check__.css';
const JS = '/__cubefarm_check__.js';
const SCRIPT = `addEventListener('load',function(){
const nonce=new URL(location.href).searchParams.get('nonce');
if(!/^[a-f0-9]{32}$/.test(nonce||''))return;
const c=navigator.serviceWorker&&navigator.serviceWorker.controller;
parent.postMessage({type:'${PREVIEW_CHECK_EVENT}',nonce:nonce,script:true,
worker:!!c&&new URL(c.scriptURL).pathname==='/preview/sw.js',
styles:getComputedStyle(document.documentElement).getPropertyValue('--cubefarm-preview-check').trim()==='ready'},location.origin);
});`;

/** The normal boot script and worker must route the page's root-relative CSS/JS for this check to pass. */
export function handlePreviewCheck(req: IncomingMessage, res: ServerResponse, boot: string): boolean {
  const pathname = (req.url ?? '').split('?')[0];
  const page = pathname === PREVIEW_CHECK_PATH;
  const css = pathname === `/preview/0${CSS}`;
  const js = pathname === `/preview/0${JS}`;
  if (!page && !css && !js) return false;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return true;
  }
  const body = page
    ? `<!doctype html><html><head>${boot}<meta charset="utf-8"><title>CubeFarm preview transport check</title><link rel="stylesheet" href="${CSS}"><script defer src="${JS}"></script></head><body>Preview transport check</body></html>`
    : css ? ':root{--cubefarm-preview-check:ready}' : SCRIPT;
  res.writeHead(200, {
    'content-type': page ? 'text/html; charset=utf-8' : css ? 'text/css; charset=utf-8' : 'text/javascript; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
  }).end(req.method === 'HEAD' ? undefined : body);
  return true;
}
