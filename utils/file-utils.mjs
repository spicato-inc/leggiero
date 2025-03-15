import fs from "fs";
import path from "path";

/**
 * ファイルの拡張子を取得
 * @param {string} file ファイル名またはパス
 * @returns {string} 拡張子 (ドットなし)
 */
export function getExtension(file) {
  const ext = path.extname(file || "").toLowerCase();
  return ext ? ext.substring(1) : "";
}

/**
 * ディレクトリを再帰的に作成
 * @param {string} dirPath 作成するディレクトリパス
 */
export function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * ディレクトリを再帰的に走査してファイル一覧を取得
 * @param {string} folderPath 走査するディレクトリ
 * @param {function} callback 完了時のコールバック関数 (ファイル一覧を引数に取る)
 */
export function readDirRecursive(folderPath, callback) {
  const result = [];
  let execCounter = 0;

  const processDir = (dirPath) => {
    execCounter++;
    fs.readdir(dirPath, (err, items) => {
      if (err) {
        console.error('\u001b[1;31m ディレクトリの読み込みエラー:', err);
        execCounter--;
        if (execCounter === 0 && callback) callback(result);
        return;
      }

      items.forEach((item) => {
        const fullPath = path.join(dirPath, item);
        try {
          const stats = fs.statSync(fullPath);
          if (stats.isFile()) {
            result.push(fullPath);
          } else if (stats.isDirectory()) {
            processDir(fullPath);
          }
        } catch (statErr) {
          console.error('\u001b[1;31m ファイル情報取得エラー:', statErr);
        }
      });

      execCounter--;
      if (execCounter === 0 && callback) {
        callback(result);
      }
    });
  };

  processDir(folderPath);
}
