-- Tables

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('shopify', 'woocommerce')),
    store_url TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    scope TEXT,
    status TEXT DEFAULT 'active',
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID REFERENCES public.integrations ON DELETE CASCADE NOT NULL,
    external_id TEXT NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    customer_name TEXT,
    status TEXT,
    ordered_at TIMESTAMP WITH TIME ZONE NOT NULL,
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(integration_id, external_id)
);
