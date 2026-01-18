-- RLS + Policies

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- profiles
DROP POLICY IF EXISTS "Users can view their own profiles" ON public.profiles;
CREATE POLICY "Users can view their own profiles" ON public.profiles
FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles;
CREATE POLICY "Users can update their own profiles" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- Optional: allow users to insert their own profile if you ever remove the auth trigger.
DROP POLICY IF EXISTS "Users can insert their own profiles" ON public.profiles;
CREATE POLICY "Users can insert their own profiles" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- integrations
DROP POLICY IF EXISTS "Users can view their own integrations" ON public.integrations;
CREATE POLICY "Users can view their own integrations" ON public.integrations
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own integrations" ON public.integrations;
CREATE POLICY "Users can manage their own integrations" ON public.integrations
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- orders
DROP POLICY IF EXISTS "Users can view orders for their integrations" ON public.orders;
CREATE POLICY "Users can view orders for their integrations" ON public.orders
FOR SELECT USING (
    integration_id IN (SELECT id FROM public.integrations WHERE user_id = auth.uid())
);
