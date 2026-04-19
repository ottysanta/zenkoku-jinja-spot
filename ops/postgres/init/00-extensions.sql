-- Phase 1a 用の初期拡張
-- PostGIS 本体はイメージで入るが、補助拡張をここで有効化
CREATE EXTENSION IF NOT EXISTS pg_trgm;         -- あいまい検索用
CREATE EXTENSION IF NOT EXISTS unaccent;        -- 全文検索の正規化
CREATE EXTENSION IF NOT EXISTS btree_gin;       -- 複合インデックス
