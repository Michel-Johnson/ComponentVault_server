# ComponentVault
这是一个管理电子元件的软件，采用网站来作为UI交互，可以将数据存储到本地。目前支持Linux系统部署。
该软件通过Replit生成，已经具备基本功能，满足作者日常使用，后续不再维护。


下面是Replit生成的软件简介。

# ElectroVault - 电子元件库存管理系统

## 概览

ElectroVault 是一个用来管理电子元件库存的现代网页应用。它用 React 前端和 Express 后端搭建，提供了一个全面的解决方案，可以追踪电子元件、监控库存量，并管理库存操作。这个应用界面简洁、响应式，能实时更新数据，并有低库存提醒功能。

## 用户偏好

首选沟通风格：简单、日常语言。

## 系统架构

### 前端架构
*   **框架**：使用 TypeScript 的 React，并用 Vite 作为构建工具。
*   **UI 组件**：基于 Radix UI 基础组件构建的 Shadcn/UI 组件库。
*   **样式**：Tailwind CSS，带有自定义设计令牌和 CSS 变量，用于主题设置。
*   **状态管理**：TanStack Query (React Query)，用于服务器状态管理和缓存。
*   **路由**：Wouter，用于轻量级的客户端路由。
*   **表单处理**：React Hook Form，配合 Zod 验证模式。

### 后端架构
*   **运行时**：Node.js，使用 Express.js 框架。
*   **语言**：TypeScript，使用 ES 模块。
*   **API 设计**：RESTful 端点，用于元件的增删改查 (CRUD) 操作。
*   **数据层**：内存存储实现，带有未来数据库集成的接口。
*   **验证**：前端和后端共享 Zod 模式。
*   **开发**：通过 Vite 集成实现热重载，提供流畅的开发体验。

### 数据存储方案
*   **当前实现**：使用 Map 数据结构进行内存存储。
*   **数据库就绪**：Drizzle ORM 已配置好用于 PostgreSQL，并支持迁移。
*   **模式**：使用 Drizzle 和 Zod 共享 TypeScript 模式，以确保类型安全。
*   **元件模型**：追踪名称、类别、数量、位置、描述和最低库存水平。

### 认证和授权
*   **状态**：目前尚未实现。
*   **架构**：Express session 中间件已配置好，用于未来实现。
*   **会话存储**：PostgreSQL 会话存储已准备好，可用于生产部署。

### API 结构
*   **基本路径**：所有 API 端点都以 `/api` 为前缀。
*   **元件**：完整的增删改查 (CRUD) 操作，带有搜索和过滤功能。
*   **端点**：
    *   `GET /api/components` - 列出元件，可选择搜索和类别过滤。
    *   `GET /api/components/:id` - 获取特定元件的详细信息。
    *   `POST /api/components` - 创建新元件。
    *   `PATCH /api/components/:id` - 更新元件。
    *   `DELETE /api/components/:id` - 删除元件。
    *   `GET /api/components/alerts/low-stock` - 获取低库存提醒。
    *   `GET /api/stats` - 获取库存统计数据。

### 元件管理功能
*   **类别**：预设的电子元件类别（电阻、电容、IC 等）。
*   **库存追踪**：实时数量追踪，并有低库存提醒。
*   **搜索与过滤**：文本搜索和基于类别的过滤。
*   **位置追踪**：存储物理位置，用于元件整理。
*   **库存操作**：快速调整数量，并带有验证。

## 外部依赖

### UI 和样式
*   **Radix UI**：一套全面的、可访问的 UI 基础组件，用于对话框、下拉菜单和表单控件。
*   **Tailwind CSS**：一个“实用工具优先”的 CSS 框架，带有自定义配置。
*   **Lucide React**：图标库，用于保持图标风格一致。
*   **Class Variance Authority**：用于管理组件变体的实用工具。

### 开发和构建工具
*   **Vite**：快速构建工具，支持热模块替换和 TypeScript。
*   **ESBuild**：用于生产服务器构建的打包工具。
*   **TypeScript**：在整个应用堆栈中提供类型安全。

### 数据库和 ORM
*   **Drizzle ORM**：类型安全的数据库工具包，已配置好用于 PostgreSQL。
*   **Neon Database**：用于云部署的无服务器 PostgreSQL 提供商。
*   **Connect PG Simple**：Express 会话的 PostgreSQL 会话存储。

### 验证和表单
*   **Zod**：运行时类型验证和模式定义。
*   **React Hook Form**：高性能的表单库，集成验证功能。
*   **Hookform Resolvers**：React Hook Form 和 Zod 之间的集成层。

### 状态管理和数据获取
*   **TanStack Query**：服务器状态管理，支持缓存、后台更新和乐观更新。
*   **Wouter**：用于单页应用导航的轻量级路由库。

### 开发环境
*   **Replit 集成**：自定义 Vite 插件，用于开发横幅和错误覆盖。
*   **TSX**：用于开发服务器的 TypeScript 执行器。
*   **PostCSS**：带有 Tailwind 和 Autoprefixer 的 CSS 处理工具。
