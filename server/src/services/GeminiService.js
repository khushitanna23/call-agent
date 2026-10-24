/**
 * Direct Gemini API Integration for Vedanco
 */
exports.parseAppointmentWithGemini = async (userInput, context = {}) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

    const promptText = `
You are an intelligent appointment parsing assistant for Vedanco AI.
Today's Date: ${new Date().toISOString().split('T')[0]}
User Input: "${userInput}"
Existing Context: ${JSON.stringify(context)}

Analyze the text and extract booking intent, date, time slot, customer name, email, phone, and requirements.
Return ONLY a valid JSON object without backticks, markdown, or extra explanations:
{
  "isAppointmentIntent": true,
  "customerName": "extracted customer name or null",
  "customerPhone": "extracted phone number or null",
  "customerEmail": "extracted email or null",
  "date": "YYYY-MM-DD or null",
  "timeSlot": "e.g. 10:00 AM or null",
  "serviceType": "Consultation or specific requested service",
  "requirement": "brief summary of what they need",
  "replyMessage": "A natural, helpful response confirming details or asking for missing fields."
}
`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: promptText }],
          },
        ],
      }),
    });

    const data = await response.json();
    const rawOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanJson = rawOutput.replace(/```json|```/g, '').trim();

    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('[Gemini API Error]:', error.message);
    return {
      isAppointmentIntent: false,
      replyMessage: 'Unable to parse appointment automatically.',
    };
  }
};