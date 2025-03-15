import fs from "fs";
import path from "path";

// デフォルト設定
const defaultConfig = {
  quality: {
    jpg: 70,
    png: 70,
    gif: 70,
    webp: 70
  },
  input: "",
  output: "public"
};

/**
 * JSONスキーマに対してデータを検証する
 * @param {Object} data 検証するデータ
 * @param {Object} schema JSONスキーマ
 * @returns {Array} エラーメッセージの配列 (検証OK時は空配列)
 */
function validateSchema(data, schema) {
  const errors = [];

  // スキーマが型チェックに対応しているか確認
  if (schema.type && schema.type !== typeof data) {
    if (schema.type === 'object' && typeof data !== 'object') {
      errors.push(`型が一致しません: ${schema.type} が期待されましたが ${typeof data} が見つかりました`);
      return errors;
    }
  }

  if (schema.type === 'object' && data !== null) {
    // プロパティチェック
    for (const propName in schema.properties) {
      const propSchema = schema.properties[propName];

      // プロパティの存在チェック
      if (propSchema.required && !data.hasOwnProperty(propName)) {
        errors.push(`必須プロパティが見つかりません: ${propName}`);
        continue;
      }

      // プロパティが存在する場合、再帰的に検証
      if (data.hasOwnProperty(propName)) {
        const propErrors = validateSchema(data[propName], propSchema);
        errors.push(...propErrors.map(err => `${propName}: ${err}`));
      }
    }

    // additionalPropertiesチェック
    if (schema.additionalProperties === false) {
      for (const propName in data) {
        if (!schema.properties.hasOwnProperty(propName)) {
          errors.push(`未定義のプロパティが見つかりました: ${propName}`);
        }
      }
    }
  }

  // 数値の範囲チェック
  if (schema.type === 'integer' || schema.type === 'number') {
    const value = Number(data);

    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push(`値が最小値より小さいです: ${value} < ${schema.minimum}`);
    }

    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push(`値が最大値より大きいです: ${value} > ${schema.maximum}`);
    }
  }

  return errors;
}

/**
 * 設定ファイルを読み込む
 * @param {Object} cliOptions コマンドラインオプション
 * @returns {Object} 設定オブジェクト
 */
export function loadConfig(cliOptions = {}) {
  const configPath = path.resolve('.leggierorc');
  let config = { ...defaultConfig };

  // CLIオプションでinputとoutputが指定されていれば一時的に保存
  const cliInput = cliOptions.input || cliOptions.source || "";
  const cliOutput = cliOptions.output || "";

  try {
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      const userConfig = JSON.parse(configContent);

      // sourceプロパティがあればinputにコピー (後方互換性のため)
      if (userConfig.source && !userConfig.input) {
        userConfig.input = userConfig.source;
      }

      // スキーマファイルを読み込み
      const schemaPath = path.join(path.dirname(new URL(import.meta.url).pathname), '../schemas/leggierorc.schema.json');
      let schema;

      try {
        const schemaContent = fs.readFileSync(schemaPath, 'utf8');
        schema = JSON.parse(schemaContent);
      } catch (schemaErr) {
        console.log('\u001b[1;33m スキーマファイルの読み込みに失敗しました。スキーマ検証をスキップします。');

        // スキーマなしでマージ
        config = {
          quality: {
            ...defaultConfig.quality,
            ...(userConfig.quality || {})
          },
          input: userConfig.input || defaultConfig.input,
          output: userConfig.output || defaultConfig.output
        };
      }

      if (schema) {
        // スキーマ検証
        const errors = validateSchema(userConfig, schema);
        if (errors.length > 0) {
          console.log('\u001b[1;31m 設定ファイルがスキーマ検証に失敗しました:');
          errors.forEach(err => console.log(`\u001b[1;31m - ${err}`));
          console.log('\u001b[1;33m デフォルト設定を使用します。');
        } else {
          // 検証OKなのでマージ
          config = {
            quality: {
              ...defaultConfig.quality,
              ...(userConfig.quality || {})
            },
            input: userConfig.input || defaultConfig.input,
            output: userConfig.output || defaultConfig.output
          };
        }
      }
    }
  } catch (error) {
    console.log('\u001b[1;33m 設定ファイルの読み込みに失敗しました:', error.message);
    console.log('\u001b[1;33m デフォルト設定を使用します。');
  }

  // コマンドラインオプションが優先
  if (cliInput) {
    config.input = cliInput;
  }

  if (cliOutput) {
    config.output = cliOutput;
  }

  return config;
}
