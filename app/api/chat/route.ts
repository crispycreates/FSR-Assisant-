import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const maxDuration = 60;

export async function POST(req: Request) {
  const { message, previousResponseId } = await req.json();

  const response = await openai.responses.create({
    prompt: {
      id: 'pmpt_69d83b4acee08196b41072d922dcf7770fa8d7349351607a',
      version: '1',
    },
    input: [{ role: 'user', content: message }],
    reasoning: { summary: 'auto' },
    ...(previousResponseId && { previous_response_id: previousResponseId }),
    tools: [
      // ── Supplier Pricing Knowledge Base ──────────────────
      {
        type: 'file_search',
        vector_store_ids: [process.env.OPENAI_VECTOR_STORE_ID!],
      },
      // ── GHL MCP Server ───────────────────────────────────
      {
        type: 'mcp',
        server_label: 'FSR_MCP_GHL_Server',
        server_url: 'https://services.leadconnectorhq.com/mcp/',
        authorization: process.env.GHL_MCP_AUTH_TOKEN,
        require_approval: 'never',
        allowed_tools: [
          'contacts_get-contact',
          'contacts_get-contacts',
          'contacts_create-contact',
          'contacts_update-contact',
          'contacts_upsert-contact',
          'contacts_add-tags',
          'contacts_remove-tags',
          'contacts_get-all-tasks',
          'conversations_send-a-new-message',
          'conversations_get-messages',
          'conversations_search-conversation',
          'opportunities_get-opportunity',
          'opportunities_search-opportunity',
          'opportunities_update-opportunity',
          'opportunities_get-pipelines',
          'calendars_get-calendar-events',
          'calendars_get-appointment-notes',
          'blogs_get-blogs',
          'blogs_get-blog-post',
          'blogs_create-blog-post',
          'blogs_update-blog-post',
          'blogs_check-url-slug-exists',
          'blogs_get-all-categories-by-location',
          'blogs_get-all-blog-authors-by-location',
          'social-media-posting_create-post',
          'social-media-posting_edit-post',
          'social-media-posting_get-post',
          'social-media-posting_get-posts',
          'social-media-posting_get-account',
          'social-media-posting_get-social-media-statistics',
          'locations_get-location',
          'locations_get-custom-fields',
          'payments_get-order-by-id',
          'payments_list-transactions',
          'emails_fetch-template',
          'emails_create-template',
        ],
      } as any,
    ],
    store: true,
  } as any);

  return Response.json({
    text: (response as any).output_text ?? 'No response.',
    responseId: (response as any).id,
  });
}
