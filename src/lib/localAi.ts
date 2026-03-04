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

export async function chatWithLocalModel(
    messages: Message[],
    localModelUrl: string,
    userId?: string,
    userRole?: string
): Promise<{ text: string, didMutate: boolean }> {
    // Normalize URL and ensure it has /v1
    let baseUrl = localModelUrl.endsWith('/') ? localModelUrl.slice(0, -1) : localModelUrl;
    if (!baseUrl.endsWith('/v1')) {
        baseUrl = `${baseUrl}/v1`;
    }
    const endpoint = `${baseUrl}/chat/completions`;
    const modelsEndpoint = `${baseUrl}/models`;

    // Strictly enforce alternating roles (System -> User -> Assistant -> User)
    const apiMessages: { role: string, content: string }[] = [];
    let systemPromptText = SYSTEM_PROMPT + "\n\n";

    // 1. Extract system prompt(s) from history if any
    for (const msg of messages) {
        if (msg.role === 'system') {
            systemPromptText += msg.content + "\n\n";
        }
    }

    apiMessages.push({ role: 'system', content: systemPromptText.trim() });

    // 2. Add conversational messages
    let lastRole = 'system';
    for (const msg of messages) {
        if (msg.role === 'system') continue;
        if (msg.role === 'assistant' && (lastRole === 'system' || lastRole === 'assistant')) continue;
        if (msg.role === 'user' && lastRole === 'user' && apiMessages.length > 0) {
            apiMessages[apiMessages.length - 1].content += "\n\n" + msg.content;
            continue;
        }
        apiMessages.push({ role: msg.role, content: msg.content ?? '' });
        lastRole = msg.role;
    }

    try {
        let modelId = 'local-model';
        try {
            const mRes = await fetch(modelsEndpoint);
            if (mRes.ok) {
                const mData = await mRes.json();
                if (mData.data && mData.data.length > 0) modelId = mData.data[0].id;
            }
        } catch (e) { }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: modelId,
                messages: apiMessages,
                tools: TOOLS,
                tool_choice: 'auto',
                temperature: 0 // Zero temp for deterministic tool calling
            })
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            throw new Error(`Local model API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        if (!data || !data.choices || data.choices.length === 0) throw new Error("Invalid response");

        const assistantMessage = data.choices[0].message;

        // --- DIAGNOSTICS ---
        console.group('[Local AI] Model response');
        console.log('finish_reason:', data.choices[0].finish_reason);
        console.log('native tool_calls:', assistantMessage.tool_calls);
        console.log('content preview:', assistantMessage.content?.slice(0, 200));
        console.groupEnd();
        // -------------------

        // Regex-based approaches break on multi-line JSON because they stop at the first }
        // instead of the MATCHING }. We use brace-counting instead.
        // --- TOOL CALL EXTRACTION (REGEX BASED) ---
        // Local models often add intro/outro text. We search the entire content for [TOOL_CALLS] patterns.
        if (assistantMessage.content) {
            assistantMessage.tool_calls = assistantMessage.tool_calls || [];
            const combinedRegex = /\[TOOL_CALLS\](.*?)(?=\[TOOL_CALLS\]|\[ARGS\]|$)/g;
            const argsRegex = /\[ARGS\](\{[\s\S]*?\})(?=\[TOOL_CALLS\]|$)/g;

            let cleanContent = assistantMessage.content;
            let match;

            while ((match = combinedRegex.exec(assistantMessage.content)) !== null) {
                const toolName = match[1].trim();
                const toolCallStart = match.index;

                // Move argsRegex to start looking after the current [TOOL_CALLS]
                argsRegex.lastIndex = combinedRegex.lastIndex;
                const argsMatch = argsRegex.exec(assistantMessage.content);

                if (argsMatch && argsMatch.index < (combinedRegex.lastIndex + 50)) { // Ensure [ARGS] is close to [TOOL_CALLS]
                    const jsonStr = argsMatch[1];
                    try {
                        // Sanitize and Parse
                        const sanitizedJson = jsonStr.replace(/:\s*"([\s\S]*?)"/g, (_m: string, inner: string) => {
                            return `: "${inner.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')}"`;
                        });

                        assistantMessage.tool_calls.push({
                            id: `local_call_${Math.random().toString(36).slice(2, 11)}`,
                            type: 'function',
                            function: { name: toolName, arguments: sanitizedJson }
                        });

                        // Removal: Remove from [TOOL_CALLS] up to the end of [ARGS]
                        const fullMatchText = assistantMessage.content.substring(toolCallStart, argsRegex.lastIndex);
                        cleanContent = cleanContent.replace(fullMatchText, '');
                    } catch (e) {
                        console.warn(`[Local AI] Failed to parse args for ${toolName}:`, e);
                    }
                }
            }
            assistantMessage.content = cleanContent.replace(/\[TOOL_CALLS\]|\[ARGS\]/g, '').trim();
        }
        // -------------------------------------------

        const sanitize = (obj: any) => {
            const res = { ...obj };
            for (const key in res) {
                if (res[key] === '') res[key] = null;
            }
            return res;
        };

        if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
            // Execute the tools
            const toolResults = [];
            let didMutate = false;

            for (const toolCall of assistantMessage.tool_calls) {
                if (toolCall.type !== 'function') continue;

                const name = toolCall.function.name;
                let args: any;
                try {
                    args = JSON.parse(toolCall.function.arguments);
                } catch (e) {
                    console.error(`[Local AI] Executor: could not parse args for ${name}:`, toolCall.function.arguments);
                    continue;
                }
                let result = null;

                if (!['get_tasks', 'get_projects', 'get_team_members', 'get_metrics', 'get_realtime_info', 'create_task', 'update_task', 'delete_task', 'log_time'].includes(name)) {
                    result = { error: `Tool '${name}' is not available in local mode.` };
                } else try {
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
                        try {
                            const geoRes = await fetch('https://get.geojs.io/v1/ip/geo.json');
                            const geoData = await geoRes.json();
                            const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${geoData.latitude}&longitude=${geoData.longitude}&current_weather=true`);
                            const weatherData = await weatherRes.json();
                            const now = new Date();
                            result = {
                                location: `${geoData.city}, ${geoData.country}`,
                                current_date: now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                                current_time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                                weather: weatherData.current_weather
                            };
                        } catch (e: any) {
                            result = { error: `Failed to fetch realtime info: ${e.message}` };
                        }
                    } else if (name === 'create_task') {
                        const taskPayload = { ...args };

                        // Reliability Enhancement: Resolve project_id from name if it's not a UUID
                        if (taskPayload.project_id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(taskPayload.project_id)) {
                            console.log(`[Local AI RELIABILITY] Attempting to resolve project name: "${taskPayload.project_id}"`);
                            const { data: proj } = await supabase.from('projects')
                                .select('id')
                                .ilike('name', taskPayload.project_id.trim())
                                .is('deleted_at', null)
                                .limit(1)
                                .single();

                            if (proj) {
                                console.log(`[Local AI RELIABILITY] Resolved "${taskPayload.project_id}" to ${proj.id}`);
                                taskPayload.project_id = proj.id;
                            } else {
                                // Fallback to most recent project
                                const { data: recentProj } = await supabase.from('projects')
                                    .select('id')
                                    .is('deleted_at', null)
                                    .order('created_at', { ascending: false })
                                    .limit(1)
                                    .single();
                                if (recentProj) {
                                    console.warn(`[Local AI RELIABILITY] Project "${taskPayload.project_id}" not found. Falling back to ${recentProj.id}`);
                                    taskPayload.project_id = recentProj.id;
                                }
                            }
                        }

                        const { error, data } = await supabase.from('tasks').insert([{ ...taskPayload, user_id: userId }]).select();
                        if (!error) didMutate = true;
                        result = error ? { error: error.message } : { success: true, task: data[0] };

                        // Local Action Logging
                        await supabase.from('ai_action_logs').insert([{ action_type: 'create_task (local)', details: args, outcome: result, user_id: userId }]);
                    } else if (name === 'update_task') {
                        const updates = sanitize(args);
                        const { task_id, ...otherUpdates } = updates;
                        const { error } = await supabase.from('tasks').update(otherUpdates).eq('id', task_id);
                        if (!error) didMutate = true;
                        result = error ? { error: error.message } : { success: true };

                        // Local Action Logging
                        await supabase.from('ai_action_logs').insert([{ action_type: 'update_task (local)', details: args, outcome: result, user_id: userId }]);
                    } else if (name === 'delete_task') {
                        if (!args.confirmed) {
                            result = { error: "Confirmation required for deletion." };
                        } else {
                            const { error } = await supabase.from('tasks').update({ deleted_at: new Date().toISOString() }).eq('id', args.task_id);
                            if (!error) didMutate = true;
                            result = error ? { error: error.message } : { success: true };
                        }
                    } else if (name === 'log_time') {
                        const entry = {
                            task_id: args.task_id,
                            hours: args.hours,
                            date: args.date || new Date().toISOString().split('T')[0],
                            user_id: userId
                        };
                        const { error } = await supabase.from('time_logs').insert([entry]);
                        if (!error) didMutate = true;
                        result = error ? { error: error.message } : { success: true };
                    }
                } catch (e: any) {
                    result = { error: e.message };
                }

                toolResults.push({
                    tool_call_id: toolCall.id,
                    role: 'tool',
                    name: name,
                    content: JSON.stringify(result)
                });
            }

            // Second round trip to the model with the tool results
            apiMessages.push(assistantMessage);
            apiMessages.push(...toolResults as any[]);

            const finalResponse = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: modelId,
                    messages: apiMessages,
                    temperature: 0.7
                })
            });

            if (!finalResponse.ok) {
                throw new Error(`Local model API error (2nd pass): ${finalResponse.statusText}`);
            }

            const finalData = await finalResponse.json();
            if (!finalData || !finalData.choices || finalData.choices.length === 0) {
                console.error('Invalid response from Local Model API (2nd pass):', finalData);
                throw new Error(`Local model returned an invalid response during the second pass.`);
            }

            const finalReply = finalData.choices[0].message.content;
            console.log(`[Local AI] Final Reply: "${finalReply.slice(0, 50)}..."`);
            return { text: finalReply, didMutate };
        }

        console.log(`[Local AI] Chat Reply: "${assistantMessage.content.slice(0, 50)}..."`);
        return { text: assistantMessage.content, didMutate: false };

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
