import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createServiceRoleClient, hasValidCronSecret, syncIntegration, type IntegrationRow } from '../_shared/sync.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { integration_id } = await req.json()
        if (!integration_id) return new Response("Missing integration_id", { status: 400, headers: corsHeaders })

        const isCron = hasValidCronSecret(req)
        const authHeader = req.headers.get('Authorization')

        if (!isCron && !authHeader) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Always read integration with service role.
        const supabase = createServiceRoleClient()
        const { data: integration, error: intError } = await supabase
            .from('integrations')
            .select('*')
            .eq('id', integration_id)
            .single()

        if (intError || !integration) {
            return new Response("Integration not found", { status: 404, headers: corsHeaders })
        }

        // If this is not a cron/internal call, enforce ownership via JWT.
        if (!isCron) {
            const userClient = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_ANON_KEY') ?? ''
            )
            const { data: { user }, error: userError } = await userClient.auth.getUser(
                authHeader!.replace('Bearer ', '')
            )
            if (userError || !user) {
                return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
            }

            if (user.id !== (integration as any).user_id) {
                return new Response(JSON.stringify({ error: 'Forbidden' }), {
                    status: 403,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
            }
        }

        const result = await syncIntegration(integration as IntegrationRow)

        return new Response(JSON.stringify({ success: true, ...result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    } catch (err) {
        console.error('Sync error:', err)
        return new Response(JSON.stringify({ error: (err as Error).message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
