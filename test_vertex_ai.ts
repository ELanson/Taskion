import { VertexAI } from "@google-cloud/vertexai";
import fs from 'fs';
import path from 'path';

/**
 * TICKEL: Vertex AI Diagnostics (Bleeding Edge Edition)
 * Testing for models: 2.x, 2.5, and 3.0 (Preview)
 */

async function testVertexAI() {
    console.log("--- 🛡️ Starting Vertex AI Diagnostic ---");

    const configPath = path.resolve(process.cwd(), '.env.vertex.json');
    if (!fs.existsSync(configPath)) {
        console.error("❌ ERROR: .env.vertex.json not found.");
        return;
    }

    try {
        const vertexConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        console.log(`✅ Config Found: ${vertexConfig.project_id}`);

        const vertexAI = new VertexAI({
            project: vertexConfig.project_id,
            location: 'us-central1',
            googleAuthOptions: {
                credentials: {
                    client_email: vertexConfig.client_email,
                    private_key: vertexConfig.private_key
                }
            }
        });

        // Models from your screenshot
        const modelsToTry = [
            "gemini-3-flash-preview",
            "gemini-3-pro-preview",
            "gemini-2.5-pro",
            "gemini-2.5-flash",
            "gemini-2.5-flash-lite",
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
            "gemini-1.5-pro",
            "gemini-1.5-flash"
        ];

        for (const modelName of modelsToTry) {
            console.log(`--- 🛰️ Testing: ${modelName} ---`);
            try {
                const model = vertexAI.getGenerativeModel({ model: modelName });
                const response = await model.generateContent("Ping. Reply with your name only.");
                const text = response.response.candidates?.[0]?.content?.parts?.[0]?.text;
                console.log(`✨ SUCCESS with ${modelName}: ${text}`);
                console.log(`\n🎉 WE FOUND IT! Use ${modelName} in your backend.`);
                return;
            } catch (err: any) {
                if (err.message.includes("404")) {
                    console.warn(`❌ ${modelName} not found.`);
                } else {
                    console.error(`❌ ${modelName} error: ${err.message}`);
                }
            }
        }

        console.log("\n--- 🛠️ TROUBLESHOOTING ---");
        console.log("If ALL failed (404), double check your location in .env.vertex.json matches the Model Garden region (usually us-central1).");

    } catch (error: any) {
        console.error("❌ FAILURE:", error.message);
    }
}

testVertexAI();
