import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { embedExamImages } from '../lib/portable.ts';
const { downloadImage } = createRequire(import.meta.url)('../desktop/images.cjs');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aJ1sAAAAASUVORK5CYII=', 'base64');
const embedded = `data:image/png;base64,${png.toString('base64')}`;

test('downloads image bytes without cookies and follows HTTP redirects', async () => {
  const calls = [];
  const result = await downloadImage('https://example.test/start', async (url, options) => {
    calls.push(url); assert.equal(options.credentials, 'omit'); assert.equal(options.redirect, 'manual');
    return calls.length === 1 ? new Response(null, { status: 302, headers: { location: '/image.png' } }) : new Response(png, { headers: { 'content-type': 'image/png' } });
  });
  assert.equal(result, embedded);
  assert.deepEqual(calls, ['https://example.test/start', 'https://example.test/image.png']);
});
test('rejects non-image pages, errors, unsafe redirects, and oversized bodies', async () => {
  await assert.rejects(downloadImage('file:///tmp/image.png', async () => new Response(png)));
  await assert.rejects(downloadImage('https://example.test/x', async () => new Response(null, { status: 302, headers: { location: 'file:///tmp/private' } })));
  await assert.rejects(downloadImage('https://example.test/x', async () => new Response('Not an image', { headers: { 'content-type': 'image/png' } })), /supported image/);
  await assert.rejects(downloadImage('https://example.test/x', async () => new Response('missing', { status: 404 })), /HTTP 404/);
  await assert.rejects(downloadImage('https://example.test/x', async () => new Response(png), { maxBytes: 4 }), /too large/);
  await assert.rejects(downloadImage('https://example.test/x', async () => new Response(png, { headers: { 'content-length': '999' } }), { maxBytes: 100 }), /too large/);
});
test('timeouts report a useful download error', async () => {
  await assert.rejects(downloadImage('https://example.test/x', async (_url, options) => {
    await new Promise(resolve => setTimeout(resolve, 20));
    options.signal.throwIfAborted();
  }, { timeoutMs: 1 }), /timed out/);
});
test('embeds question/answer media and legacy aliases, preserves captions, and deduplicates URLs', async () => {
  const url = 'https://example.test/picture.png';
  const original = { title: 'Portable', questions: [{ question: 'Which?', imageUrl: url,
    questionImageUrls: [url], images: [{ src: url, alt: 'Alt', caption: 'Caption' }],
    options: [{ text: 'A', image: { url, description: 'Answer caption' } }, { text: 'B', images: [embedded] }], answer: 0 }] };
  let requests = 0;
  const result = await embedExamImages(JSON.stringify(original), async () => { requests++; return embedded; });
  assert.equal(requests, 1); assert.equal(result.downloaded, 1); assert.equal(result.count, 4);
  const exam = JSON.parse(result.json);
  assert.equal(exam.questions[0].images[0].src, embedded);
  assert.equal(exam.questions[0].images[0].caption, 'Caption');
  assert.equal(exam.questions[0].options[0].image.description, 'Answer caption');
  assert.equal(exam.questions[0].options[0].image.url, embedded);
  assert.equal(original.questions[0].imageUrl, url);
  const second = await embedExamImages(result.json, async () => { throw Error('Offline'); });
  assert.equal(second.count, 0);
});
test('failed embedding leaves the original exam intact and never returns a partial file', async () => {
  const json = JSON.stringify({ title: 'Original', questions: [{ question: 'Q', images: ['https://example.test/one.png', 'https://example.test/two.png'] }] });
  await assert.rejects(embedExamImages(json, async (url) => { if (url.endsWith('two.png')) throw Error('Download failed'); return embedded; }), /Download failed/);
  assert.equal(JSON.parse(json).questions[0].images[0], 'https://example.test/one.png');
});
