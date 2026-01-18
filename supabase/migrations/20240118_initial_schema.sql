-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Register for profiles update on auth.users changes
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create integrations table
CREATE TABLE IF NOT EXISTS integrations (
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

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID REFERENCES integrations ON DELETE CASCADE NOT NULL,
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

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profiles" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profiles" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view their own integrations" ON integrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own integrations" ON integrations FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view orders for their integrations" ON orders
FOR SELECT USING (
    integration_id IN (SELECT id FROM integrations WHERE user_id = auth.uid())
);
