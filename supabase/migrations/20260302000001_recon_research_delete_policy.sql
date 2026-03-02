-- Allow delete on research_records (matches existing permissive RLS pattern)
CREATE POLICY "Allow delete research" ON research_records FOR DELETE USING (true);
