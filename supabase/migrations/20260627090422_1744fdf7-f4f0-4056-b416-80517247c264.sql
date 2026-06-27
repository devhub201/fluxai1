
-- Projects
CREATE TABLE public.builder_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled app',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.builder_projects TO authenticated;
GRANT ALL ON public.builder_projects TO service_role;
ALTER TABLE public.builder_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own projects" ON public.builder_projects FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Files
CREATE TABLE public.builder_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.builder_projects ON DELETE CASCADE,
  path TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, path)
);
CREATE INDEX builder_files_project_idx ON public.builder_files(project_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.builder_files TO authenticated;
GRANT ALL ON public.builder_files TO service_role;
ALTER TABLE public.builder_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own files" ON public.builder_files FOR ALL
  USING (EXISTS (SELECT 1 FROM public.builder_projects p WHERE p.id = project_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.builder_projects p WHERE p.id = project_id AND p.user_id = auth.uid()));

-- Messages
CREATE TABLE public.builder_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.builder_projects ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX builder_messages_project_idx ON public.builder_messages(project_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.builder_messages TO authenticated;
GRANT ALL ON public.builder_messages TO service_role;
ALTER TABLE public.builder_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own messages" ON public.builder_messages FOR ALL
  USING (EXISTS (SELECT 1 FROM public.builder_projects p WHERE p.id = project_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.builder_projects p WHERE p.id = project_id AND p.user_id = auth.uid()));

-- Snapshots
CREATE TABLE public.builder_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.builder_projects ON DELETE CASCADE,
  message_id UUID REFERENCES public.builder_messages ON DELETE SET NULL,
  files JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX builder_snapshots_project_idx ON public.builder_snapshots(project_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.builder_snapshots TO authenticated;
GRANT ALL ON public.builder_snapshots TO service_role;
ALTER TABLE public.builder_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own snapshots" ON public.builder_snapshots FOR ALL
  USING (EXISTS (SELECT 1 FROM public.builder_projects p WHERE p.id = project_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.builder_projects p WHERE p.id = project_id AND p.user_id = auth.uid()));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.builder_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER builder_projects_touch BEFORE UPDATE ON public.builder_projects
FOR EACH ROW EXECUTE FUNCTION public.builder_touch_updated_at();
CREATE TRIGGER builder_files_touch BEFORE UPDATE ON public.builder_files
FOR EACH ROW EXECUTE FUNCTION public.builder_touch_updated_at();
