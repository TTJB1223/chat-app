# Yuji (语记) - AI Intelligent Memo Assistant

## 📖 项目简介
Yuji (语记) 是一款基于 React Native 和 AI 大模型技术的智能备忘录应用。它不仅是一个聊天机器人，更是你的第二大脑。通过与 AI 助手（小语）的自然对话，它可以自动识别你的意图，将重要信息整理归类为备忘录，并支持流式对话、历史记录管理和个性化设置。

## 🛠 技术栈 (Tech Stack)

### 前端框架 (Frontend Core)
- **Framework**: [React Native](https://reactnative.dev/) (via [Expo SDK 52](https://expo.dev/))
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (文件路由系统)
- **Styling**: [NativeWind](https://www.nativewind.dev/) (Tailwind CSS for React Native)
- **Icons**: [Lucide React Native](https://lucide.dev/guide/packages/lucide-react-native)

### 数据存储 (Data Persistence)
- **Native (iOS/Android)**: `expo-sqlite` (SQLite 数据库)
- **Web**: In-Memory Fallback (运行时内存存储，刷新即失，用于调试)

### AI & 后端交互 (AI & Backend)
- **LLM Provider**: 阿里云百炼 (Aliyun DashScope) - 通义千问模型 (Qwen)
- **Communication**: Fetch API + Server-Sent Events (SSE) for Streaming
- **Protocol**: HTTP/2 (Streamed JSON/Text)

---

## 🏗 开发思路与架构 (Development Architecture)

### 1. 目录结构设计
项目采用典型的 Expo Router 结构，强调业务逻辑与 UI 分离：

```
/
├── app/                  # 页面路由与视图层
│   ├── (tabs)/           # 底部导航栏页面 (首页列表, 备忘录, 设置)
│   └── chat/[id].tsx     # 聊天详情页 (核心交互页)
├── services/             # 业务逻辑服务层
│   ├── db.ts             # 数据库操作封装 (SQLite/Memory 适配)
│   ├── llm.ts            # 大模型 API 调用与流式处理
│   ├── prompt.ts         # AI 系统提示词 (System Prompt)
│   └── SettingsContext.tsx # 全局状态管理 (React Context)
├── constants/            # 静态配置 (API Key, Colors)
└── assets/               # 静态资源 (字体, 图片)
```

### 2. 前后端交互流程 (Interaction Flow)

整个应用是 **Client-Side** 架构，直接从客户端发起 AI 请求，无需中间层后端（Serverless 思想）。

#### A. 消息发送与流式响应 (Streaming Response)
1. **用户输入**: 用户在 `ChatDetailScreen` 输入消息。
2. **乐观更新**: UI 立即展示用户消息，并插入一个 "..." 的 AI 占位消息。
3. **API 请求**: 调用 `services/llm.ts` 中的 `sendToLLM`。
    - Header: `Accept: text/event-stream`
    - Body: `stream: true`, `incremental_output: true`
4. **流式读取**: 使用 `response.body.getReader()` 读取二进制流。
5. **增量解码**: 
    - `TextDecoder` 解码二进制块。
    - 解析 `data: ` 开头的 SSE 格式数据。
    - 提取差异内容 (Delta content)。
6. **实时渲染**: 通过 `onProgress` 回调，实时更新 React State 中的占位消息内容，实现打字机效果。

#### B. 意图识别与自动存储 (Intent Recognition)
核心逻辑在于 Prompt Engineering (`services/prompt.ts`)。
1. **指令**: System Prompt 要求 AI 在识别到用户想要记录内容时，返回特定的 JSON 格式。
2. **解析**: 前端在接收到完整响应后，使用正则 `scans` 响应内容是否包含 ` ```json ... ``` ` 代码块。
3. **执行动作**:
    - 如果解析出 `action: "save_memo"`，则调用 `db.ts` 的 `addMemo` 方法。
    - 自动将内容归类（如：Have Fun, Learning, ToDoList 等）。
4. **静默处理**: 最终展示给用户的消息会移除 JSON 块，只保留 AI 的自然语言回复，保证用户体验流畅。

---

## 💾 数据存储方案 (Data Storage Schema)

使用 SQLite 关系型数据库，包含三张核心表：

### 1. Sessions (会话表)
存储对话列表的元数据。
| Field | Type | Description |
|-------|------|-------------|
| id | TEXT (PK) | 会话唯一标识 (Timestamp String) |
| title | TEXT | 会话标题 (AI 自动生成) |
| createdAt | TEXT | 创建时间 |

### 2. Messages (消息表)
存储具体的聊天记录。
| Field | Type | Description |
|-------|------|-------------|
| id | TEXT (PK) | 消息 ID |
| sessionId | TEXT (FK) | 关联的会话 ID |
| role | TEXT | 角色 ('user' \| 'assistant' \| 'system') |
| content | TEXT | 消息内容 |
| timestamp | TEXT | 发送时间 |

### 3. Memos (备忘录表)
存储 AI 自动提取的结构化备忘信息。
| Field | Type | Description |
|-------|------|-------------|
| id | INTEGER (PK) | 自增 ID |
| content | TEXT | 备忘录内容 |
| category | TEXT | 分类 (Have Fun, Earning, Learning, ToDoList, Insights) |
| timestamp | TEXT | 记录时间 |

---

## 📱 关键功能实现细节

### 1. 键盘避让与沉浸式体验
- 使用 `KeyboardAvoidingView` 配合 `behavior="padding"`。
- 引入 `useSafeAreaInsets` 动态计算底部 Padding。
- 监听 `Keyboard` 事件 (`keyboardWillShow`/`Hide`)，在键盘弹出时移除底部安全区 Padding，使输入框紧贴键盘；键盘收起时恢复 Safe Area，确保 UI 不被 Home Indicator 遮挡。

### 2. 左滑删除 (Swipe to Delete)
- 引入 `react-native-swipe-list-view` 替换普通的 FlatList。
- 实现了 `renderHiddenItem` 渲染底层的删除按钮。
- 删除操作包含：
    1. **乐观 UI 更新**: 先从列表中移除 Item，让用户感觉零延迟。
    2. **数据库清理**: 异步删除 SQLite 中的 `sessions` 和关联的 `messages`。

### 3. AI 标题生成
- 当开启新对话发送第一条消息时，会在后台静默发起第二次 LLM 请求。
- 请求 AI 根据用户的第一句话总结一个 5-8 字的简短标题。
- 异步更新 `Sessions` 表的 `title` 字段。

---

## 🚀 快速开始 (Getting Started)

1. **安装依赖**:
   ```bash
   npm install
   ```

2. **配置环境**:
   在 `constants/Config.ts` 中配置你的阿里云 API Key。

3. **运行开发服务器**:
   ```bash
   npm run start
   ```
   - 按 `i` 进入 iOS 模拟器
   - 按 `a` 进入 Android 模拟器
   - 按 `w` 进入 Web 预览 (不支持 SQLite持久化)

---

## 🔮 Roadmap: Agent Evolution (智能体演进路线)

Yuji 的目标不仅仅是记录，而是成为一个能够 **感知环境、主动决策、介入现实** 的 Agent。目前的 Roadmap 聚焦于实现 **"智能提醒与紧急干预"** (Intelligent Reminder & Urgent Alert) 系统。

此功能将赋予 Agent 主动呼叫用户的能力，实现闭环交互。

### 📅 Phase 1: 基础设施搭建 (Infrastructure)
- [ ] **集成 Expo Notifications**: 引入 `expo-notifications` 和 `expo-device`。
- [ ] **权限管理 (Permission Handler)**: 
    - 实现 `services/notification.ts`，在 App 启动时请求用户授权通知权限。
    - 处理 Android 13+ 的动态通知权限请求。
- [ ] **通知通道配置 (Channel Config)**:
    - **Default Channel**: 普通备忘提醒，使用系统默认声。
    - **Urgent Channel**: 紧急事务提醒，使用高优先级 (`Importance.MAX`) 和自定义警报音。

### 🧠 Phase 2: AI 大脑升级 (Brain Upgrade)
- [ ] **Prompt Engineering**: 
    - 修改 `services/prompt.ts`，动态注入当前系统时间 (`new Date()`) 到 System Prompt。
    - 教会 AI 理解相对时间（"10分钟后"、"下周三"）并将其转换为绝对时间 (ISO 8601)。
- [ ] **JSON Schema 扩展**:
    - 增加 `set_reminder` 动作定义：
      ```json
      {
        "action": "set_reminder",
        "content": "给老板回电话",
        "iso_time": "2023-10-27T15:30:00.000Z", // 绝对时间
        "is_urgent": true // 是否紧急
      }
      ```
- [ ] **前端解析器**: 升级 `sendMessage` 解析逻辑，识别并执行 `set_reminder` 指令。

### ⏰ Phase 3: 调度与存储 (Scheduling & Persistence)
- [ ] **本地调度器**: 编写 `scheduleReminder(content, time, isUrgent)` 函数。
    - 调用 `Notifications.scheduleNotificationAsync`。
    - 根据 `is_urgent` 标记选择不同的 Notification Channel。
- [ ] **数据库扩展**: 
    - 新增 `reminders` 表，存储已设置的提醒任务（ID, Content, Time, Status）。
    - 支持用户在 UI 上查看、取消和修改待触发的提醒。

### 🚨 Phase 4: 紧急响铃与交互 (Urgency & Interaction)
- [ ] **自定义铃声**:
    - 添加 `assets/sounds/alarm.wav`。
    - 在 `app.json` 中注册音频资源。
- [ ] **交互式通知**:
    - 为通知添加 Action Buttons（例如："收到/完成"、"推迟10分钟"）。
    - AI 根据用户的反馈自动调整后续提醒策略。

---

> **核心思想**: 从 "Tool" (工具) 转向 "Agent" (智能体)。工具是被动的，必须由人来驱动；而 Agent 是主动的，它拥有记忆（时间感知）和行动力（通知推送），能够在合适的时间主动介入用户的生活流。
