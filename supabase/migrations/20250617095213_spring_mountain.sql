/*
  # Create satellite insights table

  1. New Tables
    - `satellite_insights`
      - `id` (uuid, primary key)
      - `farmer_id` (uuid, foreign key)
      - `image_date` (date)
      - `ndvi_score` (numeric)
      - `soil_moisture` (numeric)
      - `vegetation_index` (numeric)
      - `recommendation` (text)
      - `image_url` (text)
      - `sentinel_data` (jsonb)

  2. Security
    - Enable RLS on `satellite_insights` table
    - Add policies for authenticated access
*/

CREATE TABLE IF NOT EXISTS satellite_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid REFERENCES farmers(id) ON DELETE CASCADE,
  image_date date NOT NULL,
  ndvi_score numeric(5,3),
  soil_moisture numeric(5,2),
  vegetation_index numeric(5,2),
  recommendation text,
  image_url text,
  sentinel_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE satellite_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to satellite_insights"
  ON satellite_insights
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert access to satellite_insights"
  ON satellite_insights
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update access to satellite_insights"
  ON satellite_insights
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_satellite_insights_farmer_id ON satellite_insights(farmer_id);
CREATE INDEX IF NOT EXISTS idx_satellite_insights_date ON satellite_insights(image_date);