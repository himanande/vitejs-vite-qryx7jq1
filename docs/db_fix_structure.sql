-- ============================================================
-- DB構造修正SQL
-- 実行日: 2026-07-22
-- 目的:
--   1. categoriesのdisplay_orderを節の順番（第1節〜第6節）に修正
--   2. categoriesの名称を正式名称に統一
--   3. themesのdisplay_orderを項の順番に修正
--   4. 正式構成外テーマ（ID:5, 10）を無効化
--   5. 「八朔・事始め」（節6 項3）を新規追加
-- ============================================================

-- ============================================================
-- STEP 1: categories の display_order と名称を修正
-- 現在: 1=歴史・史跡, 2=神社・寺院, 3=食文化, 4=祭りと行事, 5=建築・庭園・美術, 6=芸術・文化
-- 正式: 第1節=歴史・史跡, 第2節=神社・寺院, 第3節=芸術・文化, 第4節=建築・庭園・美術, 第5節=食文化, 第6節=祭り・行事
-- ============================================================
UPDATE categories SET display_order = 1, name = '歴史・史跡'      WHERE id = 1;
UPDATE categories SET display_order = 2, name = '神社・寺院'      WHERE id = 2;
UPDATE categories SET display_order = 3, name = '芸術・文化'      WHERE id = 6;
UPDATE categories SET display_order = 4, name = '建築・庭園・美術' WHERE id = 5;
UPDATE categories SET display_order = 5, name = '食文化'          WHERE id = 3;
UPDATE categories SET display_order = 6, name = '祭り・行事'      WHERE id = 4;

-- ============================================================
-- STEP 2: themesのdisplay_orderを項の順番に修正
-- ============================================================

-- 節1: 歴史・史跡 (category_id=1)
UPDATE themes SET display_order = 1 WHERE id = 1;  -- 四神相応
UPDATE themes SET display_order = 2 WHERE id = 2;  -- 嵐山・渡月橋
UPDATE themes SET display_order = 3 WHERE id = 3;  -- 嵯峨野観光鉄道・近代交通

-- 節2: 神社・寺院 (category_id=2)
UPDATE themes SET display_order = 1 WHERE id = 9;  -- 寺社を建てた人物（建立者）→ 項1
UPDATE themes SET display_order = 2 WHERE id = 4;  -- 清水寺（本尊・縁起・舞台）→ 項2
UPDATE themes SET display_order = 3 WHERE id = 11; -- 天龍寺×足利尊氏×夢窓疎石 → 項3

-- 節3: 芸術・文化 (category_id=6)
UPDATE themes SET display_order = 1 WHERE id = 12; -- 茶屋と家元（茶室と家元）
UPDATE themes SET display_order = 2 WHERE id = 13; -- 京ことば
UPDATE themes SET display_order = 3 WHERE id = 14; -- 伝統工芸
UPDATE themes SET display_order = 4 WHERE id = 15; -- 近代日本画家
UPDATE themes SET display_order = 5 WHERE id = 16; -- 京焼・清水焼
UPDATE themes SET display_order = 6 WHERE id = 17; -- いけばな・池坊

-- 節4: 建築・庭園・美術 (category_id=5)
UPDATE themes SET display_order = 1 WHERE id = 8;  -- 金閣・銀閣
UPDATE themes SET display_order = 2 WHERE id = 18; -- 桂離宮とブルーノ・タウト
UPDATE themes SET display_order = 3 WHERE id = 19; -- 庭園石組・作庭技法
UPDATE themes SET display_order = 4 WHERE id = 20; -- 近代建築
UPDATE themes SET display_order = 5 WHERE id = 21; -- 京町家・伝統建築

-- 節5: 食文化 (category_id=3)
UPDATE themes SET display_order = 1 WHERE id = 6;  -- 京野菜
UPDATE themes SET display_order = 2 WHERE id = 22; -- 京懐石・一汁三菜
UPDATE themes SET display_order = 3 WHERE id = 23; -- 京菓子
UPDATE themes SET display_order = 4 WHERE id = 24; -- 伏見の清酒

-- 節6: 祭り・行事 (category_id=4)
UPDATE themes SET display_order = 1 WHERE id = 7;  -- 祇園祭
UPDATE themes SET display_order = 2 WHERE id = 25; -- 年中行事

-- ============================================================
-- STEP 3: 正式構成外テーマを無効化
-- ============================================================
UPDATE themes SET is_active = false WHERE id = 5;  -- 伏見稲荷大社（正式構成に存在しない）
UPDATE themes SET is_active = false WHERE id = 10; -- 嵯峨野観光鉄道 in cat2（節2のミス）

-- ============================================================
-- STEP 4: 「八朔・事始め」を新規追加（節6 項3）
-- ============================================================
INSERT INTO themes (category_id, name, description, display_order, is_active)
VALUES (4, '八朔・事始め', '八朔の風習と京都の事始めについて学ぶ', 3, true);

-- ============================================================
-- 確認クエリ（実行後に結果を確認）
-- ============================================================
SELECT
  c.display_order AS 節番号,
  c.name          AS カテゴリ,
  t.id            AS テーマID,
  t.display_order AS 項番号,
  t.name          AS テーマ名,
  t.is_active     AS 有効
FROM categories c
LEFT JOIN themes t ON t.category_id = c.id
ORDER BY c.display_order, t.display_order, t.id;
