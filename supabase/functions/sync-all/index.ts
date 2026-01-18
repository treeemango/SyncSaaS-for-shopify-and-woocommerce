import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createServiceRoleClient, hasValidCronSecret, syncIntegration, type IntegrationRow } from '../_shared/sync.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  // Only allow scheduled/automated callers.
  if (!hasValidCronSecret(req)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const supabase = createServiceRoleClient()

    const { data: integrations, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('status', 'active')

    if (error) throw error

    const results: Array<{ integration_id: string; count: number; error?: string }> = []

    for (const integration of (integrations || []) as IntegrationRow[]) {
      try {
        const r = await syncIntegration(integration)
        results.push(r)
      } catch (e) {
        results.push({ integration_id: integration.id, count: 0, error: (e as Error).message })
      }
    }

    const total = results.reduce((acc, r) => acc + r.count, 0)

    return new Response(
      JSON.stringify({ success: true, integrations: results.length, orders: total, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('sync-all error:', err)
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
