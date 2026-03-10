# OpenClaw Dashboard

> 用于正确使用 OpenClaw 的自定义控制 UI。  
> 将 Supabase 应用认证与 OpenClaw Gateway 令牌分离，在同一界面管理智能体、会话和聊天。

[![Build](https://img.shields.io/badge/build-passing-brightgreen)](#构建与测试)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](tsconfig.json)
[![License](https://img.shields.io/badge/license-AGPL--3.0-blue)](LICENSE)

**阅读其他语言版本:**
[🇺🇸 English](README.md) · [🇰🇷 한국어](README.ko.md) · [🇯🇵 日本語](README.ja.md)

---

## 目标

**本 UI 的目标是正确使用 OpenClaw。**

| 原则 | 说明 |
|------|------|
| 令牌隔离 | Gateway 令牌仅限服务端使用，绝不暴露给浏览器。 |
| 服务端中继 | 所有 Gateway 通信必须通过 Next.js API Route 进行。 |
| 最小实现 | 每项功能都要回答："这对 OpenClaw 使用流程是否必要？" |

---

## 构建与测试

| 检查项 | 结果 |
|--------|------|
| TypeScript (`tsc --noEmit`) | ✅ 无错误 |
| ESLint (`next lint`) | ✅ 无警告或错误 |
| 生产构建 (`next build`) | ✅ 16 个页面/路由正常生成 |
| Docker Compose 配置 | ✅ local / server 两个配置文件 |

### 路由列表

```
/                             首页 — 智能体概览
/login                        登录 (Supabase 邮箱/密码)
/agents                       智能体列表
/agents/new                   创建智能体
/agents/[id]                  智能体详情与编辑
/sessions                     会话列表 (连接 Gateway 时显示实时数据)
/settings                     设置
/api/agents                   智能体 CRUD API
/api/agents/[id]              智能体单项 API
/api/auth/sign-in             Supabase 登录
/api/auth/sign-out            Supabase 退出
/api/auth/callback            OAuth / 邮件确认回调
/api/openclaw/status          Gateway 状态中继
/api/openclaw/sessions        Gateway 会话列表中继
/api/openclaw/chat            Gateway 聊天中继
```

---

## 技术栈

| 领域 | 选择 |
|------|------|
| 框架 | Next.js 15 (App Router, standalone 输出) |
| 语言 | TypeScript (strict) |
| UI | Tailwind CSS + **shadcn/ui** + **DaisyUI** |
| 国际化 | next-intl (ko · en · ja · zh，支持 env 配置时区) |
| 认证 | Supabase Auth + SSR 客户端 |
| 智能体存储 | JSON 文件 (`AGENT_STORE_PATH`) 或内存存储 |
| Gateway 通信 | 服务端专用 WebSocket 中继 (`ws` 包) |
| 校验 | Zod |
| 容器化 | Docker · Docker Compose (local / server 配置文件) |

---

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp examples/env.local.example .env.local
# 编辑 .env.local，填入实际值
```

### 3. 开发服务器

```bash
npm run dev
# http://localhost:3000
```

### 4. Docker Compose（含 Gateway）

```bash
# 本地开发
docker compose --profile local up -d

# 服务器部署
docker compose --profile server up -d
```

---

## 功能取舍

### 保留（OpenClaw 使用流程所必需）

| 功能 | 说明 | 实现状态 |
|------|------|---------|
| Gateway 中继 | 仅服务端调用，无令牌泄露 | ✅ status · chat · sessions |
| 智能体管理 | CRUD、RBAC、Zod 校验 | ✅ |
| 国际化 · 主题 | ko/en/ja/zh，DaisyUI 主题切换 | ✅ |
| 登录 · 权限 | Supabase 邮箱/密码 + viewer/operator/admin | ✅ |
| 聊天中继 | 用户 ↔ API ↔ Gateway | ✅ `/api/openclaw/chat` |
| 会话列表 | 来自 Gateway 的实时数据 | ✅ 连接 Gateway 后自动显示 |

### 排除（当前阶段不纳入）

| 功能 | 原因 |
|------|------|
| 浏览器中的 Gateway 令牌 | 安全原因，绝对禁止 |
| 完整复制官方 Controller UI | 设备审批等功能按需添加 |
| 复杂的 Dashboard 组件 | 仅在与 OpenClaw 使用直接相关时添加 |
| 客户端直接调用 Gateway | 所有通信必须经过服务端 |

---

## RBAC 权限

| 角色 | 查看智能体 | 创建/编辑/删除 |
|------|:---------:|:-------------:|
| viewer | ✅ | ❌ |
| operator | ✅ | ✅ |
| admin | ✅ | ✅ |

角色从 Supabase 会话 (`user.app_metadata.role`) 读取。  
未配置 Supabase 时，回退到 `x-app-role` 请求头（开发模式）。

---

## 许可证

本项目采用 [GNU Affero General Public License v3.0](LICENSE) 许可证。  
若以修改后的版本提供网络服务，必须向用户公开对应的源代码。
