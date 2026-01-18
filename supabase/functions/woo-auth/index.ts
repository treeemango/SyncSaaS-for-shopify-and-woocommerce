import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()

    // 1. Initiate Flow (called by frontend)
    if (path === 'initiate') {
        const storeUrl = url.searchParams.get('store_url')
        if (!storeUrl) return new Response('Missing store_url', { status: 400 })

        // Get user from auth header
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) return new Response('Unauthorized', { status: 401 })

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        )
        const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
        if (userError || !user) return new Response('Unauthorized', { status: 401 })

        // WooCommerce Authentication endpoint
        // https://github.com/woocommerce/woocommerce/wiki/WooCommerce-REST-API-External-Authentication-Endpoint-(v2)
        const appName = "SyncSaaS"
        const scope = "read_write"
        const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'
        const returnUrl = `${frontendUrl}/dashboard?success=true`
        // Sanitize store URL (remove trailing slash)
        const cleanStoreUrl = storeUrl.replace(/\/$/, '');

        // Force HTTPS for the callback URL by using the project ID
        // Supabase Edge Functions always run on HTTPS
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1];
        const callbackUrl = `https://${projectRef}.supabase.co/functions/v1/woo-auth?user_id=${user.id}&store_url=${encodeURIComponent(cleanStoreUrl)}`;

        // Encode the URLs properly
        const encodedReturnUrl = encodeURIComponent(returnUrl);
        const encodedCallbackUrl = encodeURIComponent(callbackUrl);

        const authUrl = `${cleanStoreUrl}/wc-auth/v1/authorize?app_name=${encodeURIComponent(appName)}&scope=${scope}&user_id=${user.id}&return_url=${encodedReturnUrl}&callback_url=${encodedCallbackUrl}`

        return new Response(JSON.stringify({ url: authUrl }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }

    // 2. Callback Flow (WooCommerce sends keys via POST)
    if (req.method === 'POST') {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        try {
            const body = await req.json()
            const { consumer_key, consumer_secret } = body

            const userId = url.searchParams.get('user_id')
            const storeUrl = url.searchParams.get('store_url')

            if (!userId || !storeUrl) {
                console.error('Missing userId or storeUrl in callback params')
                return new Response('Missing callback params', { status: 400 })
            }

            const { error } = await supabase
                .from('integrations')
                .upsert({
                    platform: 'woocommerce',
                    store_url: storeUrl,
                    access_token: consumer_key,
                    refresh_token: consumer_secret,
                    user_id: userId,
                    status: 'active'
                })

            if (error) throw error

            return new Response(JSON.stringify({ success: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        } catch (err) {
            console.error('Woo callback error:', err)
            return new Response((err as Error).message, { status: 400 })
        }
    }

    return new Response("Method not allowed", { status: 405 })
})
