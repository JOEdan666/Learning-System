# 重构学习闭环：可视化路径与主页仪表盘

针对您提出的**学习路径不清晰**和**主页脱节**问题，我制定了以下重构计划，旨在打造“主页 -> 学习 -> 反馈 -> 主页”的完整闭环。

同时，关于 **Vercel 部署**的问题，请查看计划下方的【Vercel 环境变量配置指南】。

## 1. 核心目标
*   **可视化**：让用户一眼看懂“我在哪，要去哪”。
*   **状态化**：主页不再是静态海报，而是用户的“学习指挥中心”。
*   **闭环**：学习记录实时同步，随时可中断、随时可继续。

## 2. 实施方案

### 2.1 主页改造：从“着陆页”变“仪表盘”
*   **组件升级**：改造 `HeroSection`。
*   **逻辑**：
    *   **未登录/无记录**：保持现有的“快速开始”引导，但增加“学习流程演示”（4步法图解）。
    *   **有学习记录**：将 Hero 区域替换/并列显示 **“当前学习状态卡片”**。
        *   显示：最近一次的科目、主题。
        *   状态：当前阶段（诊断中 / 学习中 / 测验中）。
        *   动作：大按钮“继续学习”，一键回到上次中断的地方。
    *   **数据源**：利用现有的 `ConversationService` 获取最近活跃的 `learning` 类型会话。

### 2.2 Setup 页面升级：展示全貌
*   **新增组件**：`LearningRoadmap`（学习路线图）。
*   **位置**：放在 `learning-setup` 页面顶部。
*   **内容**：横向步骤条，展示完整流程：
    1.  🎯 **目标设定**（当前页面）
    2.  🩺 **AI 诊断**
    3.  📖 **智能导学**
    4.  📝 **效果检测**
    5.  📊 **掌握报告**
*   **作用**：让用户在选择科目时，就知道接下来会发生什么，消除未知感。

### 2.3 学习界面优化：增强感知
*   **导航栏增强**：在 `UnifiedChat`（学习模式）顶部增加**迷你进度条**，高亮当前所处阶段（例如：正在进行“AI 诊断”）。

## 3. 技术实现任务清单

### 任务 1：主页状态卡片 (Home Dashboard)
*   创建 `app/components/Dashboard/CurrentLearningCard.tsx`。
*   修改 `app/page.tsx`，根据是否有历史记录切换视图。

### 任务 2：可视化路线图 (Roadmap UI)
*   创建 `app/components/LearningFlow/LearningRoadmap.tsx`。
*   集成到 `app/learning-setup/page.tsx`（需新建此页面，目前可能只有入口）。

### 任务 3：数据与状态同步
*   确保 `ConversationService` 能准确返回会话的 `currentStep`（当前阶段）。

---

## 🚨 Vercel 环境变量配置指南 (解决部署问题)

您不需要把密钥发给我，请直接在 Vercel 后台操作：

1.  登录 [Vercel Dashboard](https://vercel.com/dashboard)。
2.  点击您的项目 **Learning-System**。
3.  点击顶部导航栏的 **Settings** -> **Environment Variables**。
4.  请逐条添加以下变量（参考您本地 `.env` 文件中的值）：

| Key (键) | Value (值) | 说明 |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://...` | 您的云端数据库连接串 (如 Neon/Supabase) |
| `OPENAI_API_KEY` | `sk-...` | 您的 DeepSeek/OpenAI 密钥 |
| `OPENAI_BASE_URL` | `https://api.deepseek.com/v1` | 接口地址 |
| `OPENAI_MODEL` | `deepseek-chat` | 模型名称 |

**注意**：添加完所有变量后，您需要去 **Deployments** 页面，点击最新的那次失败部署，选择 **Redeploy**（重新部署），新的变量才会生效。
