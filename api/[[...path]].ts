// The Express app is bundled once during the Vercel build. Keep this adapter
// deliberately small so Vercel routes /api and /api/* directly to the same
// backend used by local production builds.
import serverBundle from '../dist/server.cjs';

const handler = (serverBundle as any)?.default || serverBundle;

export default handler;
