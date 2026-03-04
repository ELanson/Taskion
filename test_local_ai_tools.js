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

async function testToolsChat() {
    const url = 'https://tea.rickelindustries.co.ke/v1/chat/completions';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'mistralai/ministral-3-3b',
                messages: [{ role: 'user', content: 'hello' }],
                tools: TOOLS,
                tool_choice: 'auto'
            })
        });

        if (!response.ok) {
            const text = await response.text();
            console.error("HTTP ERROR", response.status, text);
            return;
        }

        const data = await response.json();
        console.log("SUCCESS!", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Error fetching chat:", err);
    }
}

testToolsChat();
