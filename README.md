# FSR Assistant

Internal AI assistant for Fair and Square Roofing. Wraps the OpenAI Responses
API with a vector store (supplier pricing) and the GoHighLevel MCP server
(read-only access to contacts, opportunities, calendars, etc.).

## Features

- Chat UI with neon-rain theme
- File-search over a supplier-pricing vector store
- Read-only GHL MCP integration (contacts, opportunities, calendars, blogs,
  social-media-posting reads, locations, payments, email templates)
- Basic-auth gate on every request

## Setup

```bash
npm install
cp .env.example .env.local
# fill in .env.local
npm run dev
```

Open http://localhost:3000 — the browser will prompt for the credentials you
set in `.env.local`.

## Environment variables

| Variable                  | Purpose                                            |
| ------------------------- | -------------------------------------------------- |
| `OPENAI_API_KEY`          | OpenAI key used for the Responses API call         |
| `OPENAI_VECTOR_STORE_ID`  | Vector store ID for supplier pricing knowledge     |
| `GHL_MCP_AUTH_TOKEN`      | Bearer token for the GHL MCP server                |
| `FSR_GHL_LOCATION_ID`     | GHL location/sub-account ID (auto-injected)        |
| `APP_USERNAME`            | Basic-auth username                                |
| `APP_PASSWORD`            | Basic-auth password (use a long random string)     |

All six must be set on Vercel for the deployment to function. Also, since
this app uses `proxy.ts` (Next 16 convention, formerly `middleware.ts`), the
auth gate replaces the old middleware filename.

## Security notes

- Every request goes through `proxy.ts`, which enforces HTTP Basic Auth
  using `APP_USERNAME` / `APP_PASSWORD`. Without valid credentials the page
  and the `/api/chat` endpoint return 401.
- The MCP `allowed_tools` list is **read-only by default**. Write tools
  (create/update/upsert contacts, send messages, post to social, create blog
  posts, edit templates) are intentionally excluded — they should live behind
  their own approval flow, not a public chat endpoint.
- API keys stay server-side. The client only sees the assistant text and a
  response ID for conversation continuity.

## Stack

- Next.js 16 (App Router)
- React 19
- OpenAI Node SDK (Responses API)
- Vercel for hosting

## Deployment

Push to GitHub; import into Vercel; add the env vars above in Project
Settings → Environment Variables.
