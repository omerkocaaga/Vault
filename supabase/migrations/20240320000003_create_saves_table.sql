-- Drop existing table if it exists
DROP TABLE IF EXISTS saves;

-- Create the saves table with all required columns
CREATE TABLE saves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    og_image_url TEXT,
    favicon_url TEXT,
    time_added TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tags TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'unread',
    domain TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_saves_user_id ON saves(user_id);
CREATE INDEX idx_saves_domain ON saves(domain);
CREATE INDEX idx_saves_status ON saves(status);
CREATE INDEX idx_saves_time_added ON saves(time_added);

-- Create a function to extract domain from URL
CREATE OR REPLACE FUNCTION extract_domain(url TEXT) 
RETURNS TEXT AS $$
BEGIN
    -- Remove protocol (http:// or https://)
    url := regexp_replace(url, '^https?://', '');
    -- Remove everything after the first slash
    url := regexp_replace(url, '/.*$', '');
    -- Remove port number if present
    url := regexp_replace(url, ':\d+$', '');
    RETURN url;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_saves_updated_at
    BEFORE UPDATE ON saves
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS (Row Level Security) policies
ALTER TABLE saves ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view only their own saves
CREATE POLICY "Users can view their own saves"
    ON saves FOR SELECT
    USING (auth.uid() = user_id);

-- Policy to allow users to insert their own saves
CREATE POLICY "Users can insert their own saves"
    ON saves FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own saves
CREATE POLICY "Users can update their own saves"
    ON saves FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to delete their own saves
CREATE POLICY "Users can delete their own saves"
    ON saves FOR DELETE
    USING (auth.uid() = user_id); 