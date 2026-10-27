const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function imageUrl(source) {
  if (typeof source !== 'string' || !source.trim() || source.length > 16384) throw new Error('Enter a valid image URL.');
  if (source.startsWith('/') && !source.startsWith('//')) return new URL(source, 'app://force-exam/').href;
  const url = new URL(source);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('Use an HTTP(S) image URL without a username or password.');
  return url.href;
}

function imageType(bytes, contentType) {
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  if (/^GIF8[79]a/.test(bytes.subarray(0, 6).toString('ascii'))) return 'image/gif';
  if (bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  if (bytes.subarray(4, 8).toString('ascii') === 'ftyp' && /avif|avis/.test(bytes.subarray(8, 64).toString('ascii'))) return 'image/avif';
  if (contentType?.split(';')[0].trim() === 'image/svg+xml' && /<svg[\s>]/i.test(bytes.subarray(0, 4096).toString('utf8'))) return 'image/svg+xml';
  throw new Error('That URL did not return a supported image. Use a direct PNG, JPEG, GIF, WebP, AVIF, or SVG image link.');
}

async function downloadImage(source, fetchImage, { maxBytes = MAX_IMAGE_BYTES, timeoutMs = 20000 } = {}) {
  let url = imageUrl(source);
  const signal = AbortSignal.timeout(timeoutMs);
  try {
    for (let redirects = 0; redirects <= 5; redirects++) {
      const response = await fetchImage(url, { redirect: 'manual', credentials: 'omit', signal });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        await response.body?.cancel();
        if (!location || redirects === 5) throw new Error('The image URL redirected too many times.');
        url = imageUrl(new URL(location, url).href);
        continue;
      }
      if (!response.ok) { await response.body?.cancel(); throw new Error(`The image server returned HTTP ${response.status}. Check that the link is accessible.`); }
      if (Number(response.headers.get('content-length')) > maxBytes) { await response.body?.cancel(); throw new Error('The image is too large to embed (maximum 8 MB).'); }
      const reader = response.body?.getReader();
      if (!reader) throw new Error('The image response was empty.');
      const chunks = [];
      let total = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > maxBytes) { await reader.cancel(); throw new Error('The image is too large to embed (maximum 8 MB).'); }
        chunks.push(Buffer.from(value));
      }
      const bytes = Buffer.concat(chunks);
      if (!bytes.length) throw new Error('The image response was empty.');
      const type = imageType(bytes, response.headers.get('content-type'));
      return `data:${type};base64,${bytes.toString('base64')}`;
    }
  } catch (error) {
    if (signal.aborted) throw new Error('The image download timed out. Check the URL and try again.');
    throw error;
  }
}
module.exports = { downloadImage, imageUrl, imageType };

// Electron's net.fetch cancels manual redirects rather than returning their headers.
// Use net.request for remote images so every redirect can be validated explicitly.
function createNetImageFetch(net) {
  return (url, options) => {
    if (url.startsWith('app://force-exam/')) return net.fetch(url, { ...options, redirect: 'error' });
    return new Promise((resolve, reject) => {
      const request = net.request({ url, method: 'GET', redirect: 'manual', credentials: 'omit', useSessionCookies: false });
      let finished = false;
      const cleanup = () => options.signal?.removeEventListener('abort', aborted);
      const fail = (error) => { if (finished) return; finished = true; cleanup(); reject(error); request.abort(); };
      const finish = (response) => { if (finished) return; finished = true; cleanup(); resolve(response); };
      const aborted = () => fail(options.signal.reason || new Error('Image download cancelled.'));
      if (options.signal?.aborted) return aborted();
      options.signal?.addEventListener('abort', aborted, { once: true });
      request.on('error', fail);
      request.on('redirect', (status, _method, location) => {
        finish(new Response(null, { status, headers: { location } }));
        request.abort();
      });
      request.on('response', (response) => {
        const headers = new Headers();
        for (const name of ['content-type', 'content-length']) {
          const value = response.headers[name];
          if (value) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
        }
        if (Number(headers.get('content-length')) > MAX_IMAGE_BYTES) return fail(new Error('The image is too large to embed (maximum 8 MB).'));
        const chunks = [];
        let total = 0;
        response.on('error', fail);
        response.on('data', (chunk) => {
          if (finished) return;
          total += chunk.length;
          if (total > MAX_IMAGE_BYTES) return fail(new Error('The image is too large to embed (maximum 8 MB).'));
          chunks.push(Buffer.from(chunk));
        });
        response.on('end', () => {
          if (finished) return;
          try { finish(new Response(Buffer.concat(chunks), { status: response.statusCode, headers })); }
          catch (error) { fail(error); }
        });
      });
      request.end();
    });
  };
}
module.exports.createNetImageFetch = createNetImageFetch;
