// Force Node.js built-in fetch to use the proxy for Google OAuth
// Node 18+ fetch ignores HTTP_PROXY env var, so we set a global proxy agent
import { ProxyAgent, setGlobalDispatcher } from "undici";

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
if (proxyUrl) {
  setGlobalDispatcher(new ProxyAgent({ uri: proxyUrl }));
  console.log("[proxy] Google OAuth proxy configured:", proxyUrl);
}
