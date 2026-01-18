-- Indexes

-- FK helper indexes
CREATE INDEX IF NOT EXISTS integrations_user_id_idx ON public.integrations(user_id);
CREATE INDEX IF NOT EXISTS orders_integration_id_idx ON public.orders(integration_id);

-- Query helper indexes
CREATE INDEX IF NOT EXISTS integrations_user_status_idx ON public.integrations(user_id, status);
CREATE INDEX IF NOT EXISTS orders_ordered_at_idx ON public.orders(ordered_at DESC);
CREATE INDEX IF NOT EXISTS orders_integration_ordered_at_idx ON public.orders(integration_id, ordered_at DESC);
