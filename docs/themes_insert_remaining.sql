-- ============================================================
-- themes 残り投入SQL（節2〜節6の新規テーマ）
-- 実行前に以下で現在のthemesを確認:
--   SELECT id, name, category_id, display_order FROM themes ORDER BY id;
-- ============================================================
-- ⚠️ 前提: 以下のcategory_idを使用
--   category_id 1 = 歴史・史跡
--   category_id 2 = 神社・寺院
--   category_id 3 = 食文化
--   category_id 4 = 祭りと行事
--   category_id 5 = 建築・庭園・美術
--   category_id 6 = 芸術・文化
-- ============================================================

-- ① 既存テーマの名前を更新（節の正式名称に合わせる）
UPDATE themes SET name = '嵯峨野観光鉄道・近代交通' WHERE id = 3;
UPDATE themes SET name = '清水寺（本尊・縁起・舞台）' WHERE id = 4;
UPDATE themes SET name = '金閣・銀閣' WHERE id = 8;

-- ② 節2 神社・寺院 (category_id=2) の新規テーマ
-- ※ 節2の③「嵯峨野観光鉄道」は節1と重複のため省略（要確認）
INSERT INTO themes (category_id, name, description, display_order) VALUES
(2, '寺社を建てた人物（建立者）', '京都の主要寺社を建立・再建した人物について学ぶ', 10),
(2, '天龍寺×足利尊氏×夢窓疎石', '天龍寺の創建と足利尊氏・夢窓疎石の関係について学ぶ', 20);

-- ③ 節3 芸術・文化 (category_id=6) の新規テーマ（全6件）
INSERT INTO themes (category_id, name, description, display_order) VALUES
(6, '茶屋と家元',     '京都の茶道の家元と茶屋文化について学ぶ', 1),
(6, '京ことば',       '京都特有の言葉・方言について学ぶ', 2),
(6, '伝統工芸',       '西陣織・京染めなど京都の伝統工芸について学ぶ', 3),
(6, '近代日本画家',   '京都を拠点に活躍した近代の日本画家について学ぶ', 4),
(6, '京焼・清水焼',   '京焼・清水焼の歴史と代表的な作家について学ぶ', 5),
(6, 'いけばな・池坊', 'いけばなの発祥と池坊家元について学ぶ', 6);

-- ④ 節4 建築・庭園・美術 (category_id=5) の新規テーマ（金閣・銀閣はID8で既存）
INSERT INTO themes (category_id, name, description, display_order) VALUES
(5, '桂離宮とブルーノ・タウト', '桂離宮の建築美とブルーノ・タウトの評価について学ぶ', 2),
(5, '庭園石組・作庭技法',       '日本庭園の石組みと作庭技法について学ぶ', 3),
(5, '近代建築',                 '京都の近代建築の特徴と代表的建造物について学ぶ', 4),
(5, '京町家・伝統建築',         '京町家の構造と伝統的建築様式について学ぶ', 5);

-- ⑤ 節5 食文化 (category_id=3) の新規テーマ（京野菜はID6で既存）
INSERT INTO themes (category_id, name, description, display_order) VALUES
(3, '京懐石・一汁三菜', '京料理の基本と懐石料理の作法について学ぶ', 2),
(3, '京菓子',           '京都の伝統菓子と和菓子文化について学ぶ', 3),
(3, '伏見の清酒',       '伏見の酒造りの歴史と代表的な銘酒について学ぶ', 4);

-- ⑥ 節6 祭り・行事 (category_id=4) の新規テーマ（祇園祭はID7で既存）
INSERT INTO themes (category_id, name, description, display_order) VALUES
(4, '年中行事',     '京都の年中行事と季節の祭りについて学ぶ', 2),
(4, '八朔・事始め', '花街の八朔と芸能の事始めの習慣について学ぶ', 3);

-- ============================================================
-- 実行後の確認クエリ
-- ============================================================
-- SELECT id, category_id, name, display_order
-- FROM themes
-- ORDER BY category_id, display_order;
-- → 合計25件（既存8件＋新規17件）が表示されれば成功
