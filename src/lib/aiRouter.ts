/**
 * Smart AI Router for TICKEL/Yukime
 *
 * Routing rules:
 * - 'agent'  → Task/Project CRUD mutations. ALWAYS routes to /api/chat (Gemini).
 *              Ignores the cloud AI toggle. This is the reliable server-side path.
 * - 'cloud'  → Deep analytics, reports, real-time data. Routes to /api/chat only if cloudEnabled.
 *              Falls back to 'local' if cloud is off.
 * - 'local'  → Simple Q&A, read-only queries. Routes to local LLM.
 */

export type RouteDecision = 'agent' | 'cloud' | 'local';

// Keywords that indicate a task/project CRUD mutation  → 'agent' (always cloud, regardless of toggle)
const AGENT_PATTERNS = [
    // Create
    /create .* (task|project)/i,
    /add .* (task|project|item)/i,
    /make .* (task|project)/i,
    /new task/i,
    // Update any field
    /update .* (task|project)/i,
    /(change|set|update) .* (status|priority|due date|title|description|assignee|start date|start time|due time)/i,
    /mark .* (done|complete|in.progress|blocked|todo)/i,
    /rename .* (task|project)/i,
    /edit .* (task|project)/i,
    /move .* (task|project)/i,
    /assign .* to/i,
    // Delete
    /delete .* (task|project)/i,
    /remove .* (task|project)/i,
    /get rid of .* (task|project)/i,
    // Log time
    /log .* (time|hours?)/i,
    /i (worked|spent) .* (hour|minute)/i,
    // Undo
    /undo/i,
    /revert/i,
];

// Keywords that need deep analysis / real-time data → 'cloud' (only if enabled)
const CLOUD_PATTERNS = [
    /weather/i, /forecast/i, /news/i, /trending/i, /real.?time/i, /current events/i,
    /generate (a |the )?(deep |full |detailed |comprehensive )?(report|analysis|summary)/i,
    /executive (summary|report)/i,
    /report (on|about|for)/i,
    /deep (analysis|dive|reasoning)/i,
    /analyze (all|across|trends?|performance|patterns?)/i,
    /who (is|are) (underperform|overload|behind|at risk)/i,
    /predict/i,
    /burnout (risk|signal)/i, /bottleneck analysis/i,
    /compare .*(teams?|projects?|months?|quarters?)/i,
    /productivity (trend|pattern|analysis)/i,
    /team (health|performance) (analysis|report|summary)/i,
    /strategic (recommendation|insight)/i,
];

/**
 * Determine which path should handle a message.
 * @param message  The raw user message string.
 * @param cloudEnabled  Whether the cloud AI engine is on in workspace settings.
 * @param useLocalModel Whether the user has toggled "Use Local Model" on.
 * @param hasAttachment Whether the message includes an uploaded file/image.
 */
export function routeMessage(message: string, cloudEnabled: boolean, useLocalModel: boolean, hasAttachment?: boolean): RouteDecision {
    // Force agent/cloud for attachments or mutations
    if (hasAttachment || AGENT_PATTERNS.some(p => p.test(message))) {
        // Always go to the server-side Gemini agent for mutations or attachments
        return 'agent';
    }

    // Deep analysis/reports go to cloud only when enabled
    if (CLOUD_PATTERNS.some(p => p.test(message))) {
        return cloudEnabled ? 'cloud' : 'local';
    }

    // Everything else: local LLM (Q&A, read-only table lookups)
    return 'local';
}
