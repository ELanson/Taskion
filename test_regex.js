
const AGENT_PATTERNS = [
    /create (.* )?(task|project)/i,
    /add (.* )?(task|project|item)/i,
    /make (.* )?(task|project)/i,
    /new task/i,
    /update (.* )?(task|project)/i,
    /(change|set|update) (.* )?(status|priority|due date|title|description|assignee|start date|start time|due time)/i,
    /mark (.* )?(done|complete|in.progress|blocked|todo)/i,
    /rename (.* )?(task|project)/i,
    /edit (.* )?(task|project)/i,
    /move (.* )?(task|project)/i,
    /assign (.* )? to/i,
    /delete (.* )?(task|project)/i,
    /remove (.* )?(task|project)/i,
    /get rid of (.* )?(task|project)/i,
    /log (.* )?(time|hours?)/i,
    /i (worked|spent) (.* )?(hour|minute)/i,
    /undo/i,
    /revert/i,
];

const message = "yukime, add this task title: design revision. project : atla";
const matches = AGENT_PATTERNS.some(p => {
    const m = p.test(message);
    console.log(`Pattern ${p}: ${m}`);
    return m;
});

console.log(`Final Match Result: ${matches}`);
