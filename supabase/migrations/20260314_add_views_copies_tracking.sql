-- Track views on publications
CREATE TABLE IF NOT EXISTS content_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_hash TEXT,
  viewed_at TIMESTAMPTZ DEFAULT now()
);

-- Track copies/citations on publications
CREATE TABLE IF NOT EXISTS content_copies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  copied_at TIMESTAMPTZ DEFAULT now()
);

-- Add view_count and copy_count columns for faster counting
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS copy_count INTEGER DEFAULT 0;

-- Enable RLS
ALTER TABLE content_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_copies ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert views and copies
CREATE POLICY "Anyone can insert views" ON content_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read views" ON content_views FOR SELECT USING (true);
CREATE POLICY "Anyone can insert copies" ON content_copies FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read copies" ON content_copies FOR SELECT USING (true);
