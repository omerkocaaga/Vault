-- Drop existing trigger and function
DROP TRIGGER IF EXISTS update_saves_updated_at ON saves;
DROP FUNCTION IF EXISTS update_updated_at_column();

-- First remove the default value
ALTER TABLE saves ALTER COLUMN time_added DROP DEFAULT;

-- Then modify the column type
ALTER TABLE saves 
  ALTER COLUMN time_added TYPE BIGINT USING EXTRACT(EPOCH FROM time_added)::BIGINT;

-- Finally add the new default value
ALTER TABLE saves 
  ALTER COLUMN time_added SET DEFAULT EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::BIGINT;

-- Recreate the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Recreate the trigger
CREATE TRIGGER update_saves_updated_at
    BEFORE UPDATE ON saves
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 