import OpenAI from 'openai';

// Vercel function timeout. Hobby plan ignores anything > 10s; Pro plan
// supports up to 300s. The OpenAI Responses API + GHL MCP roundtrip can
// take a while when the model chains several tool calls, so we max it out.
export const maxDuration = 300;

const READ_ONLY_GHL_TOOLS = [
  'contacts_get-contact',
  'contacts_get-contacts',
  'contacts_get-all-tasks',
  'conversations_get-messages',
  'conversations_search-conversation',
  'opportunities_get-opportunity',
  'opportunities_search-opportunity',
  'opportunities_get-pipelines',
  'calendars_get-calendar-events',
  'calendars_get-appointment-notes',
  'blogs_get-blogs',
  'blogs_get-blog-post',
  'blogs_check-url-slug-exists',
  'blogs_get-all-categories-by-location',
  'blogs_get-all-blog-authors-by-location',
  'social-media-posting_get-post',
  'social-media-posting_get-posts',
  'social-media-posting_get-account',
  'social-media-posting_get-social-media-statistics',
  'locations_get-location',
  'locations_get-custom-fields',
  'payments_get-order-by-id',
  'payments_list-transactions',
  'emails_fetch-template',
] as const;

const PROMPT_ID = 'pmpt_69d83b4acee08196b41072d922dcf7770fa8d7349351607a';
const PROMPT_VERSION = '1';
const MCP_SERVER_URL = 'https://services.leadconnectorhq.com/mcp/';
const MAX_MESSAGE_LENGTH = 4000;

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export async function POST(req: Request) {
  let apiKey: string;
  let vectorStoreId: string;
  let ghlToken: string;
  try {
    apiKey = requireEnv('OPENAI_API_KEY');
    vectorStoreId = requireEnv('OPENAI_VECTOR_STORE_ID');
    ghlToken = requireEnv('GHL_MCP_AUTH_TOKEN');
  } catch (e) {
    return Response.json(
      { error: 'Server misconfigured', detail: (e as Error).message },
      { status: 500 },
    );
  }

  let body: { message?: unknown; previousResponseId?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) {
    return Response.json({ error: 'message is required' }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return Response.json(
      { error: `message too long (max ${MAX_MESSAGE_LENGTH} chars)` },
      { status: 400 },
    );
  }
  const previousResponseId =
    typeof body.previousResponseId === 'string' && body.previousResponseId.length > 0
      ? body.previousResponseId
      : undefined;

  const locationId = process.env.FSR_GHL_LOCATION_ID;

  const openai = new OpenAI({ apiKey });

  // Prepend a system instruction with the GHL location ID so the model
  // doesn't have to ask for it on every tool call. Skipped on continuation
  // turns — the previous response already has the context.
  const inputMessages: Array<{ role: 'system' | 'user'; content: string }> = [];
  if (locationId && !previousResponseId) {
    inputMessages.push({
      role: 'system',
      content: `The active GoHighLevel location/sub-account ID is "${locationId}". Use this whenever a GHL tool requires a locationId or location_id parameter. Do not ask the user for it.`,
    });
  }
  inputMessages.push({ role: 'user', content: message });

  // The OpenAI SDK's public types don't yet model (a) the `mcp` tool variant
  // and (b) prompt-template IDs that imply the model, so we cast through
  // `unknown` at the boundary. The runtime contract is correct.
  const params = {
    prompt: { id: PROMPT_ID, version: PROMPT_VERSION },
    input: inputMessages,
    reasoning: { summary: 'auto' },
    ...(previousResponseId && { previous_response_id: previousResponseId }),
    tools: [
      {
        type: 'file_search',
        vector_store_ids: [vectorStoreId],
      },
      {
        type: 'mcp',
        server_label: 'FSR_MCP_GHL_Server',
        server_url: MCP_SERVER_URL,
        authorization: ghlToken,
        require_approval: 'never',
        allowed_tools: [...READ_ONLY_GHL_TOOLS],
      },
    ],
    store: true,
    stream: false as const,
  };

  try {
    const response = (await openai.responses.create(
      params as unknown as Parameters<typeof openai.responses.create>[0],
    )) as unknown as { output_text?: string; id: string };

    return Response.json({
      text: response.output_text ?? 'No response.',
      responseId: response.id,
    });
  } catch (e) {
    console.error('chat upstream error', e);
    return Response.json(
      { error: 'Upstream error', detail: (e as Error).message },
      { status: 502 },
    );
  }
}
