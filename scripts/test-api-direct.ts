import fetch from 'node-fetch';

async function testDirect() {
    console.log("Starting direct API test...");
    const payload = {
        message: "Add task: Direct API Test. project: General",
        userId: "6fad946b-9a69-4531-811a-91de41431102",
        history: []
    };

    try {
        const res = await fetch('http://localhost:3005/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer DUMMY_TOKEN'
            },
            body: JSON.stringify(payload)
        });

        console.log("Status:", res.status);
        const data = await res.json();
        console.log("Response Data:", JSON.stringify(data, null, 2));
    } catch (e: any) {
        console.error("Test failed:", e.message);
    }
}

testDirect();
