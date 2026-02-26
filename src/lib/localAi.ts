import { supabase } from './supabase';
import { Message } from '../store/useAppStore';

const TOOLS = [
    {
        type: 'function',
        function: {
            name: 'create_project',
            description: 'Creates a new project in the database.',
            parameters: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: 'Name of the project' },
                    description: { type: 'string', description: 'Description of the project' }
                },
                required: ['name']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'create_task',
            description: 'Creates a new task in the database.',
            parameters: {
                type: 'object',
                properties: {
                    title: { type: 'string', description: 'Title of the task' },
                    description: { type: 'string', description: 'Description of the task' },
                    project_id: { type: 'number', description: 'The integer ID of the project this task belongs to' },
                    priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Priority of the task' },
                    estimated_hours: { type: 'number', description: 'Estimated hours to complete the task' }
                },
                required: ['title', 'project_id', 'priority', 'estimated_hours']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'update_task',
            description: 'Updates an existing task in the database.',
            parameters: {
                type: 'object',
                properties: {
                    id: { type: 'number', description: 'The integer ID of the task to update' },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    priority: { type: 'string', enum: ['low', 'medium', 'high'] },
                    status: { type: 'string', enum: ['todo', 'in_progress', 'done'] },
                    estimated_hours: { type: 'number' }
                },
                required: ['id']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'delete_task',
            description: 'Soft deletes a task from the database.',
            parameters: {
                type: 'object',
                properties: {
                    id: { type: 'number', description: 'The integer ID of the task to delete' }
                },
                required: ['id']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'log_time',
            description: 'Logs time spent on a specific task.',
            parameters: {
                type: 'object',
                properties: {
                    task_id: { type: 'number', description: 'The integer ID of the task' },
                    hours: { type: 'number', description: 'Number of hours to log' },
                    date: { type: 'string', description: 'Date of the time log in YYYY-MM-DD format (use current date if unknown)' }
                },
                required: ['task_id', 'hours', 'date']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_tasks',
            description: 'Retrieves all tasks for reporting.',
            parameters: { type: 'object', properties: {} }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_projects',
            description: 'Retrieves all projects for reporting.',
            parameters: { type: 'object', properties: {} }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_metrics',
            description: 'Calculates performance metrics like total hours logged.',
            parameters: { type: 'object', properties: {} }
        }
    }
];

const SYSTEM_PROMPT = `You are a highly capable AI Work Assistant. 
You are integrated into a Task and Project Management app called Taskion.
You have access to tools that allow you to modify the database. 
Always use the tools provided to fulfill the user's request. 
When creating a task, you MUST provide a valid project_id. 
When logging time, make sure to ask the user which task they want to log time for, if not provided.
If the user asks you to do something that you don't have a tool for, politely decline.
`;

export async function chatWithLocalModel(
    messages: Message[],
    localModelUrl: string
): Promise<string> {
    // Normalize URL
    const baseUrl = localModelUrl.endsWith('/') ? localModelUrl.slice(0, -1) : localModelUrl;
    const endpoint = `${baseUrl}/chat/completions`;

    const apiMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map(m => ({ role: m.role, content: m.content }))
    ];

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'local-model', // LM Studio typically ignores this if a model is loaded
                messages: apiMessages,
                tools: TOOLS,
                tool_choice: 'auto',
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`Local model API error: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data || !data.choices || data.choices.length === 0) {
            console.error('Invalid response from Local Model API:', data);
            throw new Error(`Local model returned an invalid response. Check if a model is loaded at your server URL.`);
        }

        const assistantMessage = data.choices[0].message;

        if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
            // Execute the tools
            const toolResults = [];

            for (const toolCall of assistantMessage.tool_calls) {
                if (toolCall.type !== 'function') continue;

                const name = toolCall.function.name;
                const args = JSON.parse(toolCall.function.arguments);
                let result = null;

                try {
                    if (name === 'create_project') {
                        const { error, data } = await supabase.from('projects').insert([args]).select();
                        result = error ? { error } : { success: true, project: data[0] };
                    } else if (name === 'create_task') {
                        const { error, data } = await supabase.from('tasks').insert([args]).select();
                        result = error ? { error } : { success: true, task: data[0] };
                    } else if (name === 'update_task') {
                        const { id, ...updates } = args;
                        const { error } = await supabase.from('tasks').update(updates).eq('id', id);
                        result = error ? { error } : { success: true };
                    } else if (name === 'delete_task') {
                        const { error } = await supabase.from('tasks').update({ deleted_at: new Date().toISOString() }).eq('id', args.id);
                        result = error ? { error } : { success: true };
                    } else if (name === 'log_time') {
                        const { error } = await supabase.from('time_logs').insert([args]);
                        result = error ? { error } : { success: true };
                    } else if (name === 'get_tasks') {
                        const { data, error } = await supabase.from('tasks').select('*, projects(name)').is('deleted_at', null).order('created_at', { ascending: false });
                        result = error ? { error } : { tasks: data };
                    } else if (name === 'get_projects') {
                        const { data, error } = await supabase.from('projects').select('*').is('deleted_at', null).order('created_at', { ascending: false });
                        result = error ? { error } : { projects: data };
                    } else if (name === 'get_metrics') {
                        const { data, error } = await supabase.from('time_logs').select('hours');
                        const totalHours = data?.reduce((sum, log) => sum + (log.hours || 0), 0) || 0;
                        result = error ? { error } : { total_hours_logged: totalHours };
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
                    model: 'local-model',
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

            return finalData.choices[0].message.content;
        }

        // No tool calls, just return the text
        return assistantMessage.content;

    } catch (error) {
        console.error('Error communicating with Local Model:', error);
        throw error;
    }
}
