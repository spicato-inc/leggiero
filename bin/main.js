#!/usr/bin/env node

const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const command = process.argv[2]; // all または watch
const sourceDir = process.argv[3];
const destDir = process.argv[4];

// 設定ファイルからディレクトリ設定を読み込む (簡易的な実装)
function getConfigDirectories() {
  try {
    const configPath = path.resolve('.leggierorc');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return {
        inputDir: config.input || config.source || "",
        outputDir: config.output || "public"
      };
    }
  } catch (error) {
    // エラーは無視し、デフォルト値を使用
  }
  return { inputDir: "", outputDir: "public" };
}

// 設定ファイルの値とコマンドライン引数を組み合わせる
const config = getConfigDirectories();
const inputDirectory = sourceDir || config.inputDir;
const outputDirectory = destDir || config.outputDir;

function runCommand(scriptPath, args) {
  const child = spawn('node', [scriptPath, ...args], { stdio: 'inherit' });

  child.on('error', (error) => {
    console.error(`エラーが発生しました: ${error.message}`);
    process.exit(1);
  });

  child.on('close', (code) => {
    if (code !== 0) {
      console.error(`コマンドが終了コード ${code} で終了しました`);
      process.exit(code);
    }
  });
}

if (command === 'all') {
  const allScript = path.resolve(__dirname, '../sharp/sharp-all.mjs');
  const args = [inputDirectory, outputDirectory].filter(arg => arg !== undefined);
  runCommand(allScript, args);
} else if (command === 'watch') {
  // 監視対象ディレクトリが指定されていない場合はエラー
  if (!inputDirectory) {
    console.error('\u001b[1;31m 監視対象ディレクトリが指定されていません。');
    console.error('\u001b[1;31m コマンドライン引数で指定するか、.leggierorc ファイルで設定してください。');
    process.exit(1);
  }

  const onchangePath = path.resolve(__dirname, '../node_modules/.bin/onchange');
  const watchScript = path.resolve(__dirname, '../sharp/sharp-watch.mjs');

  // onchangeコマンドを生成
  const watchPattern = path.join(inputDirectory, '**/*.{jpg,jpeg,png,gif,svg}');
  const args = [`"${watchPattern}"`, '--', 'node', watchScript, '{file}', inputDirectory, outputDirectory];

  const onchangeProcess = spawn(onchangePath, args, {
    stdio: 'inherit',
    shell: true
  });

  onchangeProcess.on('error', (error) => {
    console.error(`エラーが発生しました: ${error.message}`);
    process.exit(1);
  });

  onchangeProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`コマンドが終了コード ${code} で終了しました`);
      process.exit(code);
    }
  });
} else {
  console.log(`
レジエロ - 画像圧縮ツール

使用方法:
  leggiero all <input-directory> [output-directory]
  leggiero watch <input-directory> [output-directory]

例:
  leggiero all src/images public
  leggiero watch src/images public

注: ディレクトリは .leggierorc ファイルで事前に設定することも可能です。
`);
}
