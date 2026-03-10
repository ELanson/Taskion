/**
 * api/upload-file.ts
 * 
 * Server-side file content cache.
 * 
 * Strategy: The frontend sends a SHA-256 hash of the file's base64 content.
 * The server stores { hash → { data, mimeType } } in a process-level Map.
 * On a cache hit the chat endpoint can retrieve the file by hash alone — no
 * re-transmission of the base64 bytes needed.
 *
 * Cache lifetime: the file stays in memory until the server restarts.
 * This is fine for a dev/production server that runs continuously.
 * On restart users simply re-upload (the UI still works; it just re-populates the cache).
 */

import crypto from 'crypto';

// Process-level cache: hash → { data, mimeType, fileName }
// Exported so chat.ts can look up files by hash.
export const fileCache = new Map<string, { data: string; mimeType: string; fileName: string }>();

export default async function handler(req: any, res: any) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { fileData, mimeType, fileName = 'uploaded-file' } = req.body;
        if (!fileData || !mimeType) {
            return res.status(400).json({ error: 'fileData and mimeType are required' });
        }

        // Compute SHA-256 of the base64 string — this is the cache key
        const hash = crypto.createHash('sha256').update(fileData).digest('hex');
        const existing = fileCache.get(hash);

        if (existing) {
            console.log(`[upload-file] CACHE HIT "${fileName}" (${hash.slice(0, 8)}…)`);
            return res.json({ fileHash: hash, mimeType: existing.mimeType, cached: true });
        }

        // Store in cache
        fileCache.set(hash, { data: fileData, mimeType, fileName });
        console.log(`[upload-file] CACHE MISS — stored "${fileName}" (${(fileData.length * 0.75 / 1024).toFixed(0)} KB, hash: ${hash.slice(0, 8)}…)`);

        return res.json({ fileHash: hash, mimeType, cached: false });
    } catch (err: any) {
        console.error('[upload-file] Error:', err.message);
        return res.status(500).json({ error: err.message });
    }
}
