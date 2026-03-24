<p align="center">
  <img src="./assets/images/icon.png" width="120" height="120" alt="Yuji Logo" />
</p>

## 🌟 项目简介 (Project Introduction)

**TalkTrace** 是一款专为毕业设计打造的、基于 **React Native** 与 **AI 大语言模型** 技术的智能对话式备忘录应用。

与传统的表单驱动型备忘录不同，引入了 **"AI Agent"** 的设计理念：
- **自然交互**：用户通过最自然的语言（文字或语音）与助理“小语”交流。
- **智能意图识别**：后端 LLM 自动识别用户谈话中的任务、计划和灵感。
- **自动化管理**：系统自动完成信息的结构化提取、分类归档并持久化存入设备本地。
- **隐私优先**：所有数据均保存在本地 SQLite 数据库中，不经过云端服务器，保障用户记录的极致私密性。

本项目不仅是一个工具，更是探索 **“自然语言即交互” (LUI) ** 在移动端落地的典型实践，非常适合作为计算机及软件相关专业的毕业设计参考。

---

## 🛠 技术栈 (Technical Stack)

| 维度 | 技术选型 | 说明 |
| :--- | :--- | :--- |
| **基础框架** | [React Native](https://reactnative.dev/) + [Expo SDK 54](https://expo.dev/) | 跨端开发方案，一套代码同时支持 iOS 和 Android。 |
| **开发语言** | [TypeScript](https://www.typescriptlang.org/) | 增强代码健壮性与可维护性。 |
| **路由管理** | [Expo Router (v6)](https://docs.expo.dev/router/introduction/) | 基于文件系统的动态路由。 |
| **UI 框架** | [NativeWind](https://www.nativewind.dev/) (Tailwind CSS) | 响应式样式，快速构建美观的移动端界面。 |
| **数据持久化** | `expo-sqlite` (SQLite) | 本地关系型数据库，实现离线存储与快速查询。 |
| **AI 核心** | 火山引擎 (Doubao) / 阿里云百炼 (Qwen) | 提供强大的语义分析与意图识别能力。 |
| **流式传输** | Fetch API + Server-Sent Events (SSE) | 实现 AI 打字机流式响应效果。 |
| **语音技术** | 百度智能云 ASR (Speech-to-Text) | 支持语音输入，解放双手。 |
| **图标/设计** | Lucide React Native | 现代、简约的图标库。 |

---

## 📸 项目演示 (Project Demo)

> [!TIP]
> 这里的演示图展示了应用的核心交互流程与功能模块。请确保在项目根目录下创建 `docs/screenshots/` 文件夹，并将你的照片分别重命名为 `home.png`, `chat.png`, `memos.png`, `settings.png` 放入其中。

<table align="center">
  <tr>
    <td align="center"><b>1. 欢迎页与会话列表</b></td>
    <td align="center"><b>2. AI 智能对话界面</b></td>
  </tr>
  <tr>
    <td><img src="./assets/images/a1.jpg" width="300" alt="首页列表" /></td>
    <td><img src="./assets/images/a4.jpg" width="300" alt="聊天界面" /></td>
  </tr>
  <tr>
    <td align="center"><b>3. 自动提取备忘录</b></td>
    <td align="center"><b>4. 个性化设置中心</b></td>
  </tr>
  <tr>
    <td><img src="./assets/images/a2.jpg" width="300" alt="备忘录列表" /></td>
    <td><img src="./assets/images/a5.jpg" width="300" alt="设置页面" /></td>
  </tr>
</table>

*(注：如果图片无法正常显示，请确认图片是否已放入 `./docs/screenshots/` 文件夹并提交到仓库)*

---

## 🏗 核心功能亮点 (Core Features)

1. **零门槛记录**：通过对话即可创建备忘，AI 自动提炼标题、内容与分类。
2. **实时流式反馈**：毫秒级响应，AI 思考过程实时反馈。
3. **多模态输入**：无缝支持文字录入与高精度语音识别。
4. **数据安全**：本地数据库隔离，离线可用，数据永久归属用户。
5. **智能归类**：AI 自动将事项归为“工作”、“学习”、“生活”或“其他”四大板块。

---

## 🚀 快速启动

1. **环境准备**：确认本地已安装 Node.js 与 Expo 开发环境。
2. **安装依赖**：
   ```bash
   cd chat-app
   npm install
   ```
3. **配置环境变量**：在项目根目录创建 `.env` 文件，并参考 `.env.example` (或直接配置 `EXPO_PUBLIC_...` 变量)。
4. **运行项目**：
   ```bash
   npx expo start
   ```

---

## 📜 毕业设计路线 (Roadmap)
- [x] 基于 React Native 的跨平台架构搭建
- [x] AI SSE 流式渲染引擎实现
- [x] 本地 SQLite 数据库多表联动方案
- [ ] AI 时间感知与本地高优提醒推送 (开发中)
- [ ] 导出备忘录为 Markdown/PDF 功能 (规划中)

---

> 🎓 **毕业设计致谢**: 如果这个项目对你的论文或毕设有所启发，欢迎点个 ⭐ 支持一下！
