---
name: generate-weekly
description: 根据 Markdown 新闻文档生成 HTML 周报，扫描更新配置，并同步更新 README 文档
---

# AI 周报生成工作流

本技能用于完成 AI 周报的完整发布流程：从 Markdown 源文档生成 HTML 周报页面，扫描并更新配置文件，最后更新 README 统计信息。

## 📋 前置条件

1. **Markdown 源文件**：位于 `doc/news/` 目录下
   - 命名格式：`YYYYMMDD-YYYYMMDD.md`（例如：`20260105-20260111.md`）

2. **现有资源**：
   - `weeklies/weekly.css`：周报样式文件
   - `card_template.html`：卡片模板参考
   - `update-config.js`：配置更新脚本

---

## 🚀 工作流程

### 步骤 1：解析 Markdown 源文件

读取 `doc/news/YYYYMMDD-YYYYMMDD.md` 文件，提取以下信息：

1. **日期范围**：从文件名和标题中提取开始日期和结束日期
2. **新闻条目**：每个新闻包含：
   - 标题
   - 标签（tags）
   - 新闻简介
   - 价值分析（提效/赚钱）
   - 辩证思考（可选）
3. **总结部分**：文章末尾的趋势分析

### 步骤 2：生成 HTML 文件

根据以下模板结构生成 `weeklies/YYYYMMDD-YYYYMMDD周新闻.html` 文件：

```html
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI热点周报 (YYYY年M月D日-M月D日)</title>
    <link rel="stylesheet" href="weekly.css">
</head>

<body>
    <div class="container">
        <h1>AI 圈热点周报</h1>
        <p class="date-range">周期：YYYY年M月D日 - M月D日</p>

        <!-- 每条新闻使用 news-card 结构 -->
        <div class="news-card">
            <h2>
                <span class="news-index">1</span>新闻标题
            </h2>
            <div class="summary">
                <span class="tag">标签1</span>
                <span class="tag">标签2</span>
                新闻简介内容...
            </div>
            <div class="analysis">
                <h3>对普通人的价值分析</h3>
                <p><strong>提效：</strong> 提效内容...<br><strong>赚钱：</strong> 赚钱内容...</p>
                <p class="warning"><strong>⚠️ 辩证思考：</strong> 辩证内容...</p>
            </div>
        </div>

        <!-- 更多新闻卡片... -->

        <!-- 总结卡片 -->
        <div class="news-card summary-card">
            <h2>
                <span class="news-index">📊</span>总结与逻辑链条
            </h2>
            <div class="summary">
                <span class="tag">趋势分析</span>
                <span class="tag">证据模式</span>
            </div>
            <div class="analysis">
                <p>总结内容...</p>
            </div>
        </div>

    </div>
</body>

</html>
```

**关键规则**：

1. **文件名格式**：`weeklies/YYYYMMDD-YYYYMMDD周新闻.html`
2. **使用外部样式**：`<link rel="stylesheet" href="weekly.css">`
3. **新闻序号**：使用 `<span class="news-index">N</span>`
4. **标签格式**：`<span class="tag">标签文本</span>`
5. **辩证思考**：使用 `<p class="warning">` 包裹
6. **总结卡片**：添加 `summary-card` 类

### 步骤 3：扫描文件夹并更新配置

// turbo
```bash
node update-config.js scan
```

该命令会：
- 扫描 `weeklies/` 目录下所有符合命名规则的 HTML 文件
- 自动提取新闻统计数据（newsCount, toolCount, techCount）
- 更新 `weekly-config.json` 配置文件
- 自动分配期数（第N期）

### 步骤 4：更新 README.md

更新 `README.md` 文件中的「📊 当前状态」部分：

1. **更新已发布周报列表**：
   - 最新的周报使用 🆕 标记
   - 其他按时间倒序排列
   - 包含期数、日期范围、统计数据

2. **更新统计总计**：
   - 总期数
   - 总新闻数
   - 总工具数
   - 总技术突破数
   - 时间跨度

**README 更新格式示例**：

```markdown
## 📊 当前状态

### 已发布周报
- 🆕 **第24期** (2026-01-12 至 01-18) - 最新发布，N条新闻，N个AI工具，N项技术突破
- ✨ **第23期** (2026-01-05 至 01-11) - N条新闻，N个AI工具，N项技术突破
...

**总计**: N期周报，N条AI新闻，N个AI工具，N项技术突破，覆盖N个月时间(YYYY年MM月-YYYY年MM月)
```

---

## 📝 Markdown 源文件格式规范

源文件应遵循以下格式：

```markdown
## 📊 YYYY年M月第N周 AI 热点周报（M.DD - M.DD）

### 1. 分类标题（如：模型动态、应用动态等）

#### **【新闻标题】**

* **新闻简介**：新闻内容描述...
* **价值分析**：
  * **提效（场景描述）**：
    * *场景例子*：具体场景...
  * **赚钱（变现描述）**：
    * *变现路径*：具体路径...
* **辩证思考**：
> **提醒**：辩证观点...

---

### 📊 总结与逻辑链条（证据模式）

* **趋势1**：描述...（来源：*来源*）
* **趋势2**：描述...（来源：*来源*）
```

---

## 🔧 完整执行示例

假设需要发布 `doc/news/20260112-20260118.md`：

1. **读取源文件**
   ```
   查看 doc/news/20260112-20260118.md 内容
   ```

2. **生成 HTML**
   ```
   创建 weeklies/20260112-20260118周新闻.html
   - 使用外部 weekly.css 样式
   - 转换 Markdown 内容为 HTML 卡片结构
   - 添加适当的标签和格式化
   ```

3. **扫描更新配置**
   ```bash
   node update-config.js scan
   ```

4. **更新 README**
   ```
   更新 README.md 中的「📊 当前状态」部分
   - 添加新周报条目
   - 更新统计总计
   ```

---

## ✅ 检查清单

完成工作流后确认以下事项：

- [ ] HTML 文件已生成到 `weeklies/` 目录
- [ ] 文件名格式正确：`YYYYMMDD-YYYYMMDD周新闻.html`
- [ ] 使用 `<link rel="stylesheet" href="weekly.css">`
- [ ] 所有新闻卡片格式正确
- [ ] `node update-config.js scan` 已执行
- [ ] `weekly-config.json` 已更新
- [ ] `README.md` 已发布周报列表已更新
- [ ] `README.md` 统计总计已更新

---

## 🎯 注意事项

1. **样式引用**：新版周报使用外部 CSS 文件（`weekly.css`），而非内联样式
2. **日期格式**：标题使用中文日期格式（如：2026年1月5日）
3. **标签提取**：从新闻内容中提取 2-3 个关键词作为标签
4. **辩证思考**：并非所有新闻都有辩证思考，按源文件决定是否添加
5. **总结卡片**：总结部分使用 `📊` 作为索引，而非数字
