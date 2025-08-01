-- XTV CDN Channel Schema
-- Table untuk mengelola restream channels

-- ===========================================
-- CREATE ENUM TYPES
-- ===========================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stream_type') THEN
        CREATE TYPE stream_type AS ENUM ('iptv', 'vod', 'live', 'surveillance');
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'xtv_cdn_mode') THEN
        CREATE TYPE xtv_cdn_mode AS ENUM ('always', 'on-demand', 'scheduled');
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'channel_level') THEN
        CREATE TYPE channel_level AS ENUM ('0-public', '1-basic', '2-standard', '3-premium', '4-vip', '5-super-vip');
    END IF;
END $$;

-- ===========================================
-- RESTREAM CHANNELS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS xtv_cdn_channel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tvg_id VARCHAR(64) UNIQUE,
  tvg_name VARCHAR(128),
  tvg_logo TEXT,
  group_title VARCHAR(128),
  channel_name VARCHAR(128) NOT NULL,
  stream_name VARCHAR(128),
  stream_url TEXT,
  type stream_type DEFAULT 'iptv',
  restream xtv_cdn_mode DEFAULT 'on-demand',
  status BOOLEAN DEFAULT TRUE,
  level channel_level DEFAULT '0-public',
  publish_url TEXT,
  publish_url_rtmp TEXT,
  publish_url_flv TEXT,
  is_live BOOLEAN DEFAULT FALSE,
  video_codec VARCHAR(32),
  video_resolution VARCHAR(16),
  video_fps INTEGER,
  audio_codec VARCHAR(32),
  audio_freq INTEGER,
  audio_channels INTEGER,
  clients_count INTEGER DEFAULT 0,
  stream_duration INTERVAL,
  -- Kolom untuk scheduled mode
  schedule_enabled BOOLEAN DEFAULT FALSE,
  schedule_start_time TIME,
  schedule_end_time TIME,
  schedule_timezone VARCHAR(50) DEFAULT 'Asia/Jakarta',
  schedule_days INTEGER[] DEFAULT '{1,2,3,4,5,6,7}', -- 1=Monday, 7=Sunday
  schedule_repeat_weekly BOOLEAN DEFAULT TRUE,
  schedule_start_date DATE,
  schedule_end_date DATE,
  auto_start BOOLEAN DEFAULT FALSE,
  auto_stop BOOLEAN DEFAULT FALSE,
  next_scheduled_start TIMESTAMPTZ,
  next_scheduled_stop TIMESTAMPTZ,
  last_scheduled_run TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_xtv_cdn_channel_status ON xtv_cdn_channel(status);
CREATE INDEX IF NOT EXISTS idx_xtv_cdn_channel_type ON xtv_cdn_channel(type);
CREATE INDEX IF NOT EXISTS idx_xtv_cdn_channel_restream ON xtv_cdn_channel(restream);
CREATE INDEX IF NOT EXISTS idx_xtv_cdn_channel_is_live ON xtv_cdn_channel(is_live);
CREATE INDEX IF NOT EXISTS idx_xtv_cdn_channel_group_title ON xtv_cdn_channel(group_title);
CREATE INDEX IF NOT EXISTS idx_xtv_cdn_channel_level ON xtv_cdn_channel(level);

-- ===========================================
-- SAMPLE DATA
-- ===========================================
INSERT INTO xtv_cdn_channel (
  tvg_id, tvg_name, tvg_logo, group_title, channel_name, stream_name, stream_url, 
  type, restream, status, level, is_live, video_resolution, video_fps, 
  audio_codec, clients_count
) VALUES
  ('xtv-news', 'XTV News HD', '/placeholder.svg?height=100&width=100', 'News', 'XTV News', 'news_hd', 'https://stream.xtv.zenix.id/live/news.m3u8', 'live', 'always', true, '0-public', true, '1080p', 30, 'aac', 1247),
  ('xtv-sports', 'XTV Sports 4K', '/placeholder.svg?height=100&width=100', 'Sports', 'XTV Sports', 'sports_4k', 'https://stream.xtv.zenix.id/live/sports.m3u8', 'live', 'always', true, '2-standard', true, '4K', 60, 'aac', 3521),
  ('xtv-movies', 'XTV Movies', '/placeholder.svg?height=100&width=100', 'Entertainment', 'XTV Movies', 'movies_hd', 'https://stream.xtv.zenix.id/live/movies.m3u8', 'iptv', 'on-demand', true, '1-basic', false, '1080p', 24, 'aac', 892),
  ('xtv-tech', 'XTV Tech', '/placeholder.svg?height=100&width=100', 'Technology', 'XTV Tech', 'tech_hd', 'https://stream.xtv.zenix.id/live/tech.m3u8', 'live', 'scheduled', true, '3-premium', true, '1080p', 30, 'aac', 654),
  ('xtv-music', 'XTV Music', '/placeholder.svg?height=100&width=100', 'Music', 'XTV Music', 'music_hd', 'https://stream.xtv.zenix.id/live/music.m3u8', 'live', 'always', true, '0-public', true, '720p', 30, 'aac', 1876),
  ('xtv-gaming', 'XTV Gaming', '/placeholder.svg?height=100&width=100', 'Gaming', 'XTV Gaming', 'gaming_4k', 'https://stream.xtv.zenix.id/live/gaming.m3u8', 'live', 'always', true, '4-vip', true, '4K', 60, 'aac', 2341),
  ('xtv-kids', 'XTV Kids', '/placeholder.svg?height=100&width=100', 'Kids', 'XTV Kids', 'kids_hd', 'https://stream.xtv.zenix.id/live/kids.m3u8', 'iptv', 'scheduled', true, '0-public', false, '1080p', 30, 'aac', 567),
  ('xtv-documentary', 'XTV Documentary', '/placeholder.svg?height=100&width=100', 'Documentary', 'XTV Documentary', 'doc_hd', 'https://stream.xtv.zenix.id/live/documentary.m3u8', 'vod', 'on-demand', true, '2-standard', false, '1080p', 24, 'aac', 234)
ON CONFLICT (tvg_id) DO NOTHING;
