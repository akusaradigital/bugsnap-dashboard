-- =====================================================================
-- 20260907120000_fix_post_comment_overload.sql
-- Fix PostgREST "Could not choose the best candidate function" error by:
-- 1. Dropping the obsolete 7-parameter overload of post_comment
-- 2. Ensuring the definitive 9-parameter post_comment function has both
--    pinpoint coordinate support (pin_x, pin_y) and spam/abuse guard protections.
-- =====================================================================

-- 1. Drop the old overloads so PostgREST has no ambiguity
DROP FUNCTION IF EXISTS public.post_comment(uuid, text, text, text, text);
DROP FUNCTION IF EXISTS public.post_comment(uuid, text, text, text, text, uuid, integer);
DROP FUNCTION IF EXISTS public.post_comment(uuid, text, text, text, text, integer, uuid, numeric, numeric);

-- 2. Create the definitive post_comment function
CREATE OR REPLACE FUNCTION public.post_comment(
  p_capture_id UUID,
  p_visitor_ref TEXT,
  p_body TEXT,
  p_author_name TEXT DEFAULT NULL,
  p_author_email TEXT DEFAULT NULL,
  p_video_timestamp INT DEFAULT NULL,
  p_parent_id UUID DEFAULT NULL,
  p_pin_x NUMERIC DEFAULT NULL,
  p_pin_y NUMERIC DEFAULT NULL
)
RETURNS public.comments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_comment public.comments;
  v_ip TEXT := btrim(split_part(coalesce(current_setting('request.headers', true)::jsonb ->> 'x-forwarded-for', ''), ',', 1));
  v_key TEXT;
  v_count INTEGER;
BEGIN
  -- Body validation
  IF p_body IS NULL OR char_length(btrim(p_body)) NOT BETWEEN 1 AND 5000 THEN
    RAISE EXCEPTION 'Comment body must contain 1 to 5000 characters' USING errcode = '23502';
  END IF;

  -- Video timestamp validation
  IF p_video_timestamp IS NOT NULL AND p_video_timestamp NOT BETWEEN 0 AND 86400 THEN
    RAISE EXCEPTION 'Invalid video timestamp' USING errcode = '22003';
  END IF;

  -- Capture existence check
  IF NOT EXISTS (SELECT 1 FROM public.captures WHERE id = p_capture_id) THEN
    RAISE EXCEPTION 'Capture not found' USING errcode = 'P0002';
  END IF;

  -- Parent comment validation
  IF p_parent_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.comments WHERE id = p_parent_id AND capture_id = p_capture_id AND parent_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Invalid parent comment' USING errcode = '23503';
  END IF;

  -- Spam guard rate limiting: max 5 comments per 10 minutes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comment_spam_guard') THEN
    v_key := encode(extensions.digest(coalesce(nullif(v_ip, ''), nullif(left(p_visitor_ref, 128), ''), 'unknown'), 'sha256'), 'hex');
    INSERT INTO public.comment_spam_guard(ip, last_post_at, post_count)
    VALUES (v_key, now(), 1)
    ON CONFLICT (ip) DO UPDATE SET
      post_count = CASE WHEN comment_spam_guard.last_post_at > now() - interval '10 minutes'
                        THEN comment_spam_guard.post_count + 1 ELSE 1 END,
      last_post_at = now()
    RETURNING post_count INTO v_count;
    IF v_count > 5 THEN
      RAISE EXCEPTION 'Too many comments. Please wait 10 minutes.' USING errcode = 'P0001';
    END IF;
  END IF;

  -- Insert comment with pin_x and pin_y support
  INSERT INTO public.comments (
    capture_id,
    author_name,
    author_email,
    body,
    video_timestamp,
    parent_id,
    pin_x,
    pin_y,
    created_at
  )
  VALUES (
    p_capture_id,
    left(coalesce(nullif(btrim(p_author_name), ''), 'Visitor'), 200),
    nullif(left(btrim(p_author_email), 320), ''),
    btrim(p_body),
    p_video_timestamp,
    p_parent_id,
    p_pin_x,
    p_pin_y,
    now()
  )
  RETURNING * INTO v_comment;

  RETURN v_comment;
END;
$$;

REVOKE ALL ON FUNCTION public.post_comment(UUID, TEXT, TEXT, TEXT, TEXT, INT, UUID, NUMERIC, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.post_comment(UUID, TEXT, TEXT, TEXT, TEXT, INT, UUID, NUMERIC, NUMERIC) TO anon, authenticated;
