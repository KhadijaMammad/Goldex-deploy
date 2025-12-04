/*
  # Add material field to categories table

  1. Changes
    - Add `material` column to `categories` table (text, nullable)
    - Material field will store the default material/əyar for each category
  
  2. Notes
    - Field is nullable to maintain backward compatibility
    - Existing categories will have NULL material until updated
*/

-- Add material column to categories table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'material'
  ) THEN
    ALTER TABLE categories ADD COLUMN material text;
  END IF;
END $$;
