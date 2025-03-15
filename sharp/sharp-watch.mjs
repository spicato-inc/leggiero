import path from "path";
import { loadConfig } from "../utils/config-utils.mjs";
import { ensureDirectoryExists } from "../utils/file-utils.mjs";
import { processImage, isSupportedImageFormat } from "../utils/image-utils.mjs";

// コマンドライン引数から取得
const changedFile = process.argv[2];
const cliSourceBase = process.argv[3];
const cliDestRoot = process.argv[4];

// 設定ファイルを読み込む
const config = loadConfig({
  input: cliSourceBase,
  output: cliDestRoot
});

// ソースと出力先の決定
const sourceBase = config.input || cliSourceBase;
const destRoot = config.output;

// 入力ディレクトリチェック
if (!sourceBase) {
  console.error('\u001b[1;31m 監視対象ディレクトリが指定されていません。');
  console.error('\u001b[1;31m コマンドライン引数で指定するか、.leggierorc ファイルの input プロパティで設定してください。');
  process.exit(1);
}

// 相対パスと出力先の計算
const fileName = path.basename(changedFile);
const relativeDir = path.relative(
  path.resolve(sourceBase),
  path.dirname(changedFile)
);
const outputDir = path.join(destRoot, relativeDir);

// サポート対象の画像フォーマットかチェック
if (!isSupportedImageFormat(fileName)) {
  console.log(`\u001b[1;31m 対応していないファイル形式です: ${fileName}`);
  process.exit(0);
}

// メイン処理
(async () => {
  try {
    // 出力ディレクトリ作成
    ensureDirectoryExists(outputDir);

    // 画像処理
    await processImage(changedFile, outputDir, config, true);

  } catch (error) {
    console.error('\u001b[1;31m 処理中にエラーが発生しました:', error);
    process.exit(1);
  }
})();
