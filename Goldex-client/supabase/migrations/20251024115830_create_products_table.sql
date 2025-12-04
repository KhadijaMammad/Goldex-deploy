/*
  # Create products catalog schema

  1. New Tables
    - `products`
      - `id` (uuid, primary key) - Unique product identifier
      - `title` (text) - Product name/title
      - `category` (text) - Product category (rings, necklaces, bracelets, etc.)
      - `metal` (text) - Type of metal (gold, silver, platinum, etc.)
      - `karat` (text) - Karat value (14k, 18k, 24k, etc.)
      - `weight` (text) - Weight of the product
      - `availability` (text) - Availability status (in stock, out of stock, made to order)
      - `description` (text) - Detailed product description
      - `main_image` (text) - URL of the main product image
      - `additional_images` (text[]) - Array of additional image URLs
      - `created_at` (timestamptz) - Record creation timestamp

  2. Security
    - Enable RLS on `products` table
    - Add policy for public read access (catalog is public view only)
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  metal text NOT NULL,
  karat text NOT NULL,
  weight text NOT NULL,
  availability text DEFAULT 'in stock',
  description text DEFAULT '',
  main_image text NOT NULL,
  additional_images text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for products"
  ON products
  FOR SELECT
  TO anon
  USING (true);