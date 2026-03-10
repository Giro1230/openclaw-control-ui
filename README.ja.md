# OpenClaw Dashboard

> OpenClaw を正しく使うためのカスタムコントロール UI。  
> Supabase アプリ認証と OpenClaw Gateway トークンを分離し、エージェント・セッション・チャットを一箇所で管理する。

[![Build](https://img.shields.io/badge/build-passing-brightgreen)](#ビルドテスト)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](tsconfig.json)
[![License](https://img.shields.io/badge/license-AGPL--3.0-blue)](LICENSE)

**他の言語で読む:**
[🇺🇸 English](README.md) · [🇰🇷 한국어](README.ko.md) · [🇨🇳 简体中文](README.zh.md)

---

## 目的

**この UI は OpenClaw を正しく使うために作る。**

| 原則 | 説明 |
|------|------|
| トークン分離 | Gateway トークンはサーバー専用。ブラウザには絶対に露出しない。 |
| サーバーリレー | すべての Gateway 通信は Next.js API Route 経由のみ。 |
| 最小実装 | 「OpenClaw の使用フローに必要か?」を基準に機能を追加する。 |

---

## ビルド・テスト

| 項目 | 結果 |
|------|------|
| TypeScript (`tsc --noEmit`) | ✅ エラーなし |
| ESLint (`next lint`) | ✅ 警告・エラーなし |
| プロダクションビルド (`next build`) | ✅ 16ページ/ルート正常生成 |
| Docker Compose 構成 | ✅ local / server プロファイル |

### ルート一覧

```
/                             ホーム — エージェント概況
/login                        ログイン (Supabase メール/パスワード)
/agents                       エージェント一覧
/agents/new                   エージェント作成
/agents/[id]                  エージェント詳細・編集
/sessions                     セッション一覧 (Gateway 接続時は実データ)
/settings                     設定
/api/agents                   エージェント CRUD API
/api/agents/[id]              エージェント単体 API
/api/auth/sign-in             Supabase サインイン
/api/auth/sign-out            Supabase サインアウト
/api/auth/callback            OAuth / メール確認コールバック
/api/openclaw/status          Gateway ステータスリレー
/api/openclaw/sessions        Gateway セッション一覧リレー
/api/openclaw/chat            Gateway チャットリレー
```

---

## スタック

| 領域 | 選択 |
|------|------|
| フレームワーク | Next.js 15 (App Router, standalone) |
| 言語 | TypeScript (strict) |
| UI | Tailwind CSS + **shadcn/ui** + **DaisyUI** |
| i18n | next-intl (ko · en · ja · zh、タイムゾーン env 設定) |
| 認証 | Supabase Auth + SSR クライアント |
| エージェントストア | JSON ファイル (`AGENT_STORE_PATH`) またはインメモリ |
| Gateway 通信 | サーバー専用 WebSocket リレー (`ws` パッケージ) |
| バリデーション | Zod |
| コンテナ | Docker · Docker Compose (local / server プロファイル) |

---

## クイックスタート

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

```bash
cp examples/env.local.example .env.local
# .env.local を開いて値を確認・修正
```

### 3. 開発サーバー

```bash
npm run dev
# http://localhost:3000
```

### 4. Docker Compose (Gateway 込み)

```bash
# ローカル開発
docker compose --profile local up -d

# サーバーデプロイ
docker compose --profile server up -d
```

---

## 必要なもの / 不要なもの

### 必要なもの

| 機能 | 内容 | 実装状況 |
|------|------|---------|
| Gateway リレー | サーバーのみ Gateway 呼び出し、トークン漏洩なし | ✅ status · chat · sessions |
| エージェント管理 | CRUD、RBAC、Zod バリデーション | ✅ |
| i18n · テーマ | ko/en/ja/zh、DaisyUI テーマ切替 | ✅ |
| ログイン・権限 | Supabase メール/パスワード + viewer/operator/admin | ✅ |
| チャットリレー | ユーザー ↔ API ↔ Gateway | ✅ `/api/openclaw/chat` |
| セッション一覧 | Gateway からの実データ表示 | ✅ Gateway 接続時に自動表示 |

### 不要なもの

| 機能 | 理由 |
|------|------|
| ブラウザへの Gateway トークン | セキュリティ上絶対不可 |
| 公式 Controller UI の完全複製 | デバイス承認等は必要時のみ追加 |
| 重い Dashboard ウィジェット | OpenClaw の使用に直結するときのみ追加 |
| クライアントから直接 Gateway 呼び出し | すべての通信はサーバー経由 |

---

## RBAC

| ロール | エージェント閲覧 | 作成・編集・削除 |
|--------|:--------------:|:--------------:|
| viewer | ✅ | ❌ |
| operator | ✅ | ✅ |
| admin | ✅ | ✅ |

ロールは Supabase セッション (`user.app_metadata.role`) から取得。  
Supabase 未設定時は `x-app-role` ヘッダーにフォールバック（開発用）。

---

## ライセンス

このプロジェクトは [GNU Affero General Public License v3.0](LICENSE) でライセンスされています。  
修正したバージョンをネットワークサービスとして公開する場合、ユーザーにソースコードを公開する義務があります。
