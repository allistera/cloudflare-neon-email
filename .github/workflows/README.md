# GitHub Actions Workflow

## Required Secrets

To enable automatic deployment, configure these secrets in your GitHub repository settings (`Settings` → `Secrets and variables` → `Actions`):

### CLOUDFLARE_API_TOKEN
- Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
- Create a new API token with `Workers Scripts:Edit` permissions
- Add the token as a repository secret

### CLOUDFLARE_ACCOUNT_ID
- Find your account ID in the Cloudflare Dashboard (right sidebar on any page)
- Add it as a repository secret

## Workflow Behavior

The workflow automatically triggers on every push to the `main` branch and:
1. Runs TypeScript type checking
2. Deploys to Cloudflare Workers if linting passes
