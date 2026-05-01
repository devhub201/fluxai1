import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (b: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const slugify = (v: string) =>
  v.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 48) || `site-${Date.now()}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: ud, error: ue } = await userClient.auth.getUser();
    const user = ud?.user;
    if (ue || !user) return json({ error: "Please sign in" }, 401);

    const body = await req.json();
    const action = body.action ?? "publish";

    if (action === "list") {
      const { data, error } = await adminClient
        .from("published_sites")
        .select("id, slug, title, is_published, updated_at, created_at, model")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      if (error) return json({ error: error.message }, 500);
      return json({ sites: data ?? [] });
    }

    if (action === "delete") {
      const { id } = body;
      if (!id) return json({ error: "id required" }, 400);
      const { error } = await adminClient.from("published_sites").delete().eq("id", id).eq("user_id", user.id);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    if (action === "unpublish") {
      const { id } = body;
      if (!id) return json({ error: "id required" }, 400);
      const { error } = await adminClient
        .from("published_sites")
        .update({ is_published: false })
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    // publish (create or update)
    const { slug: rawSlug, title, files, prompt, model } = body;
    if (!Array.isArray(files) || files.length === 0) return json({ error: "files required" }, 400);
    let slug = slugify(String(rawSlug ?? title ?? "site"));

    // ensure unique: if slug exists for another user, append suffix
    for (let i = 0; i < 5; i++) {
      const { data: existing } = await adminClient
        .from("published_sites")
        .select("id, user_id")
        .eq("slug", slug)
        .maybeSingle();
      if (!existing || existing.user_id === user.id) break;
      slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    }

    const { data: upserted, error: upErr } = await adminClient
      .from("published_sites")
      .upsert(
        {
          user_id: user.id,
          slug,
          title: String(title ?? "Untitled Site").slice(0, 120),
          prompt: prompt ? String(prompt).slice(0, 4000) : null,
          model: model ? String(model) : null,
          files,
          is_published: true,
        },
        { onConflict: "slug" },
      )
      .select()
      .single();

    if (upErr) return json({ error: upErr.message }, 500);
    return json({ ok: true, slug: upserted.slug, id: upserted.id });
  } catch (e) {
    console.error("publish-site error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
