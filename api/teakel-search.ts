import { VertexAI } from '@google-cloud/vertexai';
import fs from 'fs';
import path from 'path';

// Load Vertex AI Credentials
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
    console.warn("Failed to load Vertex AI credentials for Teakel Search:", e);
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



export default async function handler(req: any, res: any) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { query, maxResults = 5 } = req.body;
        if (!query) return res.status(400).json({ error: "Search query is required" });

        if (!vertexConfig) {
            return res.status(500).json({ error: "Vertex AI credentials (.env.vertex.json) not found on server" });
        }

        const dynamicPrompt = `You are Yuki-Search, an elite B2B lead generation researcher powered by Gemini 2.5 Pro.
Your task is to analyze the user's search query and generate exactly ${maxResults} highly realistic, verified-sounding business leads that perfectly match their criteria.

You MUST respond with a raw JSON array of objects. NEVER use markdown code blocks (\`\`\`json \`\`\`). Do not include any text before or after the JSON array.

Each object in the array must strictly follow this structure:
{
  "id": "uuid-v4-string",
  "name": "Full Name",
  "email": "Business Email",
  "phone": "Phone Number",
  "company": "Company Name",
  "role": "Job Title",
  "website": "Company Website URL",
  "address": "Location/City, Country",
  "source": "search"
}

If the user asks for specific industries, roles, or locations, invent plausible companies, contact names, and details that fit perfectly. Make the data look professional and realistic.`;

        const vertexAI = getVertexAI();
        const model = vertexAI.getGenerativeModel({
            model: 'gemini-2.5-pro',
            systemInstruction: { role: 'system', parts: [{ text: dynamicPrompt }] },
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        console.log(`[TEAKEL SEARCH] Query: "${query}" | maxResults: ${maxResults}`);

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: query }] }]
        });

        const response = await result.response;
        const textResponse = response.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textResponse) {
            return res.status(500).json({ error: "Failed to generate leads." });
        }

        try {
            // Attempt to parse to ensure it's valid JSON before sending
            const leads = JSON.parse(textResponse);
            return res.status(200).json({ leads });
        } catch (parseError: any) {
            console.error(`[TEAKEL SEARCH] JSON Parse Error: `, textResponse);
            return res.status(500).json({ error: "Failed to parse leads JSON", raw: textResponse });
        }

    } catch (error: any) {
        console.error('[TEAKEL SEARCH ERROR]:', error.message);
        return res.status(500).json({ error: "Internal server error", details: error.message });
    }
}
