-- ════════════════════════════════════════════════════════════════════════
-- Med Fit — Supabase Vector (pgvector) para RAG do histórico do paciente
-- Embeddings gerados pela Edge Function `embed` (gte-small, 384 dims).
-- ════════════════════════════════════════════════════════════════════════
create extension if not exists vector with schema extensions;

create table public.patient_embeddings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid not null references public.patient_documents(id) on delete cascade,
  content text not null,
  embedding vector(384),
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

create index on public.patient_embeddings (user_id);
create index patient_embeddings_vec_idx on public.patient_embeddings
  using hnsw (embedding vector_cosine_ops);

alter table public.patient_embeddings enable row level security;
create policy "patient_embeddings_select_own" on public.patient_embeddings
  for select to authenticated using (user_id = auth.uid());
create policy "patient_embeddings_insert_own" on public.patient_embeddings
  for insert to authenticated with check (user_id = auth.uid());
create policy "patient_embeddings_update_own" on public.patient_embeddings
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "patient_embeddings_delete_own" on public.patient_embeddings
  for delete to authenticated using (user_id = auth.uid());

-- Busca semântica no histórico do PRÓPRIO paciente.
-- security invoker → RLS continua valendo; filtro extra por p_user_id
-- garante que mesmo via service role a busca é por paciente.
create or replace function public.match_patient_documents(
  p_user_id uuid,
  query_embedding vector(384),
  match_count int default 8,
  min_similarity float default 0.5
)
returns table (
  document_id uuid,
  content text,
  type text,
  title text,
  similarity float,
  created_at timestamptz
)
language sql stable as $$
  select
    e.document_id,
    e.content,
    d.type,
    d.title,
    1 - (e.embedding <=> query_embedding) as similarity,
    e.created_at
  from public.patient_embeddings e
  join public.patient_documents d on d.id = e.document_id
  where e.user_id = p_user_id
    and e.embedding is not null
    and 1 - (e.embedding <=> query_embedding) >= min_similarity
  order by e.embedding <=> query_embedding
  limit match_count;
$$;
