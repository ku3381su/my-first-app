# Copilot instructions

## プロジェクト構成

このリポジトリは依存関係のない静的なブラウザーゲームです。`index.html` が日本語のゲーム画面、HUD、Canvas、タッチ操作を定義し、`style.css` と `script.js` を読み込みます。`style.css` はページとレスポンシブ表示を担当し、`script.js` はゲーム状態、入力、物理演算、当たり判定、カメラ、Canvas描画を担当します。

ゲーム画面のCanvasは論理サイズ960×540、ワールド幅は2800pxです。足場とコインの初期配置は `script.js` 上部のデータ配列で管理します。`update()` がゲーム状態を進め、`drawBackground()` と `drawWorld()` が毎フレーム描画します。カメラ位置 `cameraX` はワールド座標のスクロールに使います。

## 実行・確認コマンド

- 実行: ブラウザーで `index.html` を開きます。
- JavaScript構文確認: `node --check script.js`
- ビルド、テスト、lint用の設定や、個別テストを実行する仕組みはありません。

## このリポジトリ固有の約束

- HTML・CSS・JavaScriptを既存の3ファイルに分け、外部ライブラリやビルド工程を追加せずに動作させます。
- ゲーム内の説明・案内・プレイヤー向けメッセージに加え、Copilotからの説明も日本語にしてください。
- HUDやゲーム終了時の表示はHTML要素を `script.js` からIDで操作します。Canvasはスクロールするゲーム世界の描画に使います。
- キーボード操作とタッチ操作を揃えてください。タッチボタンの `data-control` 値はJavaScript側の入力判定と対応しています。
