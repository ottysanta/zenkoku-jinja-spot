# Guardian LP Asset Map
# 守護神社診断 /guardian-v2 アセット整理表

生成日: 2026-05-28
画像元: GPT Image 2 連続生成（2バッチ）
注意: ダウンロードファイル名は信用せず、canonical name で管理

---

## 採用画像（10枚）

| canonical name | 元ファイル | サイズ | 寸法 | 推定内容 | 使用箇所 |
|---|---|---|---|---|---|
| guardian-hero-desktop.webp | 19_54_08 (6).png | 2.7MB | 1672×941 | 鳥居・神社 夜景（最大詳細） | Hero セクション背景・デスクトップ |
| guardian-hero-mobile.webp | 19_54_05 (2).png | 1.7MB | 941×1672 | 縦長神社夜景（ポートレート） | Hero セクション背景・モバイル |
| guardian-logic-bg.webp | 19_54_09 (8).png | 2.7MB | 1672×941 | 神秘的神社・五行要素（大） | 診断ロジックセクション背景 |
| guardian-definition-bg.webp | 19_57_03 (5).png | 2.47MB | 1448×1086 | 4:3 大画面神社・灯籠 | 守護神社とは セクション背景 |
| guardian-final-cta-bg.webp | 19_57_05 (10).png | 2.4MB | 1672×941 | ドラマチック神社夜景 | 最終CTA セクション背景 |
| guardian-form-bg.webp | 19_57_04 (9).png | 2.1MB | 1672×941 | 装飾的神社・桜 | フォームセクション背景 |
| guardian-three-shrines-bg.webp | 19_57_02 (2).png | 1.99MB | 1672×941 | 神社群・参道 | 三守護セクション背景 |
| guardian-intro-bg.webp | 19_57_02 (1).png | 1.86MB | 1916×821 | 超横長パノラマ神社 | イントロ・帯装飾 |
| guardian-quote-panel-bg.webp | 19_57_03 (4).png | 1.91MB | 1448×1086 | 4:3 神社・装飾パネル | 引用ボックス・定義パネル |
| guardian-testimonials-bg.webp | 19_57_03 (6).png | 1.86MB | 1672×941 | 神社夜景（中程度） | 体験者の声セクション背景 |

---

## 予備画像（10枚・raw名で保存済み）

| raw name | 元ファイル | 寸法 | 理由 |
|---|---|---|---|
| raw-01.webp | 19_54_05 (1).png | 1672×941 | 同系統の景観、優先度低 |
| raw-03.webp | 19_54_05 (3).png | 1672×941 | 同系統の景観 |
| raw-04.webp | 19_54_05 (4).png | 1672×941 | 同系統の景観 |
| raw-05.webp | 19_54_08 (5).png | 1672×941 | 同系統の景観 |
| raw-07.webp | 19_54_08 (7).png | 1672×941 | 小さめファイル |
| raw-09.webp | 19_54_09 (9).png | 1672×941 | 同系統 |
| raw-10.webp | 19_54_09 (10).png | 1672×941 | 同系統 |
| raw-13.webp | 19_57_03 (3).png | 1672×941 | 同系統 |
| raw-17.webp | 19_57_03 (7).png | 1916×821 | 超横長（予備パノラマ） |
| raw-18.webp | 19_57_04 (8).png | 2172×724 | 極横長（区切り用候補） |

---

## 選定基準

1. **ファイルサイズ**: 大きいほど詳細で複雑な画像 → Hero/LogicなどキーセクションにLarge画像を優先
2. **縦横比**:
   - 1672×941 (16:9): セクション背景の標準
   - 941×1672 (9:16): モバイルHero/縦長コンテンツ専用
   - 1916×821 / 2172×724 (超横長): パノラマ帯・ヘッダー帯
   - 1448×1086 (4:3): パネル・カード・ボックス
3. **重複排除**: 似た景観の画像を複数採用しない
4. **役割明確化**: 採用した全画像に固有の役割を付与

---

## ディレクトリ構成

```
apps/web/public/images/guardian/
  assets/
    guardian-hero-desktop.webp      ← Hero BG (desktop)
    guardian-hero-mobile.webp       ← Hero BG (mobile)
    guardian-logic-bg.webp          ← 診断ロジック BG
    guardian-definition-bg.webp     ← 守護神社とは BG
    guardian-final-cta-bg.webp      ← 最終CTA BG
    guardian-form-bg.webp           ← フォーム BG
    guardian-three-shrines-bg.webp  ← 三守護 BG
    guardian-intro-bg.webp          ← イントロ帯 BG
    guardian-quote-panel-bg.webp    ← 引用パネル BG
    guardian-testimonials-bg.webp   ← 体験者の声 BG
    raw-01〜raw-20.webp             ← 予備（未使用raw）
```

---

## 注意事項

- コード内では **canonical name のみ使用** する（raw名やダウンロード名を直書き禁止）
- 画像の実際の内容は GPT Image 2 生成のため、推定内容とズレる可能性あり
- 別バッチで生成する場合も canonical name を維持し、差し替えだけで完了するようにする
