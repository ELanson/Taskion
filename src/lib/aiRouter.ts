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
    /create (a |the )?(new )?(task|project)/i,
    /add (a |the )?(new )?(task|project|item)/i,
    /make (a |the )?(new )?(task|project)/i,
    /new task/i,
    // Update any field
    /update (a |the |this |that |my )?(task|project)/i,
    /change (the )?(status|priority|due date|title|description|assignee|start date|start time|due time)/i,
    /mark (it|this|that|the task)?.*(done|complete|in.progress|blocked|todo)/i,
    /set (the )?(status|priority|due date|start date|assignee|description|due time|start time)/i,
    /rename (the |this |that )?(task|project)/i,
    /edit (the |this |that )?(task|project)/i,
    /move (it|the task|this task).*(to|into)/i,
    /assign (this|the task|it)? to/i,
    // Delete
    /delete (a |the |this |that )?(task|project)/i,
    /remove (a |the |this |that )?(task|project)/i,
    /get rid of (the |this |that )?(task|project)/i,
    // Log time
    /log (time|hours?)/i,
    /i (worked|spent) .*(hour|minute)/i,
    // Undo
    /undo (the )?(last|that|it)/i,
    /revert (the )?(last|that|it)/i,
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
 */
export function routeMessage(message: string, cloudEnabled: boolean, useLocalModel: boolean): RouteDecision {
    // Task/project mutations
    if (AGENT_PATTERNS.some(p => p.test(message))) {
        // Always go to the server-side Gemini agent for mutations
        // This ensures reliability for CRUD operations
        return 'agent';
    }

    // Deep analysis/reports go to cloud only when enabled
    if (CLOUD_PATTERNS.some(p => p.test(message))) {
        return cloudEnabled ? 'cloud' : 'local';
    }

    // Everything else: local LLM (Q&A, read-only table lookups)
    return 'local';
}
