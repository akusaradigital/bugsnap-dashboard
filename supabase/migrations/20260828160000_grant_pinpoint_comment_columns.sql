-- Grant SELECT on pinpoint columns (pin_x, pin_y) to anon and authenticated
GRANT SELECT (pin_x, pin_y) ON public.comments TO anon, authenticated;
