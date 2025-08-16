-- Add attachments column to existing materials table
ALTER TABLE materials ADD COLUMN IF NOT EXISTS attachments TEXT;

-- Update existing materials to have empty attachments array
UPDATE materials SET attachments = '[]' WHERE attachments IS NULL;
