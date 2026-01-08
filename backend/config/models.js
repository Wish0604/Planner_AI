// Model configuration for multi-LLM routing
// Note: Llama/local providers are stubbed; add real endpoints/keys when available.
export const modelConfig = {
  providers: {
    gemini: {
      name: 'gemini',
      model: 'gemini-2.0-flash',
      enabled: true
    },
    llama: {
      name: 'llama3',
      enabled: !!process.env.LLAMA_API_KEY || !!process.env.LLAMA_ENDPOINT,
      endpoint: process.env.LLAMA_ENDPOINT || 'http://localhost:8000/v1/chat/completions',
      apiKey: process.env.LLAMA_API_KEY || '',
      model: process.env.LLAMA_MODEL || 'llama-3'
    },
    local: {
      name: 'local',
      enabled: false,
      // Plug in your local model endpoint or path here
      endpoint: process.env.LOCAL_MODEL_ENDPOINT || '',
    }
  }
};
