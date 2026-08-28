-- =====================================================================
-- 20260828140000_pinpoint_comments.sql
-- Add pinpoint spatial coordinates (pin_x, pin_y percentages) to comments
-- and update post_comment to support pinpoint coordinates seamlessly.
-- =====================================================================

ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS pin_x NUMERIC(5,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pin_y NUMERIC(5,2) DEFAULT NULL;

-- Recreate post_comment with optional pin_x and pin_y
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
BEGIN
  IF p_body IS NULL OR TRIM(p_body) = '' THEN
    RAISE EXCEPTION 'Comment body cannot be empty' USING errcode = '22000';
  END IF;

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
    COALESCE(NULLIF(TRIM(p_author_name), ''), 'Guest'),
    NULLIF(TRIM(p_author_email), ''),
    p_body,
    p_video_timestamp,
    p_parent_id,
    p_pin_x,
    p_pin_y,
    NOW()
  )
  RETURNING * INTO v_comment;

  RETURN v_comment;
END;
$$;

REVOKE ALL ON FUNCTION public.post_comment(UUID, TEXT, TEXT, TEXT, TEXT, INT, UUID, NUMERIC, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.post_comment(UUID, TEXT, TEXT, TEXT, TEXT, INT, UUID, NUMERIC, NUMERIC) TO anon, authenticated;
