CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  volume_m3 NUMERIC(4,1) NOT NULL,
  price_kr INTEGER NOT NULL,
  firings_per_week INTEGER NOT NULL,
  blocks_per_firing INTEGER NOT NULL,
  months NUMERIC(5,1) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.orders TO anon;
GRANT ALL ON public.orders TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can place an order"
ON public.orders
FOR INSERT
TO anon
WITH CHECK (true);
