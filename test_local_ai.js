async function testLocalAi() {
    const url = 'https://tea.rickelindustries.co.ke/v1/models';
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Error fetching models:", err);
    }
}

testLocalAi();
