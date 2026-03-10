import express from 'express';
import pool from '../db';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

// Greeting endpoint - get initial bot message
router.post('/greeting', async (req, res) => {
  try {
    const { flowId } = req.body;

    if (!flowId) {
      return res.status(400).json({ error: 'flowId is required' });
    }

    // Get flow configuration
    const flowResult = await pool.query(
      'SELECT * FROM flows WHERE id = $1',
      [flowId]
    );

    if (flowResult.rows.length === 0) {
      return res.status(404).json({ error: 'Flow not found' });
    }

    const flow = flowResult.rows[0];
    const systemPrompt = flow.system_prompt || 'You are a helpful AI assistant.';

    console.log(`[Chat Greeting] Flow: ${flow.name}`);

    // Call Gemini API for initial greeting
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: {
        role: 'system',
        parts: [{ text: systemPrompt }],
      },
    });

    const result = await model.generateContent('Start the conversation with a greeting. Introduce yourself and ask how you can help.');
    const response = result.response;
    const text = response.text();

    res.json({
      response: text,
      flowId,
    });
  } catch (error: any) {
    console.error('[Chat Greeting] Error:', error);

    if (error.status === 429) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests to Gemini API. Please wait a moment and try again.',
        details: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to get greeting',
      message: error.message || 'An error occurred',
      details: error.statusText || error.message
    });
  }
});

// Chat endpoint - text-based conversation
router.post('/', async (req, res) => {
  try {
    const { flowId, message } = req.body;

    if (!flowId || !message) {
      return res.status(400).json({ error: 'flowId and message are required' });
    }

    // Get flow configuration
    const flowResult = await pool.query(
      'SELECT * FROM flows WHERE id = $1',
      [flowId]
    );

    if (flowResult.rows.length === 0) {
      return res.status(404).json({ error: 'Flow not found' });
    }

    const flow = flowResult.rows[0];
    const systemPrompt = flow.system_prompt || 'You are a helpful AI assistant.';

    console.log(`[Chat] Flow: ${flow.name}`);
    console.log(`[Chat] System Prompt: ${systemPrompt.substring(0, 150)}...`);

    // Call Gemini API directly for chat
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: {
        role: 'system',
        parts: [{ text: systemPrompt }],
      },
    });

    const result = await model.generateContent(message);
    const response = result.response;
    const text = response.text();

    res.json({
      response: text,
      flowId,
    });
  } catch (error: any) {
    console.error('[Chat API] Error:', error);

    // Handle rate limiting
    if (error.status === 429) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests to Gemini API. Please wait a moment and try again.',
        details: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to process chat message',
      message: error.message || 'An error occurred',
      details: error.statusText || error.message
    });
  }
});

export default router;
