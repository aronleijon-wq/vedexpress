-- Stadig leverans: antal veckor mellan leveranserna och antal säckar per
-- leverans. Båda är tomma (NULL) när kunden får allt på en gång.
ALTER TABLE public.orders ADD COLUMN delivery_interval_weeks INTEGER;
ALTER TABLE public.orders ADD COLUMN sacks_per_delivery INTEGER;

-- Mängden per leverans kan vara under en kubik, t.ex. 0,32 m³.
ALTER TABLE public.orders ALTER COLUMN volume_m3 TYPE NUMERIC(5,2);
