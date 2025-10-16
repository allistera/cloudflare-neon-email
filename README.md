# Cloudflare Email Worker with Neon Database

Cloudflare Email Worker that stores incoming emails in a Neon PostgreSQL database and forwards them to a specified address.

## Setup

1. Install dependencies:
```bash
npm install
```
   This installs wrangler as a dev dependency. Use it via `npx wrangler` or through npm scripts.

2. Set up your Neon database:
   - Create a new Neon project at https://neon.tech
   - Run the SQL in `schema.sql` to create the emails table
   - Copy your database connection string

3. Configure secrets:
```bash
npx wrangler secret put DATABASE_URL
# Paste your Neon connection string when prompted
```

4. Configure email routing in Cloudflare:
   - Go to your Cloudflare dashboard
   - Navigate to Email Routing
   - Add a custom address and route it to this worker

## Development

```bash
npm run dev
```

## Deployment

### Prerequisites

1. Authenticate with Cloudflare:
```bash
npx wrangler login
```

2. Ensure secrets are configured (if not done during setup):
```bash
npx wrangler secret put DATABASE_URL
# Paste your Neon connection string when prompted
```

### Deploy to Production

Deploy the worker to Cloudflare:
```bash
npm run deploy
```

Or using wrangler directly:
```bash
npx wrangler deploy
```

### Deploy to Specific Environment

If you have multiple environments configured in `wrangler.toml`:
```bash
npx wrangler deploy --env production
```

### Verify Deployment

After deployment, wrangler will output the worker URL. You can also check:
```bash
npx wrangler deployments list
```

### Configure Email Routing

After deploying, configure email routing in Cloudflare Dashboard:
1. Go to your domain in Cloudflare Dashboard
2. Navigate to Email > Email Routing
3. Enable Email Routing if not already enabled
4. Add a custom address (e.g., `hello@yourdomain.com`)
5. Set the action to "Send to a Worker"
6. Select `cloudflare-neon-email` worker

### Tail Logs

Monitor real-time logs:
```bash
npx wrangler tail
```

## Environment Variables

- `DATABASE_URL` (secret): Neon database connection string
- `FORWARD_EMAIL`: Email address to forward messages to

### Configuring FORWARD_EMAIL

The `FORWARD_EMAIL` variable specifies where incoming emails should be forwarded after being stored in the database.

**Option 1: Set in wrangler.toml (Recommended)**

Add or modify the environment variable in `wrangler.toml`:

```toml
[env.production.vars]
FORWARD_EMAIL = "your-email@example.com"
```

For different environments:
```toml
[vars]
FORWARD_EMAIL = "dev@example.com"

[env.production.vars]
FORWARD_EMAIL = "prod@example.com"
```

**Option 2: Set via Wrangler CLI**

```bash
npx wrangler secret put FORWARD_EMAIL
# Enter the email address when prompted
```

Note: Using the CLI stores it as a secret (encrypted), while setting it in `wrangler.toml` stores it as a plain environment variable. For email addresses, using `wrangler.toml` is typically sufficient.
