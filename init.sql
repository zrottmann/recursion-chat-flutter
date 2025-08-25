-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable H3 extension if available
-- CREATE EXTENSION IF NOT EXISTS h3;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_items_h3_index ON items(h3_index);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at);
CREATE INDEX IF NOT EXISTS idx_items_is_available ON items(is_available);

-- Spatial indexes
CREATE INDEX IF NOT EXISTS idx_users_location ON users USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_items_location ON items USING GIST(location);

-- Message indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_item_id ON messages(item_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);