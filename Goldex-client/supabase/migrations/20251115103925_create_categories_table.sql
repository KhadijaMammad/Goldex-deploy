/*
  # Create categories table

  1. New Tables
    - `categories`
      - `id` (uuid, primary key, auto-generated)
      - `name` (text, unique, not null) - Category name
      - `display_order` (integer, default 0) - Order for displaying categories
      - `active` (boolean, default true) - Whether category is active
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
  
  2. Security
    - Enable RLS on `categories` table
    - Add policy for public to read active categories
    - Add policy for public to manage all categories (for admin panel)
  
  3. Initial Data
    - Insert existing categories from the hardcoded list
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_order integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Allow public to read active categories
CREATE POLICY "Public can read active categories"
  ON categories
  FOR SELECT
  TO public
  USING (active = true);

-- Allow public to insert categories
CREATE POLICY "Public can insert categories"
  ON categories
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public to update categories
CREATE POLICY "Public can update categories"
  ON categories
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Allow public to delete categories
CREATE POLICY "Public can delete categories"
  ON categories
  FOR DELETE
  TO public
  USING (true);

-- Insert existing categories
INSERT INTO categories (name, display_order) VALUES
  ('Üzük', 1),
  ('Sırqa', 2),
  ('Uşaq sırqası', 3),
  ('Bilərzik', 4),
  ('Boyunbağı', 5),
  ('Klon', 6),
  ('Komplekt', 7),
  ('Komplekt Klon ilə', 8),
  ('Toy dəsti', 9),
  ('Sep', 10),
  ('Sep klonlu', 11),
  ('Saat', 12)
ON CONFLICT (name) DO NOTHING;

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
