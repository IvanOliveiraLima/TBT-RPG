-- ============================================================================
-- CO-MESTRE (múltiplos masters por campanha)
-- Aplicado manualmente no Supabase e validado (ver roteiro no fim do arquivo).
-- Este arquivo é REFERÊNCIA — não é executado por CI.
--
-- Modelo: o DONO (campaigns.owner_id) mantém exclusivos:
--   - deletar a campanha
--   - transferir a propriedade (trocar owner_id)
--   - promover/rebaixar mestres (via RPC, ver CoMestre.2)
-- Qualquer membro com role='master' (inclusive o dono) tem as demais ações de mestre.
--
-- ATENÇÃO (armadilhas encontradas na aplicação):
--   1. As funções originais chamavam-se is_campaign_owner(cid)/is_map_owner(mid). O rename
--      preserva as policies (elas referenciam a função por OID), MAS o nome dos parâmetros
--      NÃO pode mudar em CREATE OR REPLACE — por isso seguem cid/mid.
--   2. Corpos de função SQL são texto: após o rename, is_map_master ainda chamava
--      is_campaign_owner (nome inexistente) e ficou quebrada até ser redefinida.
-- ============================================================================

-- 0) Dependências pelo nome antigo (deve voltar vazio DEPOIS de aplicar tudo):
--    select proname from pg_proc
--     where prosrc ilike '%is_campaign_owner%' or prosrc ilike '%is_map_owner%';

-- 1) Rename (policies seguem funcionando — referência por OID)
alter function is_campaign_owner(uuid) rename to is_campaign_master;
alter function is_map_owner(uuid)      rename to is_map_master;

-- 2) Novos corpos: dono OU membro com role='master'
create or replace function is_campaign_master(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from campaigns c
                 where c.id = cid and c.owner_id = auth.uid())
      or exists (select 1 from campaign_members m
                 where m.campaign_id = cid
                   and m.user_id = auth.uid() and m.role = 'master');
$$;

create or replace function is_map_master(mid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from campaign_maps mp
                 where mp.id = mid and is_campaign_master(mp.campaign_id));
$$;

-- 3) Policies que citavam owner_id diretamente
-- 3a. Mapas: mestre vê todos; membro só os publicados
drop policy if exists "maps_select_owner_all_member_published" on campaign_maps;
create policy "maps_select_master_all_member_published" on campaign_maps
for select using (
  is_campaign_master(campaign_id)
  or (published = true and is_campaign_member(campaign_id, auth.uid()))
);

-- 3b. Desvincular qualquer personagem: mestre
drop policy if exists "Owners can unlink any character in their campaigns" on campaign_characters;
create policy "Masters can unlink any character" on campaign_characters
for delete using (is_campaign_master(campaign_id));

-- 3c. Remover membro: mestre remove JOGADOR; só o dono remove MESTRE
drop policy if exists "Owners can remove members" on campaign_members;
create policy "Masters can remove players; owner can remove anyone" on campaign_members
for delete using (
  exists (select 1 from campaigns c
           where c.id = campaign_members.campaign_id and c.owner_id = auth.uid())
  or (is_campaign_master(campaign_id) and role <> 'master')
);

-- 3d. Inserir membro: mestre
drop policy if exists "Campaign owners can insert members" on campaign_members;
create policy "Masters can insert members" on campaign_members
for insert with check (is_campaign_master(campaign_id));

-- 3e. Editar a campanha: mestre (a troca de owner_id é barrada pelo trigger em 4)
drop policy if exists "Owners can update their campaigns" on campaigns;
create policy "Masters can update their campaigns" on campaigns
for update using (is_campaign_master(id)) with check (is_campaign_master(id));

-- INALTERADAS: campaigns DELETE / INSERT / SELECT

-- 4) Trigger anti-escalada: só o dono troca owner_id
create or replace function guard_campaign_owner_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.owner_id is distinct from old.owner_id
     and auth.uid() is distinct from old.owner_id then
    raise exception 'only the owner can transfer ownership';
  end if;
  return new;
end; $$;

drop trigger if exists trg_guard_campaign_owner on campaigns;
create trigger trg_guard_campaign_owner
before update on campaigns
for each row execute function guard_campaign_owner_change();

-- ============================================================================
-- ROTEIRO DE VALIDAÇÃO (executado e aprovado)
-- IMPORTANTE: no SQL editor é preciso set_config + `set local role authenticated`.
--   - sem set_config, auth.uid() é NULL e tudo dá false;
--   - sem `set local role authenticated`, o editor roda como postgres e IGNORA RLS
--     (qualquer escrita passaria, sem significado);
--   - rodar o BLOCO INTEIRO: "Run selected" com uma linha marcada não executa o set_config.
--
-- (A) co-mestre (membro com role='master'): is_campaign_master → true;
--     enxerga mapas não publicados; escreve em campaign_initiative/maps/tokens.   [OK]
-- (B) jogador comum: is_campaign_master → false; mapas_visiveis = 0;
--     UPDATE em campaigns afeta 0 linhas (barrado pela RLS, antes do trigger).    [OK]
-- (C) escalada como co-mestre: UPDATE campaigns SET owner_id = <ele>
--     → ERROR "only the owner can transfer ownership" (trigger).                  [OK]
-- (D) dono trocando owner_id → PERMITIDO (a transferência do PR #270 segue viva).  [OK]
-- (E) deletar campanha como co-mestre → falha (owner-only).
-- ============================================================================
