import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.post('/', async (req: Request, res: Response) => {
  const { message, sessionId } = req.body;
  if (!message || !sessionId) {
    res.status(400).json({ message: 'message and sessionId are required' });
    return;
  }

  const webhookUrl = process.env.N8N_CHAT_WEBHOOK_URL;
  if (!webhookUrl) {
    res.status(500).json({ message: 'AI service not configured' });
    return;
  }

  try {
    const n8nRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sendMessage', sessionId, chatInput: message }),
    });

    const raw = await n8nRes.json() as any;
    const reply = Array.isArray(raw) ? raw[0]?.output : raw?.output;
    res.json({ data: { reply: reply ?? '' } });
  } catch (error) {
    console.error('[POST /admin/ai-chat]', error);
    res.status(500).json({ message: 'AI service error' });
  }
});

export default router;
