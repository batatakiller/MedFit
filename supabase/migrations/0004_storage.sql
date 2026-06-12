-- ════════════════════════════════════════════════════════════════════════
-- Med Fit — Storage: buckets PRIVADOS para dados sensíveis.
-- Estrutura de pastas: <bucket>/<user_id>/arquivo — o 1º segmento do path
-- precisa ser o auth.uid() do dono. Acesso de leitura via URL assinada.
-- ════════════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('exams', 'exams', false, 20971520, array['application/pdf','image/png','image/jpeg','image/webp']),
  ('body-photos', 'body-photos', false, 10485760, array['image/png','image/jpeg','image/webp']),
  ('avatars', 'avatars', false, 5242880, array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

do $$
declare b text;
begin
  foreach b in array array['exams','body-photos','avatars'] loop
    execute format($p$
      create policy "%1$s_read_own" on storage.objects
        for select to authenticated
        using (bucket_id = '%1$s' and (storage.foldername(name))[1] = auth.uid()::text)
    $p$, b);
    execute format($p$
      create policy "%1$s_insert_own" on storage.objects
        for insert to authenticated
        with check (bucket_id = '%1$s' and (storage.foldername(name))[1] = auth.uid()::text)
    $p$, b);
    execute format($p$
      create policy "%1$s_update_own" on storage.objects
        for update to authenticated
        using (bucket_id = '%1$s' and (storage.foldername(name))[1] = auth.uid()::text)
    $p$, b);
    execute format($p$
      create policy "%1$s_delete_own" on storage.objects
        for delete to authenticated
        using (bucket_id = '%1$s' and (storage.foldername(name))[1] = auth.uid()::text)
    $p$, b);
  end loop;
end $$;
