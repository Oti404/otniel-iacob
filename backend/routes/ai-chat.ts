import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

const chatSchema = z.object({
  message: z.string().min(1).max(5000),
  sessionId: z.string().uuid(),
});

router.post('/', async (req: Request, res: Response) => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.errors[0]?.message ?? 'Validation error' });
    return;
  }

  const { message, sessionId } = parsed.data;

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

    if (!n8nRes.ok) {
      res.status(502).json({ message: 'AI service unavailable' });
      return;
    }

    const raw = await n8nRes.json() as unknown;
    let reply = '';
    if (Array.isArray(raw) && typeof (raw[0] as Record<string, unknown>)?.output === 'string') {
      reply = (raw[0] as Record<string, unknown>).output as string;
    } else if (raw && typeof raw === 'object' && typeof (raw as Record<string, unknown>).output === 'string') {
      reply = (raw as Record<string, unknown>).output as string;
    }

    res.json({ data: { reply } });
  } catch (error) {
    console.error('[POST /admin/ai-chat]', error);
    res.status(500).json({ message: 'AI service error' });
  }
});

export default router;
