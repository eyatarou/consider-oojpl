# JPL Order Maker

過去のPPR（01）、MPR（CR）、勝敗、レーティングを使い、JPLの13ゲームのオーダーを端末内で提案するAndroidアプリです。

501ダブルス（G4・G10）はダブルイン／ダブルアウトのフリーズ方式として、通常01とは別にPPRを評価します。

## 主な機能

- チーム・選手管理
- 13ゲームの試合結果と選手別PPR／MPR登録
- 通常01、CR、フリーズ501の成績集計
- 最大7ゲームなどの制約を守るオフラインオーダー提案
- 候補比較と手動変更
- テキスト／PNGのAndroid共有
- JSONバックアップ・復元
- 旧Web版のチーム・選手データ移行

## 開発

```powershell
pnpm install
pnpm dev
pnpm test
pnpm build
pnpm android:sync
```

Android Studioで`android`ディレクトリを開き、実機またはエミュレーターへ実行します。Web側を変更した後は`pnpm build`と`pnpm android:sync`を実行してください。

## エミュレーターで起動する

保存スナップショットやGPU設定による起動失敗を避けるには、PowerShellで次を実行します。

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run-android.ps1
```

既定では`Darts_API_30`を使用します。別のAVDを使う場合は`-AvdName`で指定してください。

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run-android.ps1 -AvdName Pixel_3a_API_30_x86
```

スクリプトはWebビルド、Capacitor同期、エミュレーターのクリーン起動、APKのインストール、Activity起動を順番に実行します。

詳細仕様は[設計書](docs/android-app-design.md)を参照してください。
