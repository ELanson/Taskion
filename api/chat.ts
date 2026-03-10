import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { VertexAI } from '@google-cloud/vertexai';
// Import server-side file cache from upload-file handler
// (works because both run in the same Node.js process in dev + serverless)
import { fileCache } from './upload-file';

// Core Supabase Config
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase credentials missing in Serverless Function");
}

// Load Vertex AI Credentials securely
let vertexConfig: any = null;
try {
    if (process.env.VERTEX_CREDENTIALS) {
        vertexConfig = JSON.parse(process.env.VERTEX_CREDENTIALS);
    } else {
        const configPath = path.resolve(process.cwd(), '.env.vertex.json');
        if (fs.existsSync(configPath)) {
            vertexConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
    }
} catch (e) {
    console.warn("Failed to load Vertex AI credentials:", e);
}

function getVertexAI() {
    if (!vertexConfig) throw new Error("Vertex AI credentials not configured");
    return new VertexAI({
        project: vertexConfig.project_id,
        location: 'us-central1',
        googleAuthOptions: {
            credentials: {
                client_email: vertexConfig.client_email,
                private_key: vertexConfig.private_key
            }
        }
    });
}

const SYSTEM_PROMPT = `You are Yukime, the Work Intelligence Agent for TICKEL.
TICKEL has been developed by the team at Rickel Industries. Rickel Industries is a design-first, tech-centric creative and digital solutions studio that blends artistry with functional systems and web technology to help brands express themselves and thrive online. Our expertise spans strategic visual branding, motion and graphic design, product interfaces, and end-to-end digital experiences that go beyond surface aesthetics to solve real business needs.

Today is ${new Date().toISOString().split('T')[0]}. Current time: ${new Date().toTimeString().slice(0, 5)}.

## YOUR CAPABILITIES
You CAN — and MUST — do all of the following using the provided tools. Never say you cannot.
- Create tasks with any combination of: title, description, project, status, priority, start date/time, due date/time, assignee, estimated hours
- Update any field on any task
- Delete tasks (requires explicit user confirmation)
- Create, update, delete projects
- Log time on tasks
- Assign tasks to specific team members
- Generate work reports and productivity summaries using the user's real data

## TASK CREATION RULES
1. ALWAYS call get_projects first to resolve the project name to a UUID. Never invent a project_id.
2. If the user does not specify a field, use these defaults silently:
   - priority → "medium"
   - status → "todo"
   - start_date → today (${new Date().toISOString().split('T')[0]})
3. Notify the user in your final reply about which fields were missing and what defaults were applied. Example: "I've created the task. I used default priority (Medium) and status (To-Do) since you didn't specify them."
4. If the user did not mention a project, pick the most recently active project from get_projects result. If get_projects returns an empty list, YOU MUST call create_project with name="General" and status="active" first, then use its ID.

## TIME & DATE RULES
- "today" = ${new Date().toISOString().split('T')[0]}
- "tomorrow" = ${new Date(Date.now() + 86400000).toISOString().split('T')[0]}
- "8:30am" → use start_time = "08:30", "5:30pm" → due_time = "17:30"
- Always store date in YYYY-MM-DD, time in HH:MM (24h).

## UPDATE & DELETE RULES
- For updates: call get_tasks first to find the task UUID, then update_task.
- For deletes: call get_tasks first to confirm the task exists. Then ask the user for confirmation. Only call delete_task with confirmed=true AFTER user says yes.

## REPORT GENERATION
- When asked for a report: call get_tasks, get_projects, and get_metrics to gather real data.
- Synthesize a structured report from the actual data. Include: total tasks, completed vs pending, overdue items, hours logged, and any notable patterns.
- Format reports clearly with headers and bullet points.

## STYLE
- Be professional, warm, concise. Confirm what you did. Don't ask for permission on non-destructive actions.
- Never reveal internal tool calls, UUIDs, or raw JSON to the user.
- [DOCUMENT INTELLIGENCE]: When a user uploads a document (PDF, Excel, Word, Image):
    1. Analyze the content deeply based on the user's query.
    2. If the document contains a list of tasks, action items, or a table of work:
       - DO NOT just list them. Proactively extract them.
       - FOR EACH task found, call the \`create_task\` tool. 
       - If some fields are missing (like project), use the defaults specified in the TASK CREATION RULES.
       - Summarize what you created in your final response.`;

const toolDeclarations = [
    {
        name: "create_task",
        description: "Create a new task in the system. You CAN set status, start/due dates, times, priority, and assign to a user.",
        parameters: {
            type: 'OBJECT',
            properties: {
                title: { type: 'STRING', description: "Task title" },
                description: { type: 'STRING', description: "Task description" },
                project_id: { type: 'STRING', description: "Project ID (UUID). Use get_projects to find the correct ID." },
                status: { type: 'STRING', enum: ["todo", "in_progress", "done", "blocked"], description: "Task status. Default is 'todo'." },
                priority: { type: 'STRING', enum: ["low", "medium", "high", "urgent"], description: "Task priority. Default is 'medium'." },
                due_date: { type: 'STRING', description: "Due date in YYYY-MM-DD format. E.g. '2025-03-15'. Today is: " + new Date().toISOString().split('T')[0] },
                start_date: { type: 'STRING', description: "Start date in YYYY-MM-DD format." },
                due_time: { type: 'STRING', description: "Due time in HH:MM 24-hour format, e.g. '17:30'" },
                start_time: { type: 'STRING', description: "Start time in HH:MM 24-hour format, e.g. '08:30'" },
                estimated_hours: { type: 'NUMBER', description: "Estimated hours to complete the task" },
                assignee_id: { type: 'STRING', description: "UUID of the user to assign this task to. Use get_team_members to look up IDs. Omit to leave unassigned." }
            },
            required: ["title"]
        }
    },
    {
        name: "update_task",
        description: "Update an existing task. Can change any field including status, dates, times, assignee, priority, or description.",
        parameters: {
            type: 'OBJECT',
            properties: {
                task_id: { type: 'STRING', description: "Task ID (UUID)" },
                title: { type: 'STRING', description: "New task title" },
                description: { type: 'STRING', description: "New task description" },
                status: { type: 'STRING', enum: ["todo", "in_progress", "done", "blocked"] },
                priority: { type: 'STRING', enum: ["low", "medium", "high", "urgent"] },
                due_date: { type: 'STRING', description: "Due date in YYYY-MM-DD format" },
                start_date: { type: 'STRING', description: "Start date in YYYY-MM-DD format" },
                due_time: { type: 'STRING', description: "Due time in HH:MM 24-hour format" },
                start_time: { type: 'STRING', description: "Start time in HH:MM 24-hour format" },
                estimated_hours: { type: 'NUMBER' },
                assignee_id: { type: 'STRING', description: "UUID of the user to assign this task to" }
            },
            required: ["task_id"]
        }
    },
    {
        name: "delete_task",
        description: "Delete a task. Requires explicit user confirmation.",
        parameters: {
            type: 'OBJECT',
            properties: {
                task_id: { type: 'STRING' },
                confirmed: { type: 'BOOLEAN', description: "Must be true. Only set after user explicitly confirms." }
            },
            required: ["task_id", "confirmed"]
        }
    },
    {
        name: "create_project",
        description: "Create a new project.",
        parameters: {
            type: 'OBJECT',
            properties: {
                name: { type: 'STRING' },
                description: { type: 'STRING' },
                status: { type: 'STRING', enum: ["active", "on_hold", "completed", "archived"], description: "Project status. Default is 'active'." }
            },
            required: ["name"]
        }
    },
    {
        name: "update_project",
        description: "Update an existing project.",
        parameters: {
            type: 'OBJECT',
            properties: {
                project_id: { type: 'STRING', description: "Project ID (UUID)" },
                name: { type: 'STRING' },
                description: { type: 'STRING' },
                status: { type: 'STRING', enum: ["active", "on_hold", "completed", "archived"] }
            },
            required: ["project_id"]
        }
    },
    {
        name: "delete_project",
        description: "Delete a project and its tasks. Requires user confirmation.",
        parameters: {
            type: 'OBJECT',
            properties: {
                project_id: { type: 'STRING' },
                confirmed: { type: 'BOOLEAN', description: "Must be true after user explicitly confirms." }
            },
            required: ["project_id", "confirmed"]
        }
    },
    {
        name: "log_time",
        description: "Log time worked on a task.",
        parameters: {
            type: 'OBJECT',
            properties: {
                task_id: { type: 'STRING', description: "Task ID (UUID)" },
                hours: { type: 'NUMBER', description: "Hours worked" },
                date: { type: 'STRING', description: "Date in YYYY-MM-DD format. Defaults to today." }
            },
            required: ["task_id", "hours"]
        }
    },
    {
        name: "get_tasks",
        description: "Retrieve all tasks from the system. Always call this before answering questions about tasks or before updating/deleting a task.",
        parameters: { type: 'OBJECT', properties: {} }
    },
    {
        name: "get_projects",
        description: "Retrieve all projects. Always call this before creating a task to get the correct project_id, or before answering project questions.",
        parameters: { type: 'OBJECT', properties: {} }
    },
    {
        name: "get_team_members",
        description: "Retrieve all team members and their user IDs. Use this before assigning a task to someone.",
        parameters: { type: 'OBJECT', properties: {} }
    },
    {
        name: "undo_last_action",
        description: "Undo the most recent AI action.",
        parameters: { type: 'OBJECT', properties: {} }
    },
    {
        name: "get_metrics",
        description: "Get overall work metrics such as total hours logged.",
        parameters: { type: 'OBJECT', properties: {} }
    }
];

const LOG_FILE = 'C:/Users/erick/.gemini/antigravity/brain/de1683c4-3228-415c-81c4-f1102d5e8d97/debug_api.log';
function fileLog(msg: string) {
    const time = new Date().toISOString();
    try {
        fs.appendFileSync(LOG_FILE, `[${time}] ${msg}\n`);
    } catch (e) {
        console.error("Failed to write to debug_api.log:", e);
    }
}

export default async function handler(req: any, res: any) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Initialize Request-Scoped Supabase Client
    let supabase = createClient(supabaseUrl!, supabaseKey!);
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        if (token && token !== 'undefined' && token !== 'null') {
            supabase = createClient(supabaseUrl!, supabaseKey!, {
                global: { headers: { Authorization: `Bearer ${token}` } }
            });
        }
    }

    try {
        const { message, history, systemPrompt: customSystemPrompt, userId: rawUserId, userRole, fileData, fileUri, fileHash, mimeType } = req.body;
        const userId = rawUserId || 'anonymous';
        fileLog(`[API] Start - userId: ${userId}, msg: "${message?.slice(0, 50)}"`);
        console.log(`[API] userId: ${userId}, msg: "${message?.slice(0, 50)}"`);
        if (!message) return res.status(400).json({ error: "Message is required" });

        const today = new Date().toISOString().split('T')[0];
        const currentTime = new Date().toTimeString().slice(0, 5);
        const dynamicPrompt = `Today is ${today}. Current time: ${currentTime}.`;

        if (!vertexConfig) {
            return res.status(500).json({ error: "Vertex AI credentials (.env.vertex.json) not found on server" });
        }

        const activeSystemPrompt = (customSystemPrompt || SYSTEM_PROMPT) + "\n\n" + dynamicPrompt;

        // Determine model from workspace settings
        const { data: settings } = await supabase.from('workspace_settings').select('cloud_ai_model').limit(1).single();
        const targetModel = settings?.cloud_ai_model || 'gemini-2.5-pro';
        fileLog(`[API] Model: ${targetModel}`);

        // Build conversation contents
        const contents: any[] = [];
        if (history && Array.isArray(history)) {
            for (const msg of history) {
                if (msg.role === 'user') contents.push({ role: 'user', parts: [{ text: msg.content }] });
                else if (msg.role === 'assistant' || msg.role === 'model') contents.push({ role: 'model', parts: [{ text: msg.content }] });
            }
        }
        const userParts: any[] = [{ text: message }];
        if (fileUri && mimeType) {
            // Vertex fileUri (gs:// or Files API URI)
            userParts.push({ fileData: { fileUri, mimeType } });
            fileLog(`[API] Using fileUri: ${fileUri}`);
        } else if (fileHash) {
            // Look up cached bytes by SHA-256 hash (uploaded via /api/upload-file)
            const cached = fileCache.get(fileHash);
            if (cached) {
                userParts.push({ inlineData: { data: cached.data, mimeType: cached.mimeType } });
                fileLog(`[API] CACHE HIT for fileHash ${fileHash.slice(0, 8)}… (${(cached.data.length * 0.75 / 1024).toFixed(0)} KB)`);
                console.log(`[API] Using cached file "${cached.fileName}" via hash`);
            } else {
                fileLog(`[API] CACHE MISS for fileHash ${fileHash.slice(0, 8)}… — file not found`);
                console.warn(`[API] fileHash ${fileHash.slice(0, 8)}… not in cache — file may have been lost on server restart`);
            }
        } else if (fileData && mimeType) {
            // Legacy fallback: inline base64 (used on first upload or if cache is cold)
            userParts.push({ inlineData: { data: fileData, mimeType } });
            fileLog(`[API] Using inline inlineData (${(fileData.length * 0.75 / 1024).toFixed(0)} KB)`);
        }
        contents.push({ role: 'user', parts: userParts });

        const vertexAI = getVertexAI();
        const model = vertexAI.getGenerativeModel({
            model: targetModel,
            systemInstruction: { role: 'system', parts: [{ text: activeSystemPrompt }] },
            tools: [{ functionDeclarations: toolDeclarations as any }]
        });

        // ── Tool helpers ────────────────────────────────────────────────────────
        const sanitize = (obj: any) => {
            const r = { ...obj };
            for (const k in r) { if (r[k] === '') r[k] = null; }
            return r;
        };

        const execTool = async (name: string, args: any): Promise<any> => {
            switch (name) {
                case 'create_task': {
                    const a = sanitize(args);
                    if (a.start_date && a.start_time) a.start_date = `${a.start_date.split('T')[0]}T${a.start_time}:00`;
                    else if (a.start_time) a.start_date = `${today}T${a.start_time}:00`;
                    if (a.due_date && a.due_time) a.due_date = `${a.due_date.split('T')[0]}T${a.due_time}:00`;
                    else if (a.due_time) a.due_date = `${today}T${a.due_time}:00`;
                    delete a.start_time; delete a.due_time;
                    const td = { ...a, user_id: userId };
                    if (td.project_id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(td.project_id)) {
                        const { data: p } = await supabase.from('projects').select('id').ilike('name', td.project_id.trim()).is('deleted_at', null).limit(1).single();
                        if (p) td.project_id = p.id;
                        else {
                            const { data: rp } = await supabase.from('projects').select('id').is('deleted_at', null).order('created_at', { ascending: false }).limit(1).single();
                            if (rp) td.project_id = rp.id;
                        }
                    }
                    const { error, data } = await supabase.from('tasks').insert([td]).select();
                    const r = error ? { error: error.message } : { success: true, task: data[0] };
                    await supabase.from('ai_action_logs').insert([{ action_type: 'create_task', details: args, outcome: r, user_id: userId }]);
                    return r;
                }
                case 'update_task': {
                    const u = sanitize(args); const { task_id } = u; delete u.task_id;
                    if (u.start_date && u.start_time) u.start_date = `${u.start_date.split('T')[0]}T${u.start_time}:00`;
                    if (u.due_date && u.due_time) u.due_date = `${u.due_date.split('T')[0]}T${u.due_time}:00`;
                    delete u.start_time; delete u.due_time;
                    if (u.project_id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(u.project_id)) {
                        const { data: p } = await supabase.from('projects').select('id').ilike('name', u.project_id.trim()).is('deleted_at', null).limit(1).single();
                        if (p) u.project_id = p.id; else delete u.project_id;
                    }
                    const { error } = await supabase.from('tasks').update(u).eq('id', task_id);
                    const r = error ? { error: error.message } : { success: true };
                    await supabase.from('ai_action_logs').insert([{ action_type: 'update_task', details: args, outcome: r, user_id: userId }]);
                    return r;
                }
                case 'delete_task': {
                    if (!args.confirmed) return { success: false, error: "Confirmation required." };
                    const { error } = await supabase.from('tasks').update({ deleted_at: new Date().toISOString() }).eq('id', args.task_id);
                    const r = error ? { error: error.message } : { success: true };
                    await supabase.from('ai_action_logs').insert([{ action_type: 'delete_task', details: args, outcome: r, user_id: userId }]);
                    return r;
                }
                case 'create_project': {
                    const pd = { ...sanitize(args), user_id: userId };
                    const { error, data } = await supabase.from('projects').insert([pd]).select();
                    const r = error ? { error: error.message } : { success: true, project: data[0] };
                    await supabase.from('ai_action_logs').insert([{ action_type: 'create_project', details: args, outcome: r, user_id: userId }]);
                    return r;
                }
                case 'update_project': {
                    const { project_id, ...updates } = sanitize(args);
                    const { error } = await supabase.from('projects').update(updates).eq('id', project_id);
                    const r = error ? { error: error.message } : { success: true };
                    await supabase.from('ai_action_logs').insert([{ action_type: 'update_project', details: args, outcome: r, user_id: userId }]);
                    return r;
                }
                case 'delete_project': {
                    if (!args.confirmed) return { success: false, error: "Confirmation required." };
                    const { data: tasks } = await supabase.from('tasks').select('id').eq('project_id', args.project_id).is('deleted_at', null);
                    const { error } = await supabase.from('projects').update({ deleted_at: new Date().toISOString() }).eq('id', args.project_id);
                    await supabase.from('tasks').update({ deleted_at: new Date().toISOString() }).eq('project_id', args.project_id).is('deleted_at', null);
                    const r = error ? { error: "Failed to delete project" } : { success: true, deleted_task_ids: tasks?.map((t: any) => t.id) };
                    await supabase.from('ai_action_logs').insert([{ action_type: 'delete_project', details: args, outcome: r, user_id: userId }]);
                    return r;
                }
                case 'log_time': {
                    const entry = { task_id: args.task_id, hours: args.hours, date: args.date || today, user_id: userId };
                    const { error } = await supabase.from('time_logs').insert([entry]);
                    const r = error ? { error: error.message } : { success: true };
                    await supabase.from('ai_action_logs').insert([{ action_type: 'log_time', details: args, outcome: r, user_id: userId }]);
                    return r;
                }
                case 'get_tasks': {
                    const { data, error } = await supabase.from('tasks').select('*, projects(name)').eq('user_id', userId).is('deleted_at', null).order('created_at', { ascending: false });
                    return error ? { error: error.message } : { tasks: data };
                }
                case 'get_projects': {
                    const { data, error } = await supabase.from('projects').select('*').eq('user_id', userId).is('deleted_at', null).order('created_at', { ascending: false });
                    return error ? { error: error.message } : { projects: data };
                }
                case 'get_team_members': {
                    const { data, error } = await supabase.from('profiles').select('id, full_name, global_role, email').order('full_name');
                    return error ? { error: error.message } : { team_members: data };
                }
                case 'get_metrics': {
                    const { data, error } = await supabase.from('time_logs').select('hours');
                    const totalHours = data?.reduce((s: number, l: any) => s + (l.hours || 0), 0) || 0;
                    return error ? { error: error.message } : { total_hours_logged: totalHours };
                }
                case 'undo_last_action': {
                    const { data: lastLog, error } = await supabase.from('ai_action_logs').select('*').order('timestamp', { ascending: false }).limit(1).single();
                    if (error || !lastLog) return { success: false, error: "No actions found to undo." };
                    const { action_type, details, outcome } = lastLog as any;
                    try {
                        if (action_type === 'create_task') await supabase.from('tasks').delete().eq('id', outcome.task.id);
                        else if (action_type === 'delete_task') await supabase.from('tasks').update({ deleted_at: null }).eq('id', details.task_id);
                        else if (action_type === 'create_project') await supabase.from('projects').delete().eq('id', outcome.project.id);
                        else if (action_type === 'delete_project') {
                            await supabase.from('projects').update({ deleted_at: null }).eq('id', details.project_id);
                            if (outcome.deleted_task_ids?.length > 0) await supabase.from('tasks').update({ deleted_at: null }).in('id', outcome.deleted_task_ids);
                        } else if (action_type === 'log_time') {
                            await supabase.from('time_logs').delete().eq('task_id', details.task_id).eq('hours', details.hours).match({ date: details.date });
                        }
                        await supabase.from('ai_action_logs').delete().eq('id', lastLog.id);
                        return { success: true, message: `Undid the last ${action_type} action.` };
                    } catch (e: any) {
                        return { success: false, error: `Undo failed: ${e.message}` };
                    }
                }
                default:
                    return { error: "Unknown tool" };
            }
        };

        // ── Multi-turn agentic loop ─────────────────────────────────────────────
        // TOOL TURNS: blocking generateContent (function calls can't be streamed).
        // FINAL TEXT TURN: generateContentStream → SSE to client for instant feel.
        const MUTATION_TOOLS = new Set(['create_task', 'update_task', 'delete_task', 'create_project', 'update_project', 'delete_project', 'log_time']);
        let currentContents = [...contents];
        let loopCount = 0;
        const MAX_LOOPS = 5;
        let didMutateFromTools = false;

        while (loopCount < MAX_LOOPS) {
            loopCount++;
            fileLog(`[API] Turn ${loopCount}`);

            let result;
            try {
                result = await model.generateContent({ contents: currentContents });
            } catch (gemError: any) {
                fileLog(`[GEMINI ERROR] ${gemError.message}`);
                throw gemError;
            }

            const response = await result.response;
            const part = response.candidates?.[0]?.content?.parts?.[0];

            // ── Function call → execute and continue loop ──────────────────────
            if (part?.functionCall) {
                const { name, args } = part.functionCall;
                console.log(`[TOOL] Turn ${loopCount}: ${name}`);
                if (MUTATION_TOOLS.has(name)) didMutateFromTools = true;

                let toolResult: any;
                try {
                    toolResult = await execTool(name, args);
                } catch (e: any) {
                    console.error(`[TOOL ERROR] ${name}:`, e.message);
                    toolResult = { error: e.message };
                }

                currentContents.push({ role: 'model', parts: [{ functionCall: part.functionCall }] });
                currentContents.push({ role: 'user', parts: [{ functionResponse: { name, response: toolResult } }] });
                continue;
            }

            // ── Final text turn: stream back as SSE ────────────────────────────
            console.log(`[API] Turn ${loopCount} is final text — starting SSE stream`);
            fileLog(`[API] SSE stream start`);

            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders();

            const sse = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

            try {
                const streamResult = await model.generateContentStream({ contents: currentContents });
                let fullText = '';
                for await (const chunk of streamResult.stream) {
                    const token = chunk.candidates?.[0]?.content?.parts?.[0]?.text || '';
                    if (token) { fullText += token; sse({ token, done: false }); }
                }
                sse({ done: true, didMutate: didMutateFromTools });
                console.log(`[API] SSE done. ${fullText.length} chars.`);
                fileLog(`[API] SSE complete`);
            } catch (streamErr: any) {
                // Fallback: send whatever the non-streamed turn returned
                fileLog(`[SSE ERROR] ${streamErr.message} — using fallback`);
                sse({ token: part?.text || 'I processed your request.', done: false });
                sse({ done: true, didMutate: didMutateFromTools });
            }

            res.end();
            return;
        }

        return res.status(500).json({ error: "Maximum tool execution turns reached." });

    } catch (error: any) {
        console.error('[API ERROR]', error.message);
        if (!res.headersSent) {
            return res.status(500).json({ error: "Internal server error", details: error.message });
        }
        res.end();
    }
}
