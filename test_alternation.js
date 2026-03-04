async function testChatAlternation() {
    const url = 'https://tea.rickelindustries.co.ke/v1/chat/completions';
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'mistralai/ministral-3-3b',
                messages: [
                    { role: 'system', content: 'You are an AI assistant.' },
                    { role: 'assistant', content: 'Hello! How can I help?' },
                    { role: 'user', content: 'Test message' }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            console.error("HTTP ERROR", response.status, await response.text());
            return;
        }

        console.log("SUCCESS!", await response.json());
    } catch (err) {
        console.error("Error fetching chat:", err);
    }
}

testChatAlternation();
