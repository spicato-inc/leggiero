import fs from "fs";
import path from "path";
import sharp from "sharp";
import { getExtension, ensureDirectoryExists } from "./file-utils.mjs";

/**
 * サポートされている画像フォーマットかどうかチェック
 * @param {string} filename ファイル名
 * @returns {boolean} サポート対象のフォーマットかどうか
 */
export function isSupportedImageFormat(filename) {
  const ext = getExtension(filename);
  return ['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext);
}

/**
 * SVGファイルの場合は単純コピー、それ以外は圧縮処理を行う
 * @param {string} inputFile 入力ファイルパス
 * @param {string} outputPath 出力ディレクトリパス
 * @param {Object} config 設定オブジェクト
 * @param {boolean} generateWebp WebP形式も生成するかどうか
 * @returns {Promise} 処理の完了を表すPromise
 */
export function processImage(inputFile, outputPath, config, generateWebp = true) {
  const fileName = path.basename(inputFile);
  const fileFormat = getExtension(fileName);
  ensureDirectoryExists(outputPath);

  // SVGはコピーのみ
  if (fileFormat === 'svg') {
    return new Promise((resolve, reject) => {
      fs.copyFile(inputFile, path.join(outputPath, fileName), (err) => {
        if (err) {
          reject(err);
          return;
        }
        console.log(`\u001b[1;32m ${fileName}を${outputPath}に複製しました。`);
        resolve();
      });
    });
  }

  // 圧縮処理
  return compressImage(inputFile, outputPath, fileName, fileFormat, config, generateWebp);
}

/**
 * 画像を圧縮し、必要に応じてWebP形式も生成
 * @param {string} inputFile 入力ファイルパス
 * @param {string} outputPath 出力ディレクトリパス
 * @param {string} fileName ファイル名
 * @param {string} fileFormat ファイル形式
 * @param {Object} config 設定オブジェクト
 * @param {boolean} generateWebp WebP形式も生成するかどうか
 * @returns {Promise} 処理の完了を表すPromise
 */
function compressImage(inputFile, outputPath, fileName, fileFormat, config, generateWebp) {
  return new Promise((resolve, reject) => {
    let imageProcessor = sharp(inputFile);
    let webpProcessor = generateWebp ? sharp(inputFile) : null;

    // 形式に応じた圧縮処理
    switch (fileFormat) {
      case 'jpg':
      case 'jpeg':
        imageProcessor = imageProcessor.jpeg({ quality: config.quality.jpg });
        if (webpProcessor) webpProcessor = webpProcessor.webp({ quality: config.quality.webp });
        break;
      case 'png':
        imageProcessor = imageProcessor.png({ quality: config.quality.png });
        if (webpProcessor) webpProcessor = webpProcessor.webp({ quality: config.quality.webp });
        break;
      case 'gif':
        imageProcessor = imageProcessor.gif({ quality: config.quality.gif });
        if (webpProcessor) webpProcessor = webpProcessor.webp({ quality: config.quality.webp });
        break;
      default:
        reject(new Error(`未対応の形式です: ${fileFormat}`));
        return;
    }

    // 元フォーマットの圧縮保存
    imageProcessor.toFile(path.join(outputPath, fileName))
      .then(info => {
        console.log(`\u001b[1;32m ${fileName}を圧縮しました。 ${info.size / 1000}KB`);

        // ファイル名に "no-webp" が含まれる場合はWebP変換を行わない
        if (webpProcessor && !fileName.includes("no-webp")) {
          const webpDir = path.join(outputPath, "webp");
          ensureDirectoryExists(webpDir);

          return webpProcessor.toFile(
            path.join(webpDir, fileName.replace(/\.[^/.]+$/, ".webp"))
          ).then(webpInfo => {
            console.log(`\u001b[1;32m ${fileName}をWebP形式に変換しました。 ${webpInfo.size / 1000}KB`);
            resolve();
          });
        }
        resolve();
      })
      .catch(err => {
        console.error('\u001b[1;31m 画像処理エラー:', err);
        reject(err);
      });
  });
}
