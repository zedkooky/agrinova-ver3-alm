/*
  # Create IVR calls table

  1. New Tables
    - `ivr_calls`
      - `id` (uuid, primary key)
      - `farmer_id` (uuid, foreign key)
      - `call_time` (timestamp)
      - `crop_selected` (text)
      - `crop_condition` (integer, 1-3)
      - `rain_recent` (boolean)
      - `opted_in_carbon` (boolean)
      - `transcript` (text)
      - `call_duration` (integer, seconds)
      - `call_status` (text)

  2. Security
    - Enable RLS on `ivr_calls` table
    - Add policies for authenticated access
*/

CREATE TABLE IF NOT EXISTS ivr_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid REFERENCES farmers(id) ON DELETE CASCADE,
  call_time timestamptz DEFAULT now(),
  crop_selected text,
  crop_condition integer CHECK (crop_condition BETWEEN 1 AND 3),
  rain_recent boolean DEFAULT false,
  opted_in_carbon boolean DEFAULT false,
  transcript text,
  call_duration integer DEFAULT 0,
  call_status text DEFAULT 'completed',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ivr_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to ivr_calls"
  ON ivr_calls
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert access to ivr_calls"
  ON ivr_calls
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ivr_calls_farmer_id ON ivr_calls(farmer_id);
CREATE INDEX IF NOT EXISTS idx_ivr_calls_time ON ivr_calls(call_time);