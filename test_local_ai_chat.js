async function testChat() {
    const url = 'https://tea.rickelindustries.co.ke/v1/chat/completions';
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'mistralai/ministral-3-3b',
                messages: [{ role: 'user', content: 'hello' }],
                tools: [
                    {
                        type: 'function',
                        function: {
                            name: 'get_tasks',
                            description: 'Retrieves all tasks for reporting.',
                            parameters: { type: 'object', properties: {} }
                        }
                    }
                ],
                tool_choice: 'auto'
            })
        });
        const text = await response.text();
        console.log("STATUS:", response.status);
        console.log("RESPONSE:", text);
    } catch (err) {
        console.error("Error fetching chat:", err);
    }
}

testChat();
