-- Áreas editáveis (Fatia A): permite ao mestre da campanha (dono ou role='master')
-- dar UPDATE nas áreas do mapa. Antes a tabela era create/delete-only.
--
-- is_map_master(mid) vem de co-master.sql (dono OU membro role='master' da campanha do mapa).
-- Aplicar no SQL editor do Supabase. Antes de rodar, confirmar que a policy de INSERT
-- existente em campaign_map_areas usa is_map_master(map_id) — as policies dessa tabela
-- vivem só no painel; esta de UPDATE espelha aquele predicado.

drop policy if exists "areas_update_master" on campaign_map_areas;
create policy "areas_update_master" on campaign_map_areas
  for update using (is_map_master(map_id)) with check (is_map_master(map_id));
