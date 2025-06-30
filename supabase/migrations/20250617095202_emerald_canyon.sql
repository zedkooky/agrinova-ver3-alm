/*
  # Create farmers table

  1. New Tables
    - `farmers`
      - `id` (uuid, primary key)
      - `phone_number` (text, unique)
      - `full_name` (text)
      - `location_name` (text)
      - `latitude` (numeric)
      - `longitude` (numeric)
      - `preferred_language` (text)
      - `crop` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `farmers` table
    - Add policy for authenticated users to read all data
    - Add policy for authenticated users to insert/update data
*/

CREATE TABLE IF NOT EXISTS farmers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text UNIQUE NOT NULL,
  full_name text,
  location_name text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  preferred_language text DEFAULT 'English',
  crop text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to farmers"
  ON farmers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert access to farmers"
  ON farmers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update access to farmers"
  ON farmers
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_farmers_location ON farmers(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_farmers_phone ON farmers(phone_number);