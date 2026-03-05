import { supabase } from './supabase';
import { Message } from '../store/useAppStore';

const TOOLS = [
    {
        type: 'function',
        function: {
            name: 'get_tasks',
            description: 'Retrieves all tasks from the database, optionally filtered by date range.',
            parameters: {
                type: 'object',
                properties: {
                    start_date: { type: 'string', description: 'Optional start date (YYYY-MM-DD)' },
                    end_date: { type: 'string', description: 'Optional end date (YYYY-MM-DD)' }
                }
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_projects',
            description: 'Retrieves all projects.',
            parameters: { type: 'object', properties: {} }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_team_members',
            description: 'Retrieves all team members and their roles.',
            parameters: { type: 'object', properties: {} }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_metrics',
            description: 'Returns total hours logged and general productivity metrics.',
            parameters: { type: 'object', properties: {} }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_realtime_info',
            description: 'Gets the current date, time, location and weather. Use when user asks for time, date, or weather.',
            parameters: { type: 'object', properties: {} }
        }
    },
    {
        type: 'function',
        function: {
            name: 'create_task',
            description: 'Create a new task in the system. You CAN set status, start/due dates, times, priority, and assign to a user.',
            parameters: {
                type: 'object',
                properties: {
                    title: { type: 'string', description: 'Task title' },
                    description: { type: 'string', description: 'Task description' },
                    project_id: { type: 'string', description: 'Project ID (UUID). Use get_projects to find the correct ID.' },
                    status: { type: 'string', enum: ['todo', 'in_progress', 'done', 'blocked'], description: "Task status. Default is 'todo'." },
                    priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], description: "Task priority. Default is 'medium'." },
                    due_date: { type: 'string', description: "Due date in YYYY-MM-DD format. E.g. '2025-03-15'." },
                    start_date: { type: 'string', description: 'Start date in YYYY-MM-DD format.' },
                    estimated_hours: { type: 'number', description: 'Estimated hours to complete the task' },
                    assignee_id: { type: 'string', description: 'UUID of the user to assign this task to. Use get_team_members to look up IDs.' }
                },
                required: ['title']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'update_task',
            description: 'Update an existing task. Can change any field including status, dates, times, assignee, priority, or description.',
            parameters: {
                type: 'object',
                properties: {
                    task_id: { type: 'string', description: 'Task ID (UUID)' },
                    title: { type: 'string', description: 'New task title' },
                    description: { type: 'string', description: 'New task description' },
                    status: { type: 'string', enum: ['todo', 'in_progress', 'done', 'blocked'] },
                    priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
                    due_date: { type: 'string', description: 'Due date in YYYY-MM-DD format' },
                    start_date: { type: 'string', description: 'Start date in YYYY-MM-DD format' },
                    estimated_hours: { type: 'number' },
                    assignee_id: { type: 'string', description: 'UUID of the user to assign this task to' }
                },
                required: ['task_id']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'delete_task',
            description: 'Delete a task. Requires explicit user confirmation.',
            parameters: {
                type: 'object',
                properties: {
                    task_id: { type: 'string' },
                    confirmed: { type: 'boolean', description: 'Must be true. Only set after user explicitly confirms.' }
                },
                required: ['task_id', 'confirmed']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'log_time',
            description: 'Log time worked on a task.',
            parameters: {
                type: 'object',
                properties: {
                    task_id: { type: 'string', description: 'Task ID (UUID)' },
                    hours: { type: 'number', description: 'Hours worked' },
                    date: { type: 'string', description: 'Date in YYYY-MM-DD format. Defaults to today.' }
                },
                required: ['task_id', 'hours']
            }
        }
    }
];

const SYSTEM_PROMPT = `You are Yukime, the Work Intelligence Agent for TICKEL.
TICKEL has been developed by the team at Rickel Industries. Rickel Industries is a design-first, tech-centric creative and digital solutions studio that blends artistry with functional systems and web technology to help brands express themselves and thrive online. Our expertise spans strategic visual branding, motion and graphic design, product interfaces, and end-to-end digital experiences that go beyond surface aesthetics to solve real business needs.

Today's date is: ${new Date().toISOString().split('T')[0]}.

## CORE DIRECTIVE
You ARE authorized to perform CRUD operations (Create, Read, Update, Delete) on tasks and log time.
- If a user asks to create or update something, use the provided tools immediately.
- Never state that you cannot modify data.
- For destructive actions like deleting, always ensure you have the 'confirmed' flag after verifying with the user.

## TASK CREATION RULES
1. ALWAYS call get_projects first to resolve the project name to a UUID. Never invent a project_id.
2. If the user does not specify a field, use these defaults silently:
   - priority → "medium"
   - status → "todo"
   - start_date → today (${new Date().toISOString().split('T')[0]})
3. Notify the user in your final reply about which fields were missing and what defaults were applied. Example: "I've created the task. I used default priority (Medium) and status (To-Do) since you didn't specify them."
4. If the user did not mention a project, pick the most recently active project from get_projects result. If get_projects returns an empty list, YOU MUST call create_project with name="General" and status="active" first, then use its ID.

## TOOL CALLING FORMAT
If you need to use a tool, you MUST use the following format:
[TOOL_CALLS]tool_name[ARGS]{"arg1": "value"}

Example:
[TOOL_CALLS]get_tasks[ARGS]{"start_date": "2024-01-01"}

Always use this format for every tool call. You can call multiple tools by repeating the format.

Be concise, helpful, and professional.`;

/**
 * Robustly extracts [TOOL_CALLS] and [ARGS] from text using brace counting for the JSON part.
 * Returns the cleaned text and the extracted tool calls.
 */
function extractToolCallsFromText(content: string): { cleanText: string, toolCalls: any[] } {
    const toolCalls: any[] = [];
    let cleanText = content;

    // We look for [TOOL_CALLS]name[ARGS]{...}
    const pattern = /\[TOOL_CALLS\](.*?)(?=\[TOOL_CALLS\]|\[ARGS\]|$)/g;
    let match;

    // We use a temporary string to track removals to avoid index shift issues during the loop
    const remnants: { start: number, end: number }[] = [];

    while ((match = pattern.exec(content)) !== null) {
        const toolName = match[1].trim();
        const toolCallStart = match.index;

        // Find the [ARGS] tag immediately following or very close to this [TOOL_CALLS]
        const argsMarker = "[ARGS]";
        const argsIndex = content.indexOf(argsMarker, pattern.lastIndex);

        // If [ARGS] is found and it's reasonably close (within 50 chars of the end of the tool name)
        if (argsIndex !== -1 && argsIndex < (pattern.lastIndex + 50)) {
            const jsonStart = argsIndex + argsMarker.length;

            // Find the matching brace for the JSON object
            let braceCount = 0;
            let foundStart = false;
            let jsonEnd = -1;

            for (let i = jsonStart; i < content.length; i++) {
                if (content[i] === '{') {
                    braceCount++;
                    foundStart = true;
                } else if (content[i] === '}') {
                    braceCount--;
                }

                if (foundStart && braceCount === 0) {
                    jsonEnd = i + 1;
                    break;
                }
            }

            if (jsonEnd !== -1) {
                const jsonStr = content.substring(jsonStart, jsonEnd);
                try {
                    // Pre-sanitize simple multi-line strings inside JSON
                    const sanitizedJson = jsonStr.replace(/:\s*"([\s\S]*?)"/g, (_m: string, inner: string) => {
                        return `: "${inner.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')}"`;
                    });

                    toolCalls.push({
                        id: `local_call_${Math.random().toString(36).slice(2, 11)}`,
                        type: 'function',
                        function: { name: toolName, arguments: sanitizedJson }
                    });

                    remnants.push({ start: toolCallStart, end: jsonEnd });
                } catch (e) {
                    console.warn(`[Local AI] Failed to parse args for ${toolName}:`, e);
                }
            }
        }
    }

    // Sort remnants backwards to remove them without breaking indices
    remnants.sort((a, b) => b.start - a.start);
    for (const rem of remnants) {
        cleanText = cleanText.substring(0, rem.start) + cleanText.substring(rem.end);
    }

    // Final scrub for any orphaned tags
    cleanText = cleanText.replace(/\[TOOL_CALLS\]|\[ARGS\]/g, '').trim();

    return { cleanText, toolCalls };
}

export async function chatWithLocalModel(
    messages: Message[],
    localModelUrl: string,
    userId?: string,
    userRole?: string
): Promise<{ text: string, didMutate: boolean }> {
    // Normalize URL
    let baseUrl = localModelUrl.endsWith('/') ? localModelUrl.slice(0, -1) : localModelUrl;
    if (!baseUrl.endsWith('/v1')) baseUrl = `${baseUrl}/v1`;
    const endpoint = `${baseUrl}/chat/completions`;
    const modelsEndpoint = `${baseUrl}/models`;

    // messages construction
    const apiMessages: { role: string, content: string }[] = [];
    let systemPromptText = SYSTEM_PROMPT + "\n\n";
    for (const msg of messages) {
        if (msg.role === 'system') systemPromptText += msg.content + "\n\n";
    }
    apiMessages.push({ role: 'system', content: systemPromptText.trim() });

    let lastRole = 'system';
    for (const msg of messages) {
        if (msg.role === 'system') continue;
        if (msg.role === 'assistant' && (lastRole === 'system' || lastRole === 'assistant')) continue;
        if (msg.role === 'user' && lastRole === 'user' && apiMessages.length > 0) {
            apiMessages[apiMessages.length - 1].content += "\n\n" + msg.content;
            continue;
        }
        apiMessages.push({ role: msg.role as any, content: msg.content ?? '' });
        lastRole = msg.role;
    }

    let didMutate = false;
    let turnCount = 0;
    const MAX_TURNS = 5;

    try {
        let modelId = 'local-model';
        try {
            const mRes = await fetch(modelsEndpoint);
            if (mRes.ok) {
                const mData = await mRes.json();
                if (mData.data && mData.data.length > 0) modelId = mData.data[0].id;
            }
        } catch (e) { }

        while (turnCount < MAX_TURNS) {
            turnCount++;
            console.log(`[Local AI] Turn ${turnCount}/${MAX_TURNS}...`);

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: modelId,
                    messages: apiMessages,
                    tools: turnCount === 1 ? TOOLS : undefined, // Native tool support usually only works on first pass for many local models
                    temperature: turnCount === 1 ? 0 : 0.7
                })
            });

            if (!response.ok) throw new Error(`Local model API error: ${response.status}`);
            const data = await response.json();
            const assistantMsg = data.choices[0].message;

            // 1. Extract tool calls (Native + Tagged)
            let currentToolCalls = assistantMsg.tool_calls || [];
            if (assistantMsg.content) {
                const { cleanText, toolCalls: taggedCalls } = extractToolCallsFromText(assistantMsg.content);
                assistantMsg.content = cleanText;
                currentToolCalls = [...currentToolCalls, ...taggedCalls];
            }

            // 2. If no tool calls, this is our final answer
            if (currentToolCalls.length === 0) {
                return { text: assistantMsg.content || '', didMutate };
            }

            // 3. Execute tools
            console.log(`[Local AI] Executing ${currentToolCalls.length} tools...`);
            const toolResults = [];
            for (const toolCall of currentToolCalls) {
                const name = toolCall.function.name;
                let args: any;
                try {
                    args = typeof toolCall.function.arguments === 'string'
                        ? JSON.parse(toolCall.function.arguments)
                        : toolCall.function.arguments;
                } catch (e) {
                    console.error(`[Local AI] Failed to parse args for ${name}`);
                    continue;
                }

                let result: any = null;
                try {
                    if (name === 'get_tasks') {
                        const { data, error } = await supabase.from('tasks').select('*, projects(name)').is('deleted_at', null).order('created_at', { ascending: false });
                        result = error ? { error: error.message } : { tasks: data };
                    } else if (name === 'get_projects') {
                        const { data, error } = await supabase.from('projects').select('*').is('deleted_at', null).order('created_at', { ascending: false });
                        result = error ? { error: error.message } : { projects: data };
                    } else if (name === 'get_team_members') {
                        const { data, error } = await supabase.from('profiles').select('id, full_name, global_role');
                        result = error ? { error: error.message } : { members: data };
                    } else if (name === 'get_metrics') {
                        const { data, error } = await supabase.from('time_logs').select('hours');
                        const totalHours = data?.reduce((sum, log) => sum + (log.hours || 0), 0) || 0;
                        result = error ? { error: error.message } : { total_hours_logged: totalHours };
                    } else if (name === 'get_realtime_info') {
                        const now = new Date();
                        result = {
                            current_date: now.toLocaleDateString(),
                            current_time: now.toLocaleTimeString()
                        };
                    } else if (name === 'create_task') {
                        const { error, data } = await supabase.from('tasks').insert([{ ...args, user_id: userId }]).select();
                        if (!error) didMutate = true;
                        result = error ? { error: error.message } : { success: true, task: data[0] };
                    } else if (name === 'update_task') {
                        const { task_id, ...updates } = args;
                        const { error } = await supabase.from('tasks').update(updates).eq('id', task_id);
                        if (!error) didMutate = true;
                        result = error ? { error: error.message } : { success: true };
                    } else if (name === 'delete_task') {
                        if (!args.confirmed) result = { error: "Confirmation required." };
                        else {
                            const { error } = await supabase.from('tasks').update({ deleted_at: new Date().toISOString() }).eq('id', args.task_id);
                            if (!error) didMutate = true;
                            result = error ? { error: error.message } : { success: true };
                        }
                    } else if (name === 'log_time') {
                        const { error } = await supabase.from('time_logs').insert([{ ...args, user_id: userId }]);
                        if (!error) didMutate = true;
                        result = error ? { error: error.message } : { success: true };
                    }
                } catch (e: any) { result = { error: e.message }; }

                toolResults.push({
                    tool_call_id: toolCall.id,
                    role: 'tool',
                    name: name,
                    content: JSON.stringify(result)
                });
            }

            // 4. Update history and loop
            apiMessages.push({ role: 'assistant', content: assistantMsg.content || '', ...((assistantMsg as any).tool_calls ? { tool_calls: (assistantMsg as any).tool_calls } : {}) } as any);
            apiMessages.push(...(toolResults as any[]));
        }

        return { text: "I've performed several actions but reached my thinking limit. Please check the results.", didMutate };

    } catch (error) {
        console.error('Error communicating with Local Model:', error);
        throw error;
    }
}
export async function parseTaskFromPrompt(
    prompt: string,
    localModelUrl: string
): Promise<any> {
    let baseUrl = localModelUrl.endsWith('/') ? localModelUrl.slice(0, -1) : localModelUrl;
    if (!baseUrl.endsWith('/v1')) {
        baseUrl = `${baseUrl}/v1`;
    }
    const endpoint = `${baseUrl}/chat/completions`;
    const modelsEndpoint = `${baseUrl}/models`;

    const systemPrompt = `You are a precision data extractor. 
Extract task details from the user's prompt into a JSON object.
Fields: title, description, priority (low, medium, high, urgent), status (todo, in_progress, done, blocked), due_date (YYYY-MM-DD), estimated_hours (number), tags (array of strings), subtasks (array of {title, completed}).
Current Date: ${new Date().toISOString().split('T')[0]}
Only return the JSON object. No conversation.`;

    try {
        let modelId = 'local-model';
        try {
            const mRes = await fetch(modelsEndpoint);
            if (mRes.ok) {
                const mData = await mRes.json();
                if (mData.data && mData.data.length > 0) {
                    modelId = mData.data[0].id;
                }
            }
        } catch (e) {
            console.warn("Failed to fetch model list", e);
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: modelId,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ],
                temperature: 0,
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) throw new Error(`AI Parse Error: ${response.statusText}`);
        const data = await response.json();
        const content = data.choices[0].message.content;
        return JSON.parse(content);
    } catch (error) {
        console.error('Failed to parse task via AI:', error);
        return null;
    }
}
