import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { VertexAI } from '@google-cloud/vertexai';

// Core Supabase Config (Singletons for config only)
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

// Global Vertex instance (will be initialized per request to handle credentials reliably)
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
- Never reveal internal tool calls, UUIDs, or raw JSON to the user.`;

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
        const { message, history, systemPrompt: customSystemPrompt, userId: rawUserId, userRole } = req.body;
        const userId = rawUserId || 'anonymous';
        fileLog(`[API] Start Request - userId: ${userId}, message: "${message?.slice(0, 50)}..."`);
        console.log(`[API] Received request from userId: ${userId}, message: "${message?.slice(0, 50)}..."`);
        if (!message) return res.status(400).json({ error: "Message is required" });

        const today = new Date().toISOString().split('T')[0];
        const currentTime = new Date().toTimeString().slice(0, 5);
        const dynamicPrompt = `Today is ${today}. Current time: ${currentTime}.`;

        if (!vertexConfig) {
            return res.status(500).json({ error: "Vertex AI credentials (.env.vertex.json) not found on server" });
        }

        // Use role-specific system prompt if provided (e.g. from Support AI), otherwise use default Yukime prompt
        const activeSystemPrompt = (customSystemPrompt || SYSTEM_PROMPT) + "\n\n" + dynamicPrompt;

        // Determine model from workspace settings
        const { data: settings } = await supabase.from('workspace_settings').select('cloud_ai_model').limit(1).single();
        const targetModel = settings?.cloud_ai_model || 'gemini-2.5-pro';

        fileLog(`[API] Using model: ${targetModel}`);
        console.log(`[API] Using model: ${targetModel}`);

        // Build conversation contents with full history for multi-turn context
        const contents: any[] = [];
        if (history && Array.isArray(history)) {
            for (const msg of history) {
                if (msg.role === 'user') contents.push({ role: 'user', parts: [{ text: msg.content }] });
                else if (msg.role === 'assistant' || msg.role === 'model') contents.push({ role: 'model', parts: [{ text: msg.content }] });
            }
        }
        contents.push({ role: 'user', parts: [{ text: message }] });

        // Multi-turn tool execution loop
        const vertexAI = getVertexAI();
        const model = vertexAI.getGenerativeModel({
            model: targetModel,
            systemInstruction: { role: 'system', parts: [{ text: activeSystemPrompt }] },
            tools: [{ functionDeclarations: toolDeclarations as any }]
        });

        let currentContents = [...contents];
        let loopCount = 0;
        const MAX_LOOPS = 5;
        let didMutateFromTools = false;

        while (loopCount < MAX_LOOPS) {
            loopCount++;
            fileLog(`[API] Gemini Turn ${loopCount}`);
            console.log(`[API] Gemini Turn ${loopCount}...`);

            let result;
            try {
                result = await model.generateContent({ contents: currentContents });
            } catch (gemError: any) {
                fileLog(`[GEMINI SDK ERROR] ${gemError.message}`);
                console.error(`[GEMINI SDK ERROR]:`, gemError);
                throw gemError;
            }
            const response = await result.response;
            const candidate = response.candidates?.[0];
            const part = candidate?.content?.parts?.[0];

            if (part?.functionCall) {
                const { name, args } = part.functionCall;
                console.log(`[AI TOOL CALL] Turn ${loopCount}: ${name}`);

                if (['create_task', 'update_task', 'delete_task', 'create_project', 'update_project', 'delete_project', 'log_time'].includes(name)) {
                    didMutateFromTools = true;
                }

                const sanitize = (obj: any) => {
                    const res = { ...obj };
                    for (const key in res) {
                        if (res[key] === '') res[key] = null;
                    }
                    return res;
                };

                const tools: Record<string, (args: any) => Promise<any>> = {
                    create_task: async (a) => {
                        const taskData = { ...sanitize(a), user_id: userId };
                        if (taskData.project_id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(taskData.project_id)) {
                            const { data: proj } = await supabase.from('projects').select('id').ilike('name', taskData.project_id.trim()).is('deleted_at', null).limit(1).single();
                            if (proj) taskData.project_id = proj.id;
                            else {
                                const { data: recentProj } = await supabase.from('projects').select('id').is('deleted_at', null).order('created_at', { ascending: false }).limit(1).single();
                                if (recentProj) taskData.project_id = recentProj.id;
                            }
                        }
                        const { error, data } = await supabase.from('tasks').insert([taskData]).select();
                        const r = error ? { error: error.message, hint: "Check project_id." } : { success: true, task: data[0] };
                        await supabase.from('ai_action_logs').insert([{ action_type: 'create_task', details: a, outcome: r, user_id: userId }]);
                        return r;
                    },
                    update_task: async (a) => {
                        const updates = sanitize(a);
                        const { task_id } = updates;
                        delete (updates as any).task_id;
                        if (updates.project_id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(updates.project_id)) {
                            const { data: proj } = await supabase.from('projects').select('id').ilike('name', updates.project_id.trim()).is('deleted_at', null).limit(1).single();
                            if (proj) updates.project_id = proj.id;
                            else delete updates.project_id;
                        }
                        const { error } = await supabase.from('tasks').update(updates).eq('id', task_id);
                        const r = error ? { error: error.message, hint: "Verify task_id." } : { success: true };
                        await supabase.from('ai_action_logs').insert([{ action_type: 'update_task', details: a, outcome: r, user_id: userId }]);
                        return r;
                    },
                    delete_task: async (a) => {
                        if (!a.confirmed) return { success: false, error: "Confirmation required." };
                        const { error } = await supabase.from('tasks').update({ deleted_at: new Date().toISOString() }).eq('id', a.task_id);
                        const r = error ? { error: error.message } : { success: true };
                        await supabase.from('ai_action_logs').insert([{ action_type: 'delete_task', details: a, outcome: r, user_id: userId }]);
                        return r;
                    },
                    create_project: async (a) => {
                        const projectData = { ...sanitize(a), user_id: userId };
                        const { error, data } = await supabase.from('projects').insert([projectData]).select();
                        const r = error ? { error: error.message } : { success: true, project: data[0] };
                        await supabase.from('ai_action_logs').insert([{ action_type: 'create_project', details: a, outcome: r, user_id: userId }]);
                        return r;
                    },
                    update_project: async (a) => {
                        const { project_id, ...updates } = sanitize(a);
                        const { error } = await supabase.from('projects').update(updates).eq('id', project_id);
                        const r = error ? { error: error.message } : { success: true };
                        await supabase.from('ai_action_logs').insert([{ action_type: 'update_project', details: a, outcome: r, user_id: userId }]);
                        return r;
                    },
                    delete_project: async (a) => {
                        if (!a.confirmed) return { success: false, error: "Confirmation required." };
                        const { data: tasks } = await supabase.from('tasks').select('id').eq('project_id', a.project_id).is('deleted_at', null);
                        const { error: err1 } = await supabase.from('projects').update({ deleted_at: new Date().toISOString() }).eq('id', a.project_id);
                        await supabase.from('tasks').update({ deleted_at: new Date().toISOString() }).eq('project_id', a.project_id).is('deleted_at', null);
                        const r = err1 ? { error: "Failed to delete project" } : { success: true, deleted_task_ids: tasks?.map(t => t.id) };
                        await supabase.from('ai_action_logs').insert([{ action_type: 'delete_project', details: a, outcome: r, user_id: userId }]);
                        return r;
                    },
                    log_time: async (a) => {
                        const entry = { task_id: a.task_id, hours: a.hours, date: a.date || new Date().toISOString().split('T')[0], user_id: userId };
                        const { error } = await supabase.from('time_logs').insert([entry]);
                        const r = error ? { error: error.message } : { success: true };
                        await supabase.from('ai_action_logs').insert([{ action_type: 'log_time', details: a, outcome: r, user_id: userId }]);
                        return r;
                    },
                    get_tasks: async () => {
                        const { data, error } = await supabase.from('tasks').select('*, projects(name)').eq('user_id', userId).is('deleted_at', null).order('created_at', { ascending: false });
                        return error ? { error: error.message } : { tasks: data };
                    },
                    get_projects: async () => {
                        const { data, error } = await supabase.from('projects').select('*').eq('user_id', userId).is('deleted_at', null).order('created_at', { ascending: false });
                        return error ? { error: error.message } : { projects: data };
                    },
                    get_team_members: async () => {
                        const { data, error } = await supabase.from('profiles').select('id, full_name, global_role, email').order('full_name');
                        return error ? { error: error.message } : { team_members: data };
                    },
                    get_metrics: async () => {
                        const { data, error } = await supabase.from('time_logs').select('hours');
                        const totalHours = data?.reduce((sum, log) => sum + (log.hours || 0), 0) || 0;
                        return error ? { error: error.message } : { total_hours_logged: totalHours };
                    },
                    undo_last_action: async () => {
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
                };

                let toolResult: any;
                try {
                    toolResult = tools[name] ? await tools[name](args) : { error: "Unknown tool" };
                } catch (e: any) {
                    console.error(`[TOOL ERROR] ${name}:`, e.message);
                    toolResult = { error: e.message };
                }

                // Add tool call and response to history for the next turn
                currentContents.push({ role: 'model', parts: [{ functionCall: part.functionCall }] });
                currentContents.push({ role: 'user', parts: [{ functionResponse: { name, response: toolResult } }] });
                continue;
            }

            // If we reached here, Gemini returned text (or nothing)
            const finalReply = part?.text || (loopCount > 1 ? "I've processed your request." : "No response generated.");
            console.log(`[AI FINAL REPLY] "${finalReply.slice(0, 50)}..."`);
            return res.json({ text: finalReply, didMutate: didMutateFromTools });
        }

        return res.status(500).json({ error: "Maximum tool execution turns reached." });

    } catch (error: any) {
        console.error('[API ERROR] /api/chat:', error.message);
        return res.status(500).json({ error: "Internal server error", details: error.message });
    }
}
