import { neon } from '@neondatabase/serverless';
import PostalMime from 'postal-mime';

export interface Env {
  DATABASE_URL: string;
  FORWARD_EMAIL: string;
}

interface ParsedEmail {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  receivedAt: Date;
  read: boolean;
}

async function storeEmail(env: Env, email: ParsedEmail): Promise<void> {
  const sql = neon(env.DATABASE_URL);

  await sql`
    INSERT INTO emails (from_address, to_address, subject, text_body, html_body, received_at, read)
    VALUES (
      ${email.from},
      ${email.to},
      ${email.subject},
      ${email.text},
      ${email.html},
      ${email.receivedAt},
      ${email.read}
    )
  `;
}

export default {
  async email(message: ForwardableEmailMessage, env: Env): Promise<void> {
    try {
      const parser = new PostalMime();
      const rawEmail = await new Response(message.raw).text();
      const parsed = await parser.parse(rawEmail);

      const email: ParsedEmail = {
        from: parsed.from?.address || 'unknown',
        to: parsed.to?.[0]?.address || 'unknown',
        subject: parsed.subject || '(no subject)',
        text: parsed.text || '',
        html: parsed.html || '',
        receivedAt: new Date(),
        read: false,
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
