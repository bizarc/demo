-- Migration: Knowledge Bases (RAG) - pgvector, tables, RPC
-- Enables vector search for document-based knowledge retrieval

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add knowledge_base_id to demos
ALTER TABLE demos ADD COLUMN IF NOT EXISTS knowledge_base_id UUID;

-- 3. Create knowledge_bases table
CREATE TABLE IF NOT EXISTS knowledge_bases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  demo_id UUID NOT NULL REFERENCES demos(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default',
  type TEXT NOT NULL DEFAULT 'custom' CHECK (type IN ('product_catalog', 'faq', 'service_menu', 'review_template', 'custom')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kb_id UUID NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  content TEXT NOT NULL,
  chunk_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Create chunks table with vector embedding (1536 = text-embedding-3-small)
CREATE TABLE IF NOT EXISTS chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kb_id UUID NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  chunk_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. Add FK from demos to knowledge_bases (after knowledge_bases exists)
ALTER TABLE demos DROP CONSTRAINT IF EXISTS demos_knowledge_base_id_fkey;
ALTER TABLE demos ADD CONSTRAINT demos_knowledge_base_id_fkey
  FOREIGN KEY (knowledge_base_id) REFERENCES knowledge_bases(id) ON DELETE SET NULL;

-- 7. Create HNSW index on chunks.embedding for similarity search
CREATE INDEX IF NOT EXISTS chunks_embedding_idx ON chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 8. Indexes for lookups
CREATE INDEX IF NOT EXISTS idx_knowledge_bases_demo_id ON knowledge_bases(demo_id);
CREATE INDEX IF NOT EXISTS idx_documents_kb_id ON documents(kb_id);
CREATE INDEX IF NOT EXISTS idx_chunks_kb_id ON chunks(kb_id);
CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks(document_id);

-- 9. RLS
ALTER TABLE knowledge_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to knowledge_bases" ON knowledge_bases
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to documents" ON documents
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to chunks" ON chunks
  FOR ALL USING (true) WITH CHECK (true);

-- 10. RPC function for similarity search
CREATE OR REPLACE FUNCTION match_chunks(
  p_kb_id UUID,
  p_query_embedding vector(1536),
  p_match_threshold float DEFAULT 0.5,
  p_match_count int DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    c.id,
    c.content,
    1 - (c.embedding <=> p_query_embedding) AS similarity
  FROM chunks c
  WHERE c.kb_id = p_kb_id
    AND 1 - (c.embedding <=> p_query_embedding) > p_match_threshold
  ORDER BY c.embedding <=> p_query_embedding
  LIMIT p_match_count;
$$;
