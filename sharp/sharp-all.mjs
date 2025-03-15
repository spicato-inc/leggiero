import fs from "fs";
import path from "path";
import sharp from "sharp";
import { loadConfig } from "../utils/config-utils.mjs";

// コマンドライン引数から取得
let cliSourceDir = process.argv[2];
let cliDestRoot = process.argv[3];

// 設定ファイルを読み込む (コマンドラインオプションを優先)
const config = loadConfig({
  input: cliSourceDir, // sourceをinputに変更
  output: cliDestRoot
});

// 最終的なソースと出力先
const sourceDir = config.input; // sourceをinputに変更
const destRoot = config.output;

// ソースディレクトリが指定されていない場合はエラー
if (!sourceDir) {
  console.error('\u001b[1;31m ソースディレクトリが指定されていません。');
  console.error('\u001b[1;31m コマンドライン引数で指定するか、.leggierorc ファイルで設定してください。');
  process.exit(1);
}

// 拡張子を確認
function getExtension(file) {
  let ext = path.extname(file || "").split(".");
  return ext[ext.length - 1];
}

const readSubDir = (folderPath, finishFunc) => {
  // フォルダ内の全ての画像の配列
  let result = [];
  let execCounter = 0;

  const readTopDir = (folderPath) => {
    execCounter += 1;
    fs.readdir(folderPath, (err, items) => {
      if (err) {
        console.log(err);
      }

      items = items.map((itemName) => {
        return path.join(folderPath, itemName);
      });

      items.forEach((itemPath) => {
        if (fs.statSync(itemPath).isFile()) {
          result.push(itemPath);
        }
        if (fs.statSync(itemPath).isDirectory()) {
          //フォルダなら再帰呼び出し
          readTopDir(itemPath);
        }
      });

      execCounter -= 1;

      if (execCounter === 0) {
        if (finishFunc) {
          finishFunc(result);
        }
      }
    });
  };

  readTopDir(folderPath);
};

//サブディレクトリの列挙 非同期
readSubDir(sourceDir, (items) => {
  items.forEach((item) => {
    // 各ファイルのsource内での相対パスを取得
    const relativeDir = path.relative(
      path.resolve(sourceDir),
      path.dirname(item)
    );
    const fileName = path.basename(item);
    const fileFormat = getExtension(fileName);
    // dest以下に同じディレクトリ構造を作成
    let outPutDir = path.join(destRoot, relativeDir);

    // 必要なディレクトリがなければ作成
    if (!fs.existsSync(destRoot)) {
      fs.mkdirSync(destRoot, { recursive: true });
    }
    if (!fs.existsSync(outPutDir)) {
      fs.mkdirSync(outPutDir, { recursive: true });
    }

    if (fileFormat === "") {
      console.log(`\u001b[1;31m 対応していないファイルです。-> ${fileName}`);
      return;
    } else if (fileFormat === "svg") {
      fs.copyFile(item, path.join(outPutDir, fileName), (err) => {
        if (err) return;
        console.log(`\u001b[1;32m ${fileName}を${outPutDir}に複製しました。`);
      });
      return;
    }

    let sh = sharp(item);
    let webp = sharp(item);

    if (fileFormat === "jpg" || fileFormat === "jpeg") {
      sh = sh.jpeg({ quality: config.quality.jpg });
      webp = webp.webp({ quality: config.quality.webp });
    } else if (fileFormat === "png") {
      sh = sh.png({ quality: config.quality.png });
      webp = webp.webp({ quality: config.quality.webp });
    } else if (fileFormat === "gif") {
      sh = sh.gif({ quality: config.quality.gif });
      webp = webp.webp({ quality: config.quality.webp });
    } else {
      console.log(`\u001b[1;31m 対応していないファイルです。-> ${fileName}`);
      return;
    }

    sh.toFile(path.join(outPutDir, fileName), (err, info) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log(
        `\u001b[1;32m ${fileName}を圧縮しました。 ${info.size / 1000}KB`
      );

      if (!fileName.includes("no-webp")) {
        const webpDir = path.join(outPutDir, "webp");
        if (!fs.existsSync(webpDir)) {
          fs.mkdirSync(webpDir, { recursive: true });
        }
        webp.toFile(
          path.join(webpDir, fileName.replace(/\.[^/.]+$/, ".webp")),
          (err, info) => {
            if (err) {
              console.error(err);
              return;
            }
            console.log(
              `\u001b[1;32m ${fileName}をwebpに変換しました。 ${
                info.size / 1000
              }KB`
            );
          }
        );
      }
    });
  });
});
