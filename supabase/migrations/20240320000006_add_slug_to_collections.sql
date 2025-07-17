-- Add slug column to collections table
ALTER TABLE collections ADD COLUMN slug TEXT;

-- Create a unique index on slug to ensure uniqueness
CREATE UNIQUE INDEX idx_collections_slug ON collections(slug);

-- Create a function to generate slugs from names
CREATE OR REPLACE FUNCTION generate_slug(name TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'));
END;
$$ LANGUAGE plpgsql;

-- Update existing collections to have slugs (if any exist)
UPDATE collections 
SET slug = generate_slug(name) 
WHERE slug IS NULL;

-- Make slug column NOT NULL after updating existing records
ALTER TABLE collections ALTER COLUMN slug SET NOT NULL; 