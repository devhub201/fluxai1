ALTER TABLE public.published_sites
ADD COLUMN IF NOT EXISTS seo_title text,
ADD COLUMN IF NOT EXISTS seo_description text,
ADD COLUMN IF NOT EXISTS og_image_url text,
ADD COLUMN IF NOT EXISTS sitemap_url text;

CREATE TABLE IF NOT EXISTS public.website_generation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tool_id text NOT NULL DEFAULT 'website-builder',
  prompt text NOT NULL,
  mode text NOT NULL DEFAULT 'fast',
  status text NOT NULL DEFAULT 'queued',
  step text NOT NULL DEFAULT 'plan',
  progress integer NOT NULL DEFAULT 0,
  title text,
  summary text,
  files jsonb NOT NULL DEFAULT '[]'::jsonb,
  assistant_plan jsonb,
  credits jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.website_generation_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "website_generation_jobs_owner_all"
ON public.website_generation_jobs
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "website_generation_jobs_admin_all"
ON public.website_generation_jobs
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_website_generation_jobs_user_updated
ON public.website_generation_jobs (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_published_sites_user_updated
ON public.published_sites (user_id, updated_at DESC);

DROP TRIGGER IF EXISTS set_published_sites_updated_at ON public.published_sites;
CREATE TRIGGER set_published_sites_updated_at
BEFORE UPDATE ON public.published_sites
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_website_generation_jobs_updated_at ON public.website_generation_jobs;
CREATE TRIGGER set_website_generation_jobs_updated_at
BEFORE UPDATE ON public.website_generation_jobs
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();