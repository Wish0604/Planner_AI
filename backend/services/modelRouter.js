import { getGemini } from "../config/gemini.js";
import { modelConfig } from "../config/models.js";
import { callLlama } from "./llamaClient.js";
import { callGemini } from "./geminiClient.js";

// ModelRouter selects provider and model per task, with fallback chain
export class ModelRouter {
  constructor(config = modelConfig) {
    this.config = config;
  }

  // Determine provider order based on task/domain/cost
  route({ taskType, domain, costTier = 'standard' }) {
    // Default strategy
    const strategy = [];

    // Planner prefers Gemini
    if (taskType === 'planning') {
      strategy.push('gemini');
      strategy.push('llama');
    } else if (domain === 'code') {
      strategy.push('llama');
      strategy.push('gemini');
    } else if (domain === 'devops' || domain === 'risk') {
      strategy.push('gemini');
      strategy.push('llama');
    } else {
      strategy.push('gemini');
      strategy.push('llama');
    }

    // Local/cheap tier when requested
    if (costTier === 'cheap' && this.config.providers.local?.enabled) {
      strategy.unshift('local');
    }

    // Ensure unique order
    const unique = Array.from(new Set(strategy));
    return unique;
  }

  // Attempt to get a model with fallback chain
  async getModelForTask({ taskType, domain, costTier = 'standard' }) {
    const providers = this.route({ taskType, domain, costTier });
    const errors = [];

    for (const provider of providers) {
      try {
        const client = await this.getClient(provider);
        return { provider, model: client };
      } catch (err) {
        errors.push({ provider, message: err.message });
        continue;
      }
    }

    throw new Error(`No provider available. Tried: ${providers.join(', ')} | ${errors.map(e => `${e.provider}:${e.message}`).join('; ')}`);
  }

  // Map provider to actual client/model instance
  async getClient(provider) {
    switch (provider) {
      case 'gemini': {
        const genAI = await getGemini();
        return genAI.getGenerativeModel({ model: this.config.providers.gemini.model });
      }
      case 'llama': {
        if (!this.config.providers.llama.enabled) {
          throw new Error('llama provider not configured');
        }
        return new LlamaModelAdapter({
          endpoint: this.config.providers.llama.endpoint,
          apiKey: this.config.providers.llama.apiKey,
          model: this.config.providers.llama.model || 'llama-3',
        });
      }
      case 'local': {
        throw new Error('local provider not configured');
      }
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }
}

// Simple prompt-based router that returns { model, output }
function isCodeHeavy(text) {
  return /(code|api|docker|kubernetes|sql|backend|cloud run|firebase|react|node)/i.test(text || '');
}

export async function routeModel(prompt) {
  const messages = [
    { role: "system", content: "You are a senior software architect." },
    { role: "user", content: prompt }
  ];

  if (isCodeHeavy(prompt)) {
    const llama = await callLlama(messages);
    if (llama) return { model: "llama", output: llama };
  }

  const gemini = await callGemini(prompt);
  return { model: "gemini", output: gemini };
}

// Minimal adapter so Llama chat API matches the Gemini generateContent interface
class LlamaModelAdapter {
  constructor({ endpoint, apiKey, model }) {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateContent(prompt) {
    const body = {
      model: this.model,
      messages: [
        {
          role: 'user',
          content: typeof prompt === 'string' ? prompt : JSON.stringify(prompt)
        }
      ]
    };

    const headers = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;

    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`llama request failed (${res.status}): ${text}`);
    }

    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content || json?.choices?.[0]?.text || '';

    return {
      response: {
        text: () => content
      }
    };
  }
}
