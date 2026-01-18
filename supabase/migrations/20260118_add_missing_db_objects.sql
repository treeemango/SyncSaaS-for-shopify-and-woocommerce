-- Add missing DB objects (triggers, helper functions, indexes)

-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Provision a profile row whenever a new auth user is created.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger if missing
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at maintenance for profiles
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS integrations_user_id_idx ON public.integrations(user_id);
CREATE INDEX IF NOT EXISTS orders_integration_id_idx ON public.orders(integration_id);
CREATE INDEX IF NOT EXISTS integrations_user_status_idx ON public.integrations(user_id, status);
CREATE INDEX IF NOT EXISTS orders_ordered_at_idx ON public.orders(ordered_at DESC);
CREATE INDEX IF NOT EXISTS orders_integration_ordered_at_idx ON public.orders(integration_id, ordered_at DESC);

-- Policies: profiles insert (safe to re-run)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert their own profiles" ON public.profiles;
CREATE POLICY "Users can insert their own profiles" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);
