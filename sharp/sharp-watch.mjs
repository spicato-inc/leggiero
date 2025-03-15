import fs from "fs";
import path from "path";
import sharp from "sharp";

const changedFile = process.argv[2];
const sourceBase = process.argv[3];
const destRoot = process.argv[4] || "public";

// 設定ファイルを読み込む
function loadConfig() {
  const configPath = path.resolve('.leggierorc');
  const defaultConfig = {
    quality: {
      jpg: 70,
      png: 70,
      gif: 70,
      webp: 70
    }
  };

  try {
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configContent);
      return {
        quality: {
          ...defaultConfig.quality,
          ...config.quality
        }
      };
    }
  } catch (error) {
    console.log('\u001b[1;33m 設定ファイルの読み込みに失敗しました。デフォルト設定を使用します。');
  }
  return defaultConfig;
}

const config = loadConfig();

const fileName = path.basename(changedFile);
const relativeDir = path.relative(
  path.resolve(sourceBase),
  path.dirname(changedFile)
);
let outPutDir = path.join(destRoot, relativeDir);

// 拡張子を取得
function getExtension(file) {
  let ext = path.extname(file || "").split(".");
  return ext[ext.length - 1];
}
const fileFormat = getExtension(fileName);

(() => {
  // 必要なディレクトリがなければ作成
  if (!fs.existsSync(outPutDir)) {
    fs.mkdirSync(outPutDir, { recursive: true });
  }

  if (fileFormat === "svg") {
    fs.copyFile(changedFile, path.join(outPutDir, fileName), (err) => {
      if (err) {
        fs.unlinkSync(path.join(outPutDir, fileName));
        console.log(`\u001b[1;33m ${fileName}を${outPutDir}から削除しました。`);
        return;
      }
      console.log(`\u001b[1;32m ${fileName}を${outPutDir}に複製しました。`);
    });
    return;
  }

  let sh = sharp(changedFile);
  let webp = sharp(changedFile);

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
    console.log("\u001b[1;31m 対応していないファイル形式です。");
    return;
  }

  sh.toFile(path.join(outPutDir, fileName), (err, info) => {
    if (err) {
      if (fs.existsSync(path.join(outPutDir, fileName))) {
        fs.unlinkSync(path.join(outPutDir, fileName));
        fs.unlinkSync(
          path.join(outPutDir, "webp", fileName.replace(/\.[^/.]+$/, ".webp"))
        );
        console.log(`\u001b[1;33m ${fileName}を${outPutDir}から削除しました。`);
      }
      return;
    }
    console.log(
      `\u001b[1;32m ${fileName}を圧縮しました。 ${info.size / 1000}KB`
    );

    if (!fileName.includes("no-webp")) {
      if (!fs.existsSync(path.join(outPutDir, "webp"))) {
        fs.mkdirSync(path.join(outPutDir, "webp"), { recursive: true });
      }
      webp.toFile(
        path.join(outPutDir, "webp", fileName.replace(/\.[^/.]+$/, ".webp")),
        (err, info) => {
          console.log(
            `\u001b[1;32m ${fileName}をwebpに変換しました。 ${
              info.size / 1000
            }KB`
          );
        }
      );
    }
  });
})();
