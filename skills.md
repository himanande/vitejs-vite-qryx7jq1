# Claude Code Skills - 京都検定 3 級アプリ

## Skill 1: 問題データを Supabase に追加する

### 前提条件

- Supabase SQL Editor にアクセス可能
- category_id（1-6）と theme_id（1-25）が確定している
- 問題文と 4 つの選択肢、正答、解説が用意されている

### 手順

#### Step 1: 問題の情報を確認

- category_id: カテゴリ ID（1-6）
- theme_id: テーマ ID（1-25）
- difficulty_level: 1=基礎, 2=応用, 3=上級
- is_premium: プレミアム限定か（true/false）

#### Step 2: SQL 文を作成

```sql
INSERT INTO questions (
  category_id,
  theme_id,
  question_text,
  option_a,
  option_b,
  option_c,
  option_d,
  correct_answer,
  explanation,
  difficulty_level,
  is_premium
) VALUES (
  category_id,
  theme_id,
  '問題文',
  '選択肢A',
  '選択肢B',
  '選択肢C',
  '選択肢D',
  0, -- 0=A, 1=B, 2=C, 3=D
  '解説文（パターン2: 自然な文章形式）',
  difficulty_level,
  is_premium
);
```

#### Step 3: 複数問追加する場合

- 上記を複数回実行するか、複数行をまとめて INSERT

#### Step 4: 実行確認

```sql
SELECT * FROM questions
WHERE theme_id = ?
ORDER BY id DESC
LIMIT 5;
```

### 注意事項

- correct_answer は 0-3 の整数（0=A, 1=B, 2=C, 3=D）
- explanation はパターン 2「自然な文章で誤答も含める」形式
- is_premium は boolean（true/false）
- 同じ問題を複数回追加しない（id は AUTO_INCREMENT）

---

## Skill 2: 新しい React コンポーネントを作成する

### ファイル配置

src/components/

└── NewComponent.tsx

### テンプレート

```typescript
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

interface Props {
  // propsの型定義
}

export const NewComponent: React.FC<Props> = () => {
  const [state, setState] = useState(null);

  return (
    <div className="component-name">
      {/* JSX */}
    </div>
  );
};

export default NewComponent;
```

### 手順

1. src/components/ に NewComponent.tsx を作成
2. React.FC<Props>で型定義
3. App.tsx にインポート
4. JSX 内で使用
5. StackBlitz で動作確認

### スタイリング

- src/App.css に追加
- クラス名: `component-name { ... }`
- TailwindCSS 不使用（ピュア CSS）

---

## Skill 3: Supabase のテーブルを操作する

### SELECT（データ取得）

```javascript
const { data, error } = await supabase
  .from('テーブル名')
  .select('*')
  .eq('カラム名', 値);

if (error) console.error(error);
else console.log(data);
```

### INSERT（データ追加）

```javascript
const { data, error } = await supabase
  .from('テーブル名')
  .insert([
    { カラム1: 値1, カラム2: 値2 }
  ]);

if (error) console.error(error);
else console.log('挿入成功:', data);
```

### UPDATE（データ更新）

```javascript
const { data, error } = await supabase
  .from('テーブル名')
  .update({ カラム: 新しい値 })
  .eq('id', ID);

if (error) console.error(error);
else console.log('更新成功:', data);
```

### DELETE（データ削除）

```javascript
const { data, error } = await supabase
  .from('テーブル名')
  .delete()
  .eq('id', ID);

if (error) console.error(error);
else console.log('削除成功');
```

### 注意事項

- RLS が有効な場合は認証ユーザーである必要がある
- エラーハンドリングは必ずしてください
- 複数行操作時は map()または for ループを使用

---

## Skill 4: バグを診断して修正する

### 診断手順

#### Step 1: エラーメッセージを確認

- StackBlitz の右側プレビューウィンドウで確認
- Supabase ダッシュボードのログを確認

#### Step 2: エラーの種類を特定

- **ReferenceError**: 変数/関数が定義されていない
- **TypeError**: 型が合わない
- **SyntaxError**: 構文エラー
- **NetworkError**: Supabase 接続エラー
- **ValidationError**: 入力値が不正

#### Step 3: 該当箇所を修正

- StackBlitz のエディタで該当行を確認・修正

#### Step 4: 修正確認

- StackBlitz で自動ホットリロード（ファイル保存で自動反映）
- プレビューウィンドウで動作確認

### よくあるバグ

| バグ                        | 原因              | 修正方法                                 |
| --------------------------- | ----------------- | ---------------------------------------- |
| "Cannot read property 'id'" | null チェックなし | if (user?.id) で確認                     |
| Supabase 接続エラー         | API キー不正      | supabaseClient.js を確認                 |
| 問題が表示されない          | theme_id 未設定   | UPDATE questions SET theme_id=? WHERE... |
| 画面が左寄り                | CSS margin 未設定 | .login-container { margin: 0 auto; }     |

---

## Skill 5: StackBlitz で開発する

### 特徴

- セットアップ不要
- ファイル保存で自動ホットリロード
- ブラウザ内にプレビュー表示
- URL で他人と共有可能

### よく使う操作

- **左側**: ファイルツリー（新規ファイル/フォルダ作成）
- **中央**: コード編集（自動保存）
- **右側**: プレビュー（F12 でコンソール開く）

### トラブル時

- **プレビューが更新されない** → 右側パネルの「Refresh」ボタンをクリック
- **エラーが表示されない** → F12 でコンソール確認
- **npm コマンド実行** → 左側の「Terminal」タブで実行

---

## Skill 6: プロジェクト引き継ぎ情報の確認

### 優先順位を確認する手順

1. **handoff.md を読む**

   - 現在の進捗（60%完了）
   - 完了済みタスク
   - 未完了タスク
   - 現在の問題

2. **system-overview.md を読む**

   - システム構成図
   - DB スキーマ
   - API 一覧

3. **優先度順に作業する**
   - Priority 1: UI/UX 修正
   - Priority 2: 問題データ追加
   - Priority 3: DB 保存機能実装
