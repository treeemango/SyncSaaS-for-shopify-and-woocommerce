import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export type IntegrationRow = {
  id: string
  user_id: string
  platform: 'shopify' | 'woocommerce'
  store_url: string
  access_token: string
  refresh_token: string | null
  scope: string | null
  status: string | null
}

export type SyncResult = {
  integration_id: string
  count: number
}

export function createServiceRoleClient() {
  const url = Deno.env.get('SUPABASE_URL') ?? ''
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  return createClient(url, key)
}

export async function syncIntegration(integration: IntegrationRow): Promise<SyncResult> {
  const supabase = createServiceRoleClient()

  const orders: Array<Record<string, unknown>> = []

  if (integration.platform === 'shopify') {
    console.log('--- ATTEMPTING GRAPHQL SYNC ---');
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const query = `
      query getOrders($cursor: String) {
        orders(first: 50, after: $cursor, query: "created_at:>=${thirtyDaysAgo}") {
          edges {
            node {
              id
              createdAt
              totalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              displayFinancialStatus
              name
              billingAddress {
                name
              }
            }
          }
        }
      }
    `;

    const response = await fetch(`https://${integration.store_url}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': integration.access_token,
      },
      body: JSON.stringify({ query, variables: { cursor: null } }),
    });

    if (!response.ok) throw new Error(`Shopify GraphQL error: ${await response.text()}`);

    const { data, errors } = await response.json();
    if (errors) throw new Error(`Shopify GraphQL errors: ${JSON.stringify(errors)}`);

    orders.push(
      ...data.orders.edges.map(({ node: o }: any) => ({
        integration_id: integration.id,
        external_id: o.id.split('/').pop(), // Extract ID from gid://shopify/Order/123
        total_price: parseFloat(o.totalPriceSet.shopMoney.amount),
        currency: o.totalPriceSet.shopMoney.currencyCode,
        customer_name: o.billingAddress?.name || 'Guest',
        status: o.displayFinancialStatus.toLowerCase(),
        ordered_at: o.createdAt,
        raw_data: o,
      })),
    );
  } else if (integration.platform === 'woocommerce') {
    console.log('--- WOOCOMMERCE SYNC START ---');
    console.log('Store URL:', integration.store_url);

    if (!integration.refresh_token) throw new Error('Missing WooCommerce consumer_secret (refresh_token)')

    let baseUrl = integration.store_url
    try {
      const parsed = new URL(integration.store_url)
      baseUrl = `${parsed.origin}${parsed.pathname}`.replace(/\/+$/, '')
    } catch {
      baseUrl = integration.store_url.replace(/\/+$/, '')
    }

    const lastSync = (integration as any).last_sync_at
    const fallbackWindowDays = 180
    const after = lastSync
      ? new Date(lastSync).toISOString()
      : new Date(Date.now() - fallbackWindowDays * 24 * 60 * 60 * 1000).toISOString()
    const auth = btoa(`${integration.access_token}:${integration.refresh_token}`)
    const apiPath = `/wp-json/wc/v3/orders?after=${encodeURIComponent(after)}&per_page=100&status=any`
    const apiUrl = `${baseUrl}${apiPath}`

    console.log('API URL:', `${baseUrl}/wp-json/wc/v3/orders?...`);

    let response = await fetch(apiUrl, {
      headers: { Authorization: `Basic ${auth}` },
    })

    if (response.status === 401 || response.status === 403) {
      // Some hosts block Authorization headers; retry with query params.
      const apiUrlWithKeys = `${apiUrl}&consumer_key=${encodeURIComponent(integration.access_token)}&consumer_secret=${encodeURIComponent(integration.refresh_token)}`
      response = await fetch(apiUrlWithKeys)
    }

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('WooCommerce API error response:', errorText);
      throw new Error(`WooCommerce API error: ${errorText}`)
    }

    const data = await response.json()
    console.log('WooCommerce orders fetched:', data.length);

    orders.push(
      ...data.map((o: any) => ({
        integration_id: integration.id,
        external_id: String(o.id),
        total_price: parseFloat(o.total),
        currency: o.currency,
        customer_name: o.billing
          ? `${o.billing.first_name || ''} ${o.billing.last_name || ''}`.trim() || 'Guest'
          : 'Guest',
        status: o.status,
        ordered_at: o.date_created,
        raw_data: o,
      })),
    )
    console.log('--- WOOCOMMERCE SYNC END ---');
  }

  if (orders.length > 0) {
    const { error: upsertError } = await supabase
      .from('orders')
      .upsert(orders, { onConflict: 'integration_id, external_id' })

    if (upsertError) throw upsertError
  }

  await supabase
    .from('integrations')
    .update({ last_sync_at: new Date().toISOString() })
    .eq('id', integration.id)

  return { integration_id: integration.id, count: orders.length }
}

export function hasValidCronSecret(req: Request): boolean {
  const expected = Deno.env.get('CRON_SECRET')
  if (!expected) return false
  const got = req.headers.get('x-cron-secret')
  return Boolean(got && got === expected)
}
