/*
  # Add price fields and settings table

  1. Changes to Products Table
    - Add `price_usd` (numeric) - Calculated price in USD based on weight and gold price
    - This field will be automatically calculated based on weight and gold price per gram

  2. New Tables
    - `settings`
      - `id` (uuid, primary key) - Unique identifier
      - `key` (text, unique) - Setting key (e.g., 'gold_price_per_gram')
      - `value` (text) - Setting value
      - `updated_at` (timestamptz) - Last update timestamp

  3. Security
    - Enable RLS on `settings` table
    - Add policy for public read access to settings
    - Add policy for authenticated users to update settings (for admin)

  4. Initial Data
    - Insert default gold price per gram setting (50 USD as example)
*/

-- Add price field to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'price_usd'
  ) THEN
    ALTER TABLE products ADD COLUMN price_usd numeric DEFAULT 0;
  END IF;
END $$;

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for settings"
  ON settings
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated users can update settings"
  ON settings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can insert settings"
  ON settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert default gold price per gram
INSERT INTO settings (key, value)
VALUES ('gold_price_per_gram', '60')
ON CONFLICT (key) DO NOTHING;