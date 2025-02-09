// scripts/extractAbi.js
const fs = require('fs');
const path = require('path');

// 再帰的にディレクトリ内のファイルを処理する関数
function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const fullPath = path.join(dir, f);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath, callback);
    } else {
      callback(fullPath);
    }
  });
}

// Hardhat のコンパイル結果が出力されるディレクトリ（デフォルトでは artifacts/contracts）
const artifactsDir = path.join(__dirname, '..', 'artifacts', 'contracts');
// 出力先ディレクトリ。プロジェクト直下に "abis" フォルダを作成します。
const outputDir = path.join(__dirname, '..', 'abis');

// 出力先ディレクトリが存在しない場合は作成する
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// artifacts ディレクトリ内の全ての .json ファイルを探索
walkDir(artifactsDir, function(filePath) {
  if (filePath.endsWith('.json')) {
    try {
      const artifact = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      // artifact に abi プロパティが存在すれば抽出対象とする
      if (artifact.abi) {
        // ファイル名は例として「MyContract.json」などになっているはずなのでそれをそのまま利用
        const fileName = path.basename(filePath);
        const outputFilePath = path.join(outputDir, fileName);
        // ABI 部分のみを整形して JSON として出力
        fs.writeFileSync(outputFilePath, JSON.stringify(artifact.abi, null, 2));
        console.log(`ABI を抽出し、${outputFilePath} に保存しました。`);
      }
    } catch (error) {
      console.error(`ファイル ${filePath} の処理中にエラーが発生しました: ${error}`);
    }
  }
});

