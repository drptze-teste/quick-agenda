-- Create professionals table
CREATE TABLE IF NOT EXISTS professionals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slot_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create app_settings table for global config
CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  logo_url TEXT,
  client_name TEXT,
  admin_password TEXT DEFAULT 'admin123',
  available_dates JSONB DEFAULT '[]'::jsonb,
  time_list JSONB DEFAULT '[]'::jsonb,
  slot_config JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create schedules table
CREATE TABLE IF NOT EXISTS schedules (
  id TEXT PRIMARY KEY, -- the `${date}::${proId}` key
  date DATE NOT NULL,
  professional_id TEXT REFERENCES professionals(id) ON DELETE CASCADE,
  slots JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings if not exists
INSERT INTO app_settings (id, client_name) 
VALUES ('default', 'Cescon Barrieu')
ON CONFLICT (id) DO NOTHING;
