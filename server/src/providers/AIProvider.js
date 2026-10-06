/**
 * AI Provider abstraction layer.
 * Concrete providers: OpenAIProvider, MockAIProvider.
 */

class AIProvider {
  async generateCompletion({ messages, temperature, maxTokens, tools }) {
    throw new Error('generateCompletion method must be implemented by subclass');
  }

  async generateEmbedding() {
    throw new Error('generateEmbedding method must be implemented by subclass');
  }
}

class OpenAIProvider extends AIProvider {
  constructor(apiKey, model = 'gpt-4o-mini') {
    super();
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateCompletion({ messages, temperature = 0.7, maxTokens = 600, tools }) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature,
          max_tokens: maxTokens,
          ...(tools && tools.length > 0 ? { tools } : {}),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'OpenAI request failed');
      }

      const data = await response.json();
      return {
        provider: 'openai',
        content: data.choices[0]?.message?.content || '',
        toolCalls: data.choices[0]?.message?.tool_calls || [],
        usage: data.usage,
      };
    } catch (err) {
      console.error('[OpenAIProvider Error]', err.message);
      throw err;
    }
  }

  async generateEmbedding(text) {
    if (!this.apiKey) throw new Error('OpenAI API key not configured');

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
        input: text,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'OpenAI embedding request failed');
    }

    const data = await response.json();
    return data.data?.[0]?.embedding || [];
  }
}

class MockAIProvider extends AIProvider {
  constructor() {
    super();
  }

  async generateCompletion({ messages, agent, knowledgeChunks = [] }) {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
    const lowerText = lastUserMessage.toLowerCase();

    // Intent detection heuristics for intelligent receptionist demo
    let reply = '';
    let triggeredTool = null;
    let toolPayload = null;

    if (
      lowerText.includes('book') ||
      lowerText.includes('appointment') ||
      lowerText.includes('schedule') ||
      lowerText.includes('consultation') ||
      lowerText.includes('time')
    ) {
      reply = `I would be delighted to schedule a consultation with our team! I have available slots tomorrow at 10:00 AM, 2:00 PM, or 4:30 PM. Which time works best for you?`;
      triggeredTool = 'checkAvailability';
      toolPayload = { requestedDate: 'tomorrow' };
    } else if (
      lowerText.includes('price') ||
      lowerText.includes('pricing') ||
      lowerText.includes('cost') ||
      lowerText.includes('fee') ||
      lowerText.includes('plan')
    ) {
      reply = knowledgeChunks.length > 0
        ? `${knowledgeChunks.map((chunk) => chunk.content).slice(0, 2).join(' ')} Would you like help choosing the right option?`
        : `I do not have a verified pricing detail for that yet. I can take your contact details and have a specialist follow up with an accurate quote.`;
      triggeredTool = 'searchKnowledge';
      toolPayload = { query: 'pricing plans' };
    } else if (
      lowerText.includes('transfer') ||
      lowerText.includes('human') ||
      lowerText.includes('speak to a person') ||
      lowerText.includes('representative') ||
      lowerText.includes('manager')
    ) {
      reply = `Certainly! I will connect you right away with our senior support team. Please stay on the line for just a moment while I transfer your call.`;
      triggeredTool = 'transferCall';
      toolPayload = { reason: 'Caller requested human agent' };
    } else if (
      lowerText.includes('service') ||
      lowerText.includes('what do you do') ||
      lowerText.includes('help me') ||
      lowerText.includes('feature')
    ) {
      const knowledgeSummary = knowledgeChunks.length > 0 
        ? knowledgeChunks.map(c => c.content).slice(0, 2).join(' ') 
        : 'I do not have verified information about that service in my knowledge base yet.';
      reply = `We provide end-to-end automated customer operations: ${knowledgeSummary}. We ensure you never miss another customer inquiry! Could I get your name and email to send over our product deck?`;
      triggeredTool = 'getBusinessInfo';
    } else if (
      lowerText.includes('my name is') ||
      lowerText.includes('i am') ||
      lowerText.includes('@') ||
      lowerText.includes('phone') ||
      lowerText.includes('email')
    ) {
      reply = `Thank you so much! I have securely recorded your information in our client system. One of our specialists will follow up with full details, and you will receive a confirmation message shortly.`;
      triggeredTool = 'createLead';
      toolPayload = { message: lastUserMessage };
    } else if (
      lowerText.includes('hello') ||
      lowerText.includes('hi') ||
      lowerText.includes('hey') ||
      lowerText.trim() === ''
    ) {
      const agentName = agent?.name || 'Sarah';
      reply = `Hello! Thank you for contacting us. My name is ${agentName}, your AI Receptionist. How can I help you today?`;
    } else {
      reply = `Thank you for asking about that. Based on our company guidelines, our team handles this with dedicated priority. Would you like me to book a quick 15-minute discovery call to review your specific requirements, or would you prefer I connect you directly with a representative?`;
    }

    return {
      provider: 'mock',
      content: reply,
      triggeredTool,
      toolPayload,
      usage: { prompt_tokens: 45, completion_tokens: 38, total_tokens: 83 },
    };
  }

  async generateEmbedding(text) {
    const dimensions = 64;
    const vector = Array(dimensions).fill(0);
    const tokens = String(text || '').toLowerCase().match(/[a-z0-9$₹]+/g) || [];

    tokens.forEach((token) => {
      let hash = 2166136261;
      for (let index = 0; index < token.length; index += 1) {
        hash ^= token.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
      }
      vector[Math.abs(hash) % dimensions] += 1;
    });

    const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
    return vector.map((value) => value / magnitude);
  }
}

module.exports = {
  AIProvider,
  OpenAIProvider,
  MockAIProvider,
};
