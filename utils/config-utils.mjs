import fs from "fs";
import path from "path";

// デフォルト設定
export const defaultConfig = {
  quality: {
    jpg: 70,
    png: 70,
    gif: 70,
    webp: 70
  },
  input: "src/img",
  output: "dist/assets/img"
};

/**
 * JSONスキーマに対してデータを検証する
 * @param {Object} data 検証するデータ
 * @param {Object} schema JSONスキーマ
 * @returns {Array} エラーメッセージの配列 (検証OK時は空配列)
 */
function validateSchema(data, schema) {
  const errors = [];

  // オブジェクト型の検証
  if (schema.type === 'object' && typeof data !== 'object') {
    return [`型が一致しません: ${schema.type} が期待されましたが ${typeof data} が見つかりました`];
  }

  if (schema.type === 'object' && data !== null) {
    // プロパティの検証
    for (const propName in schema.properties) {
      const propSchema = schema.properties[propName];

      // プロパティが存在する場合、再帰的に検証
      if (data.hasOwnProperty(propName)) {
        const propErrors = validateSchema(data[propName], propSchema);
        errors.push(...propErrors.map(err => `${propName}: ${err}`));
      }
    }

    // 未定義プロパティのチェック
    if (schema.additionalProperties === false) {
      for (const propName in data) {
        if (!schema.properties.hasOwnProperty(propName)) {
          errors.push(`未定義のプロパティが見つかりました: ${propName}`);
        }
      }
    }
  }

  // 数値の範囲検証
  if ((schema.type === 'integer' || schema.type === 'number') && typeof data === 'number') {
    if (schema.minimum !== undefined && data < schema.minimum) {
      errors.push(`値が最小値より小さいです: ${data} < ${schema.minimum}`);
    }

    if (schema.maximum !== undefined && data > schema.maximum) {
      errors.push(`値が最大値より大きいです: ${data} > ${schema.maximum}`);
    }
  }

  return errors;
}

/**
 * スキーマファイルを読み込む
 * @returns {Object|null} スキーマオブジェクトまたはnull
 */
function loadSchema() {
  try {
    const schemaPath = path.join(path.dirname(new URL(import.meta.url).pathname), '../schemas/leggierorc.schema.json');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    return JSON.parse(schemaContent);
  } catch (error) {
    console.log('\u001b[1;33m スキーマファイルの読み込みに失敗しました。スキーマ検証をスキップします。');
    return null;
  }
}

/**
 * 設定ファイルを読み込む
 * @param {Object} cliOptions コマンドライン引数オプション
 * @returns {Object} 設定オブジェクト
 */
export function loadConfig(cliOptions = {}) {
  const configPath = path.resolve('.leggierorc');
  let config = { ...defaultConfig };

  // コマンドライン引数の処理
  const cliInput = cliOptions.input || cliOptions.source || "";
  const cliOutput = cliOptions.output || "";

  try {
    // 設定ファイルが存在する場合のみ処理
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      const userConfig = JSON.parse(configContent);

      // 後方互換性のための処理
      if (userConfig.source && !userConfig.input) {
        userConfig.input = userConfig.source;
      }

      // スキーマ検証
      const schema = loadSchema();
      if (schema) {
        const errors = validateSchema(userConfig, schema);
        if (errors.length > 0) {
          console.log('\u001b[1;31m 設定ファイルの検証に失敗しました:');
          errors.forEach(err => console.log(`\u001b[1;31m - ${err}`));
          console.log('\u001b[1;33m デフォルト設定を使用します。');

          // エラーがある場合はデフォルト設定を使用
          config = { ...defaultConfig };
        } else {
          // 検証OKの場合は設定をマージ
          config = mergeConfig(userConfig);
        }
      } else {
        // スキーマがない場合も設定をマージ
        config = mergeConfig(userConfig);
      }
    }
  } catch (error) {
    console.log('\u001b[1;33m 設定ファイルの読み込みに失敗しました:', error.message);
    console.log('\u001b[1;33m デフォルト設定を使用します。');
  }

  // コマンドライン引数が優先
  if (cliInput) config.input = cliInput;
  if (cliOutput) config.output = cliOutput;

  return config;
}

/**
 * ユーザー設定とデフォルト設定をマージ
 * @param {Object} userConfig ユーザー設定
 * @returns {Object} マージされた設定
 */
function mergeConfig(userConfig) {
  return {
    quality: {
      ...defaultConfig.quality,
      ...(userConfig.quality || {})
    },
    input: userConfig.input || defaultConfig.input,
    output: userConfig.output || defaultConfig.output
  };
}
