import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config(); // Fallback to .env
import http from 'http';
import { resolve, join } from 'path';
import { existsSync } from 'fs';
import { pathToFileURL } from 'url';

const PORT = 3005;
const API_DIR = resolve(process.cwd(), 'api');

const server = http.createServer(async (req, res) => {
    // Basic CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const url = new URL(req.url || '', `http://localhost:${PORT}`);
    const pathname = url.pathname;

    // Map /api/name to api/name.ts
    const handlerName = pathname.replace('/api/', '');
    const handlerPath = join(API_DIR, `${handlerName}.ts`);

    if (!existsSync(handlerPath)) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `API route ${pathname} not found` }));
        return;
    }

    try {
        // Parse body for POST requests
        let body = '';
        if (req.method === 'POST') {
            const chunks = [];
            for await (const chunk of req) {
                chunks.push(chunk);
            }
            body = Buffer.concat(chunks).toString();
        }

        const mockReq = {
            method: req.method,
            body: body ? JSON.parse(body) : {},
            headers: req.headers,
            query: Object.fromEntries(url.searchParams)
        };

        const mockRes = {
            status: (code: number) => {
                res.statusCode = code;
                return mockRes;
            },
            json: (data: any) => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
                return mockRes;
            },
            setHeader: (name: string, value: string) => {
                res.setHeader(name, value);
                return mockRes;
            },
            end: () => res.end(),
            send: (data: any) => res.end(data)
        };

        // Use pathToFileURL for Windows compatibility with ESM imports
        // Append timestamp to bust Node's module cache on every request (dev hot-reload)
        const moduleUrl = pathToFileURL(handlerPath).href + `?t=${Date.now()}`;
        const handler = await import(moduleUrl);

        console.log(`[API] ${req.method} ${pathname}`);
        await (handler.default || handler)(mockReq, mockRes);
    } catch (error: any) {
        console.error(`[API ERROR] ${pathname}:`, error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal Server Error', details: error.message }));
    }
});

server.listen(PORT, () => {
    console.log(`🚀 Local API Dev Server running at http://localhost:${PORT}`);
    console.log(`📁 Mapping /api/* to ${API_DIR}/*.ts`);
});
