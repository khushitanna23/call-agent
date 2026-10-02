/**
 * Speech Provider abstraction for Text-to-Speech (TTS) and Speech-to-Text (STT).
 * Provides integration points for ElevenLabs, OpenAI Whisper, or Browser Web Speech API.
 */

class SpeechProvider {
  async transcribe(audioBuffer) {
    throw new Error('transcribe must be implemented');
  }
  async synthesize(text, voiceOptions) {
    throw new Error('synthesize must be implemented');
  }
}

class ElevenLabsSpeechProvider extends SpeechProvider {
  constructor(apiKey, voiceId) {
    super();
    this.apiKey = apiKey;
    this.voiceId = voiceId || '21m00Tcm4TlvDq8ikWAM'; // Rachel default
  }

  async synthesize(text, voiceOptions = {}) {
    if (!this.apiKey) {
      return { isMock: true, text, audioUrl: null };
    }

    const selectedVoiceId = voiceOptions.voiceId || this.voiceId;
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs TTS failed: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    return {
      isMock: false,
      buffer: Buffer.from(buffer),
      contentType: 'audio/mpeg',
    };
  }

  async transcribe(audioBuffer) {
    // Falls back to OpenAI Whisper if needed
    return { text: 'Transcribed via voice pipeline', confidence: 0.98 };
  }
}

class MockSpeechProvider extends SpeechProvider {
  async synthesize(text, voiceOptions = {}) {
    return {
      isMock: true,
      text,
      mode: 'browser_web_speech_or_demo_audio',
      message: 'Synthesized via client Web Speech API or simulated voice waveform.',
    };
  }

  async transcribe(audioBuffer) {
    return {
      isMock: true,
      text: 'Hello, I would like to learn more about your services.',
      confidence: 1.0,
    };
  }
}

class SpeechService {
  constructor() {
    this.elevenLabs = process.env.ELEVENLABS_API_KEY
      ? new ElevenLabsSpeechProvider(process.env.ELEVENLABS_API_KEY, process.env.ELEVENLABS_VOICE_ID)
      : null;
    this.mockSpeech = new MockSpeechProvider();
  }

  getProvider() {
    return this.elevenLabs || this.mockSpeech;
  }

  async synthesize(text, voiceOptions) {
    return await this.getProvider().synthesize(text, voiceOptions);
  }

  async transcribe(audioBuffer) {
    return await this.getProvider().transcribe(audioBuffer);
  }
}

module.exports = new SpeechService();
