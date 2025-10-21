import { neon } from '@neondatabase/serverless';
import PostalMime from 'postal-mime';
import Anthropic from '@anthropic-ai/sdk';

export interface Env {
  DATABASE_URL: string;
  FORWARD_EMAIL: string;
  ANTHROPIC_API_KEY: string;
}

interface ParsedEmail {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  receivedAt: Date;
  read: boolean;
  spam: boolean;
  tags: string[];
}

interface EmailAnalysis {
  isSpam: boolean;
  tags: string[];
}

async function analyzeEmailWithClaude(
  env: Env,
  from: string,
  subject: string,
  text: string
): Promise<EmailAnalysis> {
  const anthropic = new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
  });

  const prompt = `Analyze this email and determine:
1. Is it spam? (yes/no)
2. Which tags apply from: Financial, Follow Up, Newsletter, Notification, Personal, Promotional, Work

Email details:
From: ${from}
Subject: ${subject}
Body: ${text.substring(0, 2000)}

Respond in JSON format:
{
  "isSpam": boolean,
  "tags": ["tag1", "tag2", ...]
}`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}';
  const analysis = JSON.parse(responseText);

  return {
    isSpam: analysis.isSpam || false,
    tags: analysis.tags || [],
  };
}

async function storeEmail(env: Env, email: ParsedEmail): Promise<void> {
  const sql = neon(env.DATABASE_URL);

  await sql`
    INSERT INTO emails (from_address, to_address, subject, text_body, html_body, received_at, read, spam, tags)
    VALUES (
      ${email.from},
      ${email.to},
      ${email.subject},
      ${email.text},
      ${email.html},
      ${email.receivedAt},
      ${email.read},
      ${email.spam},
      ${email.tags}
    )
  `;
}

export default {
  async email(message: ForwardableEmailMessage, env: Env): Promise<void> {
    try {
      const parser = new PostalMime();
      const rawEmail = await new Response(message.raw).text();
      const parsed = await parser.parse(rawEmail);

      let analysis: EmailAnalysis = { isSpam: false, tags: [] };

      try {
        analysis = await analyzeEmailWithClaude(
          env,
          parsed.from?.address || 'unknown',
          parsed.subject || '(no subject)',
          parsed.text || ''
        );
      } catch (aiError) {
        console.error('Claude analysis error (continuing without analysis):', aiError);
      }

      const email: ParsedEmail = {
        from: parsed.from?.address || 'unknown',
        to: parsed.to?.[0]?.address || 'unknown',
        subject: parsed.subject || '(no subject)',
        text: parsed.text || '',
        html: parsed.html || '',
        receivedAt: new Date(),
        read: false,
        spam: analysis.isSpam,
        tags: analysis.tags,
      };

      // Try to store in database, but don't let it block forwarding
      try {
        await storeEmail(env, email);
      } catch (dbError) {
        console.error('Database error (continuing with forward):', dbError);
      }

      // Always forward the email regardless of database success
      const forwardEmail = env.FORWARD_EMAIL;

      if (!forwardEmail || !forwardEmail.includes('@')) {
        throw new Error(`Invalid FORWARD_EMAIL: ${forwardEmail}`);
      }

      await message.forward(forwardEmail);
    } catch (error) {
      console.error('Error processing email:', error);
      message.setReject(`Failed to process email: ${error}`);
    }
  },
};
