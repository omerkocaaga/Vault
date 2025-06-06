-- Add domain column to saves table
ALTER TABLE saves ADD COLUMN domain TEXT;

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

-- Update existing rows with domain values
UPDATE saves 
SET domain = extract_domain(url) 
WHERE domain IS NULL;

-- Create an index on the domain column for better query performance
CREATE INDEX idx_saves_domain ON saves(domain); 