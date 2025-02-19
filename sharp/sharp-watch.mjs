import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

let dirName = path.dirname(process.argv[2]);
let fileName = path.basename(process.argv[2]);

let outPutDir = `public${dirName.replace('src', '')}`;

// 拡張子を取得
function getExtension(file) {
	let ext = path.extname(file || '').split('.');
	return ext[ext.length - 1];
}
const fileFormat = getExtension(fileName);

(() => {
	// もしディレクトリがなければ作成
	if (!fs.existsSync('public/assets/images')) {
		fs.mkdirSync('public/assets/images');
	}
	// サブディレクトリがなければ作成
	if (!fs.existsSync(outPutDir)) {
		fs.mkdirSync(outPutDir);
	}

	let sh = sharp(`${dirName}/${fileName}`);
	let webp = sharp(`${dirName}/${fileName}`);

	if (fileFormat === 'jpg' || fileFormat === 'jpeg') {
		sh = sh.jpeg({ quality: 70 });
		webp = webp.webp({ quality: 70 });
	} else if (fileFormat === 'png') {
		sh = sh.png({ quality: 70 });
		webp = webp.webp({ quality: 70 });
	} else if (fileFormat === 'gif') {
		sh = sh.gif({ quality: 70 });
		webp = webp.webp({ quality: 70 });
	} else if (fileFormat === 'svg') {
		// svgは複製のみ
		fs.copyFile(process.argv[2], `${outPutDir}/${fileName}`, (err) => {
			if (err) {
				fs.unlinkSync(`${outPutDir}/${fileName}`);
				console.log(
					`\u001b[1;33m ${fileName}を${outPutDir}から削除しました。`
				);
				return;
			}
			console.log(
				`\u001b[1;32m ${fileName}を${outPutDir}に複製しました。`
			);
		});
		return;
	} else {
		console.log('\u001b[1;31m 対応していないファイル形式です。');
		return;
	}

	sh.toFile(`${outPutDir}/${fileName}`, (err, info) => {
		if (err) {
			// 該当ファイルがない場合はdistから削除
			if (fs.existsSync(`${outPutDir}/${fileName}`)) {
				fs.unlinkSync(`${outPutDir}/${fileName}`);
				fs.unlinkSync(
					`${outPutDir}/webp/${fileName.replace(
						/\.[^/.]+$/,
						'.webp'
					)}`
				);
				console.log(
					`\u001b[1;33m ${fileName}を${outPutDir}から削除しました。`
				);
			}
			return;
		}
		console.log(
			`\u001b[1;32m ${fileName}を圧縮しました。 ${info.size / 1000}KB`
		);

		// ファイル名に『no-webp』が含む場合は webp を生成しない。
		if (!fileName.includes('no-webp')) {
			// webp生成、もしディレクトリがなければ作成
			if (!fs.existsSync(`${outPutDir}/webp`)) {
				fs.mkdirSync(`${outPutDir}/webp`);
			}
			webp.toFile(
				`${outPutDir}/webp/${fileName.replace(/\.[^/.]+$/, '.webp')}`,
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
