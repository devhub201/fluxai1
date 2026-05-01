-- Published sites table
CREATE TABLE public.published_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  slug text NOT NULL UNIQUE,
  title text NOT NULL DEFAULT 'Untitled Site',
  prompt text,
  model text,
  files jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_published_sites_user ON public.published_sites(user_id);
CREATE INDEX idx_published_sites_slug ON public.published_sites(slug);

ALTER TABLE public.published_sites ENABLE ROW LEVEL SECURITY;

-- Owner can do everything on their own sites
CREATE POLICY "sites_owner_all"
  ON public.published_sites
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin full access
CREATE POLICY "sites_admin_all"
  ON public.published_sites
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Public can read sites that are marked published (for the public site viewer)
CREATE POLICY "sites_public_read_published"
  ON public.published_sites
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

-- Updated-at trigger
CREATE TRIGGER trg_published_sites_updated_at
  BEFORE UPDATE ON public.published_sites
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();