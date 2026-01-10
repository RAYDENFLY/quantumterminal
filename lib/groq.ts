import Groq from 'groq-sdk';

const apiKey = process.env.GROQ_API_KEY;

let groq: Groq | null = null;

if (apiKey) {
    groq = new Groq({
        apiKey: apiKey,
    });
} else {
    console.warn('GROQ_API_KEY is not set in environment variables.');
}

export async function analyzeChartData(formattedData: string, timeFrame: string, ticker: string): Promise<string> {
    if (!groq) {
        throw new Error('Groq client not initialized. Check GROQ_API_KEY.');
    }

    const systemPrompt = `You are QUANTUM AI, a crypto market analyst. 
   
   Output Structure MUST be exactly like this (maintain the layout):

   ### ⚡ QUANTUM INTEL: ${ticker.toUpperCase()} [${timeFrame}]

   **🎯 SENTIMENT:** [🟢 BULLISH / 🔴 BEARISH / ⚪ NEUTRAL]
   **🔥 STRENGTH:** [Score 0-100]/100

   **🔑 KEY ZONES:**
   • 🧱 **RESISTANCE:** [Price] — [Brief Note]
   • 🛡️ **SUPPORT:** [Price] — [Brief Note]

   **💡 STRATEGY:**
   [One clear, actionable trading advice sentence.]

   **⚠️ RISK:**
   [One short warning sentence, DYOR, NFA.]`;

    const userPrompt = `Analisis data pasar berikut untuk ${ticker.toUpperCase()} pada Time Frame ${timeFrame}.

  ${formattedData}`;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: systemPrompt,
                },
                {
                    role: 'user',
                    content: userPrompt,
                },
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.5,
            max_tokens: 1024,
        });

        return chatCompletion.choices[0]?.message?.content || 'No analysis generated.';
    } catch (error: any) {
        console.error('Groq API Error:', error);
        throw new Error(`Failed to analyze data: ${error.message}`);
    }
}
