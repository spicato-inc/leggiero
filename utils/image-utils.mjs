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

  try {
    ensureDirectoryExists(outputPath);

    // ファイルの存在確認
    if (!fs.existsSync(inputFile)) {
      return Promise.reject(new Error(`入力ファイルが見つかりません: ${inputFile}`));
    }

    // サポート対象外の形式の場合は警告メッセージだけ表示して続行
    if (!isSupportedImageFormat(fileName)) {
      console.log(`\u001b[1;33m スキップ: 未対応の形式です: ${fileName}`);
      return Promise.resolve();
    }

    // SVGはコピーのみ
    if (fileFormat === 'svg') {
      return new Promise((resolve, reject) => {
        fs.copyFile(inputFile, path.join(outputPath, fileName), (err) => {
          if (err) {
            console.error(`\u001b[1;31m SVGファイルのコピーに失敗しました: ${err.message}`);
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
  } catch (err) {
    console.error(`\u001b[1;31m 画像処理の準備中にエラーが発生しました: ${err.message}`);
    return Promise.reject(err);
  }
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
    try {
      let imageProcessor;
      let webpProcessor;

      try {
        imageProcessor = sharp(inputFile);
        webpProcessor = generateWebp ? sharp(inputFile) : null;
      } catch (sharpError) {
        console.error(`\u001b[1;31m 画像の読み込みエラー (${fileName}): ${sharpError.message}`);
        reject(sharpError);
        return;
      }

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
          // 未対応形式の場合はエラーを投げずに警告を表示して処理を続行
          console.log(`\u001b[1;33m 未対応の形式です: ${fileFormat} (${fileName})`);
          resolve();
          return;
      }

      const outputFilePath = path.join(outputPath, fileName);

      // 元フォーマットの圧縮保存
      imageProcessor.toFile(outputFilePath)
        .then(info => {
          console.log(`\u001b[1;32m ${fileName}を圧縮しました。 ${info.size / 1000}KB`);

          // WebP変換処理
          if (webpProcessor && !fileName.includes("no-webp")) {
            const webpDir = path.join(outputPath, "webp");

            try {
              ensureDirectoryExists(webpDir);

              return webpProcessor.toFile(
                path.join(webpDir, fileName.replace(/\.[^/.]+$/, ".webp"))
              ).then(webpInfo => {
                console.log(`\u001b[1;32m ${fileName}をWebP形式に変換しました。 ${webpInfo.size / 1000}KB`);
                resolve();
              }).catch(webpErr => {
                console.error(`\u001b[1;31m WebP変換エラー (${fileName}): ${webpErr.message}`);
                // WebP変換に失敗しても元画像は保存できているので成功とする
                resolve();
              });
            } catch (dirErr) {
              console.error(`\u001b[1;31m WebPディレクトリ作成エラー: ${dirErr.message}`);
              // WebPディレクトリ作成に失敗しても元画像は保存できているので成功とする
              resolve();
            }
          } else {
            resolve();
          }
        })
        .catch(err => {
          console.error(`\u001b[1;31m 画像処理エラー (${fileName}): ${err.message}`);
          reject(err);
        });
    } catch (generalError) {
      console.error(`\u001b[1;31m 予期せぬエラーが発生しました (${fileName}): ${generalError.message}`);
      reject(generalError);
    }
  });
}
