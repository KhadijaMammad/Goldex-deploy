/*
  # Update RLS policies for settings table

  1. Changes
    - Drop existing authenticated-only policies
    - Add public access policies for INSERT and UPDATE operations
  
  2. Security
    - Since this is an admin panel without authentication system,
      we allow public access for all operations
    - In production, these should be restricted to authenticated admin users
*/

-- Drop old policies
DROP POLICY IF EXISTS "Authenticated users can update settings" ON settings;
DROP POLICY IF EXISTS "Authenticated users can insert settings" ON settings;

-- Allow public insert access for settings
CREATE POLICY "Public insert access for settings"
  ON settings
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public update access for settings
CREATE POLICY "Public update access for settings"
  ON settings
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Allow public delete access for settings (for completeness)
CREATE POLICY "Public delete access for settings"
  ON settings
  FOR DELETE
  TO public
  USING (true);
