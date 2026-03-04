import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { VertexAI } from '@google-cloud/vertexai';

// Initialize Supabase Server Client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

// Load Vertex AI Credentials securely
let vertexConfig: any = null;
try {
    if (process.env.VERTEX_CREDENTIALS) {
        vertexConfig = JSON.parse(process.env.VERTEX_CREDENTIALS);
    } else {
        const configPath = path.resolve(process.cwd(), '.env.vertex.json');
        if (fs.existsSync(configPath)) {
            vertexConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
    }
} catch (e) {
    console.warn("Failed to load Vertex AI credentials:", e);
}

function getVertexAI() {
    if (!vertexConfig) throw new Error("Vertex AI credentials not configured");
    return new VertexAI({
        project: vertexConfig.project_id,
        location: 'us-central1',
        googleAuthOptions: {
            credentials: {
                client_email: vertexConfig.client_email,
                private_key: vertexConfig.private_key
            }
        }
    });
}

async function callGeminiSDK(prompt: string): Promise<string> {
    const vertexAI = getVertexAI();
    const model = vertexAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }] });
    const response = await result.response;
    return response.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
}


function calculateBasicStats(data: any) {
    const totalTasks = data.tasks.length;
    const completedTasks = data.tasks.filter((t: any) => t.status === 'done').length;
    const inProgressTasks = data.tasks.filter((t: any) => t.status === 'in_progress').length;
    const overdueTasks = data.tasks.filter((t: any) => {
        if (!t.due_date || t.status === 'done') return false;
        return new Date(t.due_date) < new Date();
    }).length;
    const totalHours = data.logs.reduce((sum: number, l: any) => sum + (l.hours || 0), 0);

    return {
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        totalHours: Math.round(totalHours * 10) / 10,
        totalProjects: data.projects.length,
    };
}

export default async function handler(req: any, res: any) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { template, scope, dateRange, useAI } = req.body;

        // 1. Fetch workspace data
        const [tasksRes, projectsRes, logsRes] = await Promise.all([
            supabase.from('tasks').select('*, projects(name)').is('deleted_at', null),
            supabase.from('projects').select('*').is('deleted_at', null),
            supabase.from('time_logs').select('*, tasks(title)'),
        ]);

        const dataContext = {
            tasks: tasksRes.data || [],
            projects: projectsRes.data || [],
            logs: logsRes.data || [],
            template,
            scope,
            dateRange,
        };

        const stats = calculateBasicStats(dataContext);

        if (!useAI) {
            return res.json({ success: true, aiContent: null, stats });
        }

        if (!vertexConfig) {
            return res.status(500).json({ error: "Vertex AI credentials (.env.vertex.json) not found on server" });
        }

        // 2. Build AI prompt
        const prompt = `Generate a high-level executive report based on the following workspace data:
${JSON.stringify({ tasks: dataContext.tasks.slice(0, 50), projects: dataContext.projects, stats }, null, 2)}

REPORT TYPE: ${template}
SCOPE: ${scope}
PERIOD: ${dateRange}

REQUIREMENTS:
1. EXECUTIVE SUMMARY: A 2-paragraph narrative of overall performance and trajectory.
2. KEY INSIGHTS: 3-4 data-backed observations about what's going well or struggling.
3. RISK ASSESSMENT: Identified bottlenecks, overdue items, or burnout signals.
4. STRATEGIC RECOMMENDATIONS: 3 actionable steps for the next period.

FORMAT: Return ONLY a valid JSON object with these exact keys:
{
  "executiveSummary": "string with 2 paragraphs",
  "insights": ["insight 1", "insight 2", "insight 3"],
  "risks": ["risk 1", "risk 2"],
  "recommendations": ["action 1", "action 2", "action 3"]
}`;

        const responseText = await callGeminiSDK(prompt);

        // Clean markdown JSON wrapper if present
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        let aiContent: any;
        try {
            aiContent = jsonMatch ? JSON.parse(jsonMatch[0]) : { executiveSummary: responseText };
        } catch {
            aiContent = { executiveSummary: responseText };
        }

        return res.json({ success: true, aiContent, stats });

    } catch (error: any) {
        console.error('[API ERROR] /api/generate-report:', error.message);
        return res.status(500).json({ error: error.message });
    }
}
