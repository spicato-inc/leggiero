import path from "path";
import { loadConfig } from "../utils/config-utils.mjs";
import { readDirRecursive, ensureDirectoryExists } from "../utils/file-utils.mjs";
import { processImage } from "../utils/image-utils.mjs";

// コマンドライン引数から取得
let cliSourceDir = process.argv[2];
let cliDestRoot = process.argv[3];

// 設定ファイルを読み込む (コマンドラインオプションを優先)
const config = loadConfig({
  input: cliSourceDir,
  output: cliDestRoot
});

// ソースと出力先の決定
const sourceDir = config.input;
const destRoot = config.output;

// 入力ディレクトリチェック
if (!sourceDir) {
  console.error('\u001b[1;31m 入力ディレクトリが指定されていません。');
  console.error('\u001b[1;31m コマンドライン引数で指定するか、.leggierorc ファイルの input プロパティで設定してください。');
  process.exit(1);
}

// 出力ディレクトリの作成
ensureDirectoryExists(destRoot);

// サブディレクトリを含む全ファイルを処理
readDirRecursive(sourceDir, (files) => {
  // 順次処理
  Promise.all(files.map(filePath => {
    // ソースディレクトリ内での相対パスを取得
    const relativeDir = path.relative(
      path.resolve(sourceDir),
      path.dirname(filePath)
    );

    // 出力先ディレクトリパス
    const outputDir = path.join(destRoot, relativeDir);

    // 画像処理
    return processImage(filePath, outputDir, config, true)
      .catch(err => console.error('\u001b[1;31m 処理エラー:', err));
  }))
  .then(() => {
    console.log('\u001b[1;32m すべての画像処理が完了しました。');
  })
  .catch(err => {
    console.error('\u001b[1;31m 処理中にエラーが発生しました:', err);
  });
});
