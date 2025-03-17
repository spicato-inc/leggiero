# leggiero

**leggiero** は [sharp](https://sharp.pixelplumbing.com/) を用いた画像圧縮ツールです。

『leggiero』 とは、音楽用語で「軽やかで優美に」という意味を持ち、画像ファイルを軽くするという意図を込めています。

このツールを使うと、JPEG、PNG、GIF などの画像を圧縮し、元のディレクトリ構造を保持したまま出力先に保存できます。また、WebP 形式への変換にも対応しています。（ただし、ファイル名に「no-webp」が含まれている場合は変換をスキップします。）

なお、SVG ファイルについては、圧縮せずにそのままコピーします。

## 特徴

- **all モード** - 指定したディレクトリ内の全画像を再帰的に処理します
- **watch モード** - 指定したディレクトリの画像変更を監視し、変更時に自動処理します
- 元ディレクトリと同じ構造を出力先にも再現します
- 圧縮品質やパスを柔軟にカスタマイズ可能

## インストール

leggiero をインストールすると、必要な依存パッケージ（sharp, onchange）も自動的にインストールされます。

```bash
# グローバルインストール
npm install -g @spicato-inc/leggiero

# または、プロジェクト内でのインストール
npm install --save-dev @spicato-inc/leggiero
```

## 使い方

### 圧縮 (all モード)

指定したディレクトリ内の全画像を圧縮します。

```bash
leggiero all <入力ディレクトリ> [出力ディレクトリ]
```

例:

```bash
leggiero all src/assets/images dist/img
```

### 監視 (watch モード)

指定したディレクトリを監視し、画像に変更があった場合に自動で処理を行います。

```bash
leggiero watch <入力ディレクトリ> [出力ディレクトリ]
```

例:

```bash
leggiero watch src/assets/images dist/img
```

### 設定ファイル

プロジェクトのルートディレクトリに `.leggierorc` ファイルを作成することで、設定をカスタマイズできます。

```json
{
  "quality": {
    "jpg": 70,
    "png": 70,
    "gif": 70,
    "webp": 70
  },
  "input": "src/img",
  "output": "dist/assets/img"
}
```

設定ファイルの詳細:

- `quality`: 各フォーマットの圧縮品質 (0-100)
- `input`: 入力ディレクトリパス
- `output`: 出力ディレクトリパス

注意点:

- 設定ファイルが存在しない場合は、デフォルト値が使用されます
- コマンドライン引数が指定された場合、設定ファイルの値より優先されます
- 数値が大きいほど高品質になりますが、ファイルサイズも大きくなります

## 内部動作

1. **all モード**:
   - 指定したディレクトリ内のファイルをすべて再帰的に走査します
   - 対応するファイル (jpg, png, gif, svg) のみを処理します
   - 出力先にディレクトリ構造を再現して保存します

2. **watch モード**:
   - `onchange` ライブラリを使って、指定ディレクトリの変更を監視します
   - 変更があったファイルのみを処理します

3. **処理内容**:
   - JPEG, PNG, GIF: 指定した品質で圧縮し保存
   - SVG: そのままコピー
   - WebP: 上記のすべての形式を追加でWebP形式にも変換 (no-webp除外)

## ディレクトリ構造

``` plaintext
leggiero/
├── bin/                # 実行ファイル
├── schemas/            # JSONスキーマ
├── sharp/              # 画像処理スクリプト
├── templates/          # テンプレートファイル
├── utils/              # ユーティリティ関数
└── README.md           # このファイル
```

## ライセンス

MIT License
© spicato inc.
