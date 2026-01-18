import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
}

function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
}

function jsonError(message: string, status = 500) {
    return json({ error: message }, status)
}

function getRequiredEnv(name: string): string | null {
    const value = Deno.env.get(name)
    if (!value) return null
    const trimmed = value.trim()
    return trimmed ? trimmed : null
}

serve(async (req: Request) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders })
    }

    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()

    const SHOPIFY_CLIENT_ID = getRequiredEnv('SHOPIFY_CLIENT_ID')
    const SHOPIFY_CLIENT_SECRET = getRequiredEnv('SHOPIFY_CLIENT_SECRET')
    const REDIRECT_URI = getRequiredEnv('SHOPIFY_REDIRECT_URI') || `${url.origin}/functions/v1/shopify-auth/callback`

    // 1. Install Flow
    if (path === 'install') {
        const shop = url.searchParams.get('shop')
        if (!shop) return new Response('Missing shop parameter', { status: 400, headers: corsHeaders })

        if (!SHOPIFY_CLIENT_ID) {
            return jsonError(
                'Shopify is not configured. Missing SHOPIFY_CLIENT_ID Supabase secret.',
                500,
            )
        }

        // Get user from auth header to associate with the integration
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) return new Response('Unauthorized: Missing auth header', { status: 401, headers: corsHeaders })

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        )
        const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
        if (userError || !user) return new Response('Unauthorized: Invalid token', { status: 401, headers: corsHeaders })

        // Use state to pass user_id and provide CSRF protection
        // In production, this should be a signed JWT or stored in a session
        const state = btoa(JSON.stringify({
            userId: user.id,
            nonce: Math.random().toString(36).substring(7)
        }))

        const scopes = 'read_orders,read_products'
        const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${encodeURIComponent(SHOPIFY_CLIENT_ID)}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${encodeURIComponent(state)}`

        return json({ url: installUrl })
    }

    // 2. Callback Flow
    if (path === 'callback') {
        const code = url.searchParams.get('code')
        const shop = url.searchParams.get('shop')
        const state = url.searchParams.get('state')

        if (!code || !shop || !state) return new Response('Missing params', { status: 400, headers: corsHeaders })

        if (!SHOPIFY_CLIENT_ID || !SHOPIFY_CLIENT_SECRET) {
            return jsonError(
                'Shopify is not configured. Missing SHOPIFY_CLIENT_ID/SHOPIFY_CLIENT_SECRET Supabase secrets.',
                500,
            )
        }

        // Decode state to get user_id
        let userId: string
        try {
            const decodedState = JSON.parse(atob(state))
            userId = decodedState.userId
            if (!userId) throw new Error('No user ID in state')
        } catch (e) {
            return new Response('Invalid state parameter', { status: 400, headers: corsHeaders })
        }

        // Exchange code for access token
        const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: SHOPIFY_CLIENT_ID,
                client_secret: SHOPIFY_CLIENT_SECRET,
                code,
            }),
        })

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.text()
            return new Response(`Token exchange failed: ${errorData}`, { status: 500, headers: corsHeaders })
        }

        const { access_token, scope } = await tokenResponse.json()

        // Store in Supabase
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { error } = await supabase
            .from('integrations')
            .upsert({
                platform: 'shopify',
                store_url: shop,
                access_token,
                scope,
                user_id: userId,
                status: 'active'
            })

        if (error) return new Response(error.message, { status: 500, headers: corsHeaders })

        // Redirect to frontend dashboard
        const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'
        return Response.redirect(`${frontendUrl}/dashboard?success=true`, 302)
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders })
})
