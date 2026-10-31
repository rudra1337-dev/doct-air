import test from 'node:test';
import assert from 'node:assert/strict';
import { GEMINI_MODEL, AI_MODEL, GEMINI_TEMPERATURE, GEMINI_MAX_OUTPUT_TOKENS } from '../src/config/env.js';
import { getGeminiConfig } from '../src/modules/ai/gemini/gemini.config.js';
import { geminiService } from '../src/modules/ai/index.js';

test('AI Model Configuration and Gemma 4 Consistency Suite', async (t) => {
  await t.test('1. Environment exports GEMINI_MODEL and AI_MODEL as Gemma 4', () => {
    assert.equal(GEMINI_MODEL, 'gemma-4-26b-a4b-it');
    assert.equal(AI_MODEL, 'gemma-4-26b-a4b-it');
    assert.equal(GEMINI_TEMPERATURE, 0.3);
    assert.equal(GEMINI_MAX_OUTPUT_TOKENS, 1024);
  });

  await t.test('2. getGeminiConfig resolves to Gemma 4 with zero legacy Gemini fallback', () => {
    const config = getGeminiConfig();
    assert.equal(config.model, 'gemma-4-26b-a4b-it');
    assert.equal(config.model.includes('gemini'), false, 'Must not fall back to any legacy gemini model');
  });

  await t.test('3. geminiService.getActiveConfig exposes model as Gemma 4 without leaking credentials', () => {
    const active = geminiService.getActiveConfig();
    assert.equal(active.model, 'gemma-4-26b-a4b-it');
    assert.equal(active.isConfigured, true);
    assert.equal(active.temperature, 0.3);
    assert.equal(active.maxOutputTokens, 1024);
    assert.equal(active.apiKey, undefined, 'API key must not be leaked');
  });

  await t.test('4. geminiService.generateResponse passes Gemma 4 model to client SDK', async () => {
    let capturedParams = null;
    const mockClient = {
      models: {
        generateContent: async (params) => {
          capturedParams = params;
          return {
            text: '{"status": "ok"}',
            candidates: [{ finishReason: 'STOP' }],
            usageMetadata: {
              promptTokenCount: 15,
              candidatesTokenCount: 5,
              totalTokenCount: 20,
            },
          };
        },
      },
    };

    const res = await geminiService.generateResponse({
      messages: [{ role: 'user', content: 'Patient reports mild headache.' }],
      client: mockClient,
      config: {
        responseMimeType: 'application/json',
      },
    });

    assert.ok(capturedParams, 'AI client generateContent was invoked');
    assert.equal(capturedParams.model, 'gemma-4-26b-a4b-it');
    assert.equal(capturedParams.config.responseMimeType, 'application/json');
    assert.equal(capturedParams.config.temperature, 0.3);
    assert.equal(capturedParams.config.maxOutputTokens, 1024);
    assert.equal(res.model, 'gemma-4-26b-a4b-it');
    assert.equal(res.finishReason, 'STOP');
  });

  await t.test('5. geminiService.generateStream passes Gemma 4 model to client SDK', async () => {
    let capturedParams = null;
    const mockClient = {
      models: {
        generateContentStream: async (params) => {
          capturedParams = params;
          return (async function* () {
            yield { text: 'Hello ', candidates: [{ finishReason: null }] };
            yield { text: 'patient.', candidates: [{ finishReason: 'STOP' }] };
          })();
        },
      },
    };

    const stream = geminiService.generateStream({
      messages: [{ role: 'user', content: 'Hello doctor' }],
      client: mockClient,
    });

    let fullText = '';
    for await (const chunk of stream) {
      fullText += chunk.delta || '';
    }

    assert.ok(capturedParams, 'AI client generateContentStream was invoked');
    assert.equal(capturedParams.model, 'gemma-4-26b-a4b-it');
    assert.equal(capturedParams.config.temperature, 0.3);
    assert.equal(capturedParams.config.maxOutputTokens, 1024);
    assert.equal(fullText, 'Hello patient.');
  });

  await t.test('6. Document RAG context works seamlessly with Gemma 4 alternating turns', async () => {
    let capturedParams = null;
    const mockClient = {
      models: {
        generateContent: async (params) => {
          capturedParams = params;
          return {
            text: 'I see your CBC report indicates normal hemoglobin.',
            candidates: [{ finishReason: 'STOP' }],
          };
        },
      },
    };

    await geminiService.generateResponse({
      messages: [{ role: 'user', content: 'What does my test say?' }],
      documentContext: '=== MEDICAL REPORT: CBC normal ===',
      client: mockClient,
    });

    assert.ok(capturedParams);
    assert.equal(capturedParams.model, 'gemma-4-26b-a4b-it');
    assert.equal(capturedParams.contents.length, 3);
    assert.equal(capturedParams.contents[0].role, 'user');
    assert.equal(capturedParams.contents[0].parts[0].text, '=== MEDICAL REPORT: CBC normal ===');
    assert.equal(capturedParams.contents[1].role, 'model');
    assert.equal(capturedParams.contents[2].role, 'user');
    assert.equal(capturedParams.contents[2].parts[0].text, 'What does my test say?');
  });
});
