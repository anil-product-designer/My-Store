import { createClient } from '@supabase/supabase-js';

export const getSupabaseClient = (config) => {
  if (!config?.url || !config?.anonKey) {
    return null;
  }

  return createClient(config.url, config.anonKey, {
    auth: {
      persistSession: false,
    },
  });
};

export const testSupabaseConnection = async (url, anonKey) => {
  if (!url || !anonKey) {
    return {
      ok: false,
      message: 'Supabase URL and anon key are both required.',
    };
  }

  try {
    const response = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    });

    if (!response.ok) {
      return {
        ok: false,
        message: `Connection failed with status ${response.status}.`,
      };
    }

    return {
      ok: true,
      message: 'Connection successful. Your frontend is ready to use Supabase.',
    };
  } catch (error) {
    return {
      ok: false,
      message: error.message || 'Unable to reach Supabase from the browser.',
    };
  }
};

export const uploadImageToStorage = async (supabase, file, projectId, decisionId, type) => {
  if (!supabase || !file) return null;
  
  // Create a unique name to avoid caching issues on replace
  const timestamp = new Date().getTime();
  const ext = file.name.split('.').pop();
  const path = `${projectId}/${decisionId}/${type}-${timestamp}.${ext}`;
  
  const { error } = await supabase.storage
    .from('design-images')
    .upload(path, file, { upsert: true });

  if (error) throw error;
  
  const { data: publicUrlData } = supabase.storage
    .from('design-images')
    .getPublicUrl(path);

  return publicUrlData.publicUrl;
};

export const deleteImageFromStorage = async (supabase, url) => {
  if (!supabase || !url) return;
  try {
    const bucketStr = '/design-images/';
    const pathIdx = url.indexOf(bucketStr);
    if (pathIdx !== -1) {
      const path = url.substring(pathIdx + bucketStr.length);
      await supabase.storage.from('design-images').remove([path]);
    }
  } catch (e) {
    console.warn("Could not delete old image:", e);
  }
};


export const sqlSetupBlocks = [
  `CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  color text NOT NULL DEFAULT '#6366F1',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE design_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  rationale text NOT NULL,
  advantages text[] NOT NULL DEFAULT ARRAY[]::text[],
  disadvantages text[],
  tags text[],
  before_image_url text,
  after_image_url text,
  status text NOT NULL DEFAULT 'draft',
  date_changed date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_projects_updated
BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER trg_decisions_updated
BEFORE UPDATE ON design_decisions
FOR EACH ROW EXECUTE PROCEDURE update_updated_at();`,
  `ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON projects
FOR SELECT USING (true);

CREATE POLICY "Public read" ON design_decisions
FOR SELECT USING (true);

CREATE POLICY "Anon write" ON projects
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Anon write" ON design_decisions
FOR ALL USING (true) WITH CHECK (true);`,
];
