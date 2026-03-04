/**
 * Vertex AI Proxy Service
 * This client communicates with our SECURE BACKEND to provide "Premium Intelligence".
 * NO API KEYS ARE STORED OR EXPOSED ON THE CLIENT.
 */

export class VertexAIService {
    private static instance: VertexAIService;

    private constructor() { }

    public static getInstance(): VertexAIService {
        if (!VertexAIService.instance) {
            VertexAIService.instance = new VertexAIService();
        }
        return VertexAIService.instance;
    }

    /**
     * Proxies a prompt to the secure backend for high-intelligence reasoning
     */
    public async generatePremiumInsight(
        prompt: string,
        modelName: 'gemini-2.5-pro' | 'gemini-1.5-flash' = 'gemini-2.5-pro',
        systemInstruction?: string
    ) {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: prompt,
                    // Note: In production, the backend switchboard should handle model selection 
                    // based on workspace governance settings.
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to communicate with intelligence engine');
            }

            const data = await response.json();
            return data.text;
        } catch (error) {
            console.error("Vertex AI Proxy Error:", error);
            throw error;
        }
    }
}

export const vertexAI = VertexAIService.getInstance();
