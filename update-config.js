#!/usr/bin/env node
/**
 * 自动更新周报配置脚本
 * 使用方法：
 * 1. 添加新周报：node update-config.js add "2025-10-01" "2025-10-07" "第8期" "本周AI圈..." 15 8 4
 * 2. 扫描文件夹：node update-config.js scan
 * 3. 标记发布：node update-config.js publish "20251001-20251007周新闻.html"
 */

const fs = require('fs');
const path = require('path');

const CONFIG_FILE = 'weekly-config.json';
const README_FILE = 'README.md';

// 读取配置文件
function readConfig() {
    try {
        const data = fs.readFileSync(CONFIG_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('❌ 读取配置文件失败:', error.message);
        return { weeklies: [], settings: {} };
    }
}

// 写入配置文件
function writeConfig(config) {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
        console.log('✅ 配置文件已更新');
        return true;
    } catch (error) {
        console.error('❌ 写入配置文件失败:', error.message);
        return false;
    }
}

function formatShortDate(dateString) {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}-${day}`;
}

function formatMonth(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

function getIssueNumber(weekly, fallbackIndex) {
    const titleIssueNumber = extractIssueNumber(weekly.title || '');
    return titleIssueNumber || fallbackIndex + 1;
}

function updateReadmeStatus(config) {
    if (!fs.existsSync(README_FILE)) {
        console.log(`⚠️  未找到 ${README_FILE}，跳过 README 更新`);
        return false;
    }

    const readme = fs.readFileSync(README_FILE, 'utf8');
    const publishedWeeklies = config.weeklies
        .filter(weekly => weekly.published)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (publishedWeeklies.length === 0) {
        console.log('⚠️  没有已发布周报，跳过 README 状态更新');
        return false;
    }

    const totalNews = publishedWeeklies.reduce((sum, weekly) => sum + (Number(weekly.newsCount) || 0), 0);
    const totalTools = publishedWeeklies.reduce((sum, weekly) => sum + (Number(weekly.toolCount) || 0), 0);
    const totalTech = publishedWeeklies.reduce((sum, weekly) => sum + (Number(weekly.techCount) || 0), 0);
    const firstWeekly = publishedWeeklies[0];
    const latestFirst = publishedWeeklies.slice().reverse();

    const lines = [
        '## 📊 当前状态',
        '',
        '### 已发布周报'
    ];

    latestFirst.forEach((weekly, reverseIndex) => {
        const originalIndex = publishedWeeklies.length - reverseIndex - 1;
        const issueNumber = getIssueNumber(weekly, originalIndex);
        const startDate = weekly.date;
        const endDate = formatShortDate(weekly.endDate);
        const stats = `${weekly.newsCount || 0}条新闻，${weekly.toolCount || 0}个AI工具，${weekly.techCount || 0}项技术突破`;

        if (reverseIndex === 0) {
            lines.push(`- 🆕 **第${issueNumber}期** (${startDate} 至 ${endDate}) - 最新发布，${stats}`);
        } else {
            lines.push(`- ✨ **第${issueNumber}期** (${startDate} 至 ${endDate})，${stats}`);
        }
    });

    lines.push('');
    lines.push(`**总计**: ${publishedWeeklies.length}期周报，${totalNews}条AI新闻，${totalTools}个AI工具，${totalTech}项技术突破，覆盖${calculateMonthSpan(firstWeekly.date, latestFirst[0].endDate)}个月时间(${formatMonth(firstWeekly.date)}-${formatMonth(latestFirst[0].endDate)})`);
    lines.push('');

    const nextSectionMatch = readme.match(/\n## 🚨 注意事项/);
    if (!nextSectionMatch) {
        console.log('⚠️  README 中未找到「## 🚨 注意事项」锚点，跳过 README 更新');
        return false;
    }

    const updatedReadme = readme.replace(
        /## 📊 当前状态[\s\S]*?(?=\n## 🚨 注意事项)/,
        lines.join('\n')
    );

    if (updatedReadme === readme) {
        console.log('✅ README 当前状态无需更新');
        return true;
    }

    fs.writeFileSync(README_FILE, updatedReadme, 'utf8');
    console.log('✅ README 当前状态已更新');
    return true;
}

function calculateMonthSpan(startDateString, endDateString) {
    const start = new Date(startDateString);
    const end = new Date(endDateString);
    return (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth() + 1;
}

// 生成文件名
function generateFilename(startDate, endDate) {
    const start = startDate.replace(/-/g, '');
    const end = endDate.replace(/-/g, '');
    return `weeklies/${start}-${end}周新闻.html`;
}

// 提取期数
function extractIssueNumber(title) {
    const match = title.match(/第(\d+)期/);
    return match ? parseInt(match[1]) : 0;
}

// 添加新周报
function addWeekly(startDate, endDate, title, summary, newsCount = 0, toolCount = 0, techCount = 0) {
    const config = readConfig();
    const filename = generateFilename(startDate, endDate);

    // 检查是否已存在
    const exists = config.weeklies.find(w => w.filename === filename);
    if (exists) {
        console.log('⚠️  周报已存在，将更新现有记录');
        exists.title = title.includes('第') ? title : `AI圈热点周报 ${title}`;
        exists.summary = summary;
        exists.newsCount = parseInt(newsCount);
        exists.toolCount = parseInt(toolCount);
        exists.techCount = parseInt(techCount);
        exists.published = fs.existsSync(filename);
    } else {
        const newWeekly = {
            date: startDate,
            endDate: endDate,
            filename: filename,
            title: title.includes('第') ? title : `AI圈热点周报 ${title}`,
            summary: summary,
            newsCount: parseInt(newsCount),
            toolCount: parseInt(toolCount),
            techCount: parseInt(techCount),
            published: fs.existsSync(filename)
        };
        config.weeklies.push(newWeekly);
    }

    // 按日期排序（最早的在前）
    config.weeklies.sort((a, b) => new Date(a.date) - new Date(b.date));

    if (writeConfig(config)) {
        updateReadmeStatus(config);
        console.log(`✅ 已添加/更新周报: ${filename}`);
        console.log(`📊 统计: ${newsCount}条新闻, ${toolCount}个工具, ${techCount}个新发布`);
    }
}

// 分析HTML文件内容获取统计数据
function analyzeHtmlContent(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');

        // 统计新闻条目数量 (支持多种格式)
        const newsItems = (content.match(/class="news-item"/g) || []).length;
        const newsCards = (content.match(/class="news-card"/g) || []).length;
        const newsCount = Math.max(newsItems, newsCards);

        // 统计工具相关内容
        const toolKeywords = /工具|tool|AI.*生成器|生成.*工具|创作.*工具|AI.*助手/gi;
        const toolMatches = (content.match(toolKeywords) || []).length;
        const toolCount = Math.min(Math.ceil(toolMatches / 3), 10); // 避免重复计数，设置上限

        // 统计新发布相关内容
        const releaseKeywords = /发布|推出|上线|更新|升级|推送|推广|release|launch|update/gi;
        const releaseMatches = (content.match(releaseKeywords) || []).length;
        const releaseCount = Math.min(Math.ceil(releaseMatches / 3), 10); // 避免重复计数，设置上限

        return {
            newsCount: newsCount,
            toolCount: toolCount,
            techCount: releaseCount
        };
    } catch (error) {
        console.log(`⚠️  无法分析文件 ${filePath}: ${error.message}`);
        return { newsCount: 0, toolCount: 0, techCount: 0 };
    }
}

// 扫描文件夹自动检测新文件
function scanFolder() {
    console.log('🔍 扫描文件夹中...');
    const config = readConfig();

    // 扫描 weeklies 文件夹
    const weeklyDir = './weeklies';
    if (!fs.existsSync(weeklyDir)) {
        fs.mkdirSync(weeklyDir);
        console.log('📁 创建了 weeklies 文件夹');
    }

    const files = fs.readdirSync(weeklyDir);
    const weeklyFiles = files.filter(file => /^\d{8}-\d{8}周新闻\.html$/.test(file));

    let newFiles = 0;
    let updatedFiles = 0;

    weeklyFiles.forEach(filename => {
        const existing = config.weeklies.find(w => w.filename === `weeklies/${filename}`);

        // 从文件名提取日期
        const match = filename.match(/^(\d{4})(\d{2})(\d{2})-(\d{4})(\d{2})(\d{2})周新闻\.html$/);
        if (!match) return;

        const startDate = `${match[1]}-${match[2]}-${match[3]}`;
        const endDate = `${match[4]}-${match[5]}-${match[6]}`;

        // 分析文件内容获取统计数据
        const filePath = path.join(weeklyDir, filename);
        const stats = analyzeHtmlContent(filePath);

        // 检查是否存在黑板图片
        const dateStr = `${match[1]}${match[2]}${match[3]}-${match[4]}${match[5]}${match[6]}`;
        const imageBaseName = `ai_weekly_blackboard_${dateStr}`;
        const imageDir = path.join(weeklyDir, 'images');
        let blackboardImage = null;

        if (fs.existsSync(path.join(imageDir, `${imageBaseName}.png`))) {
            blackboardImage = `weeklies/images/${imageBaseName}.png`;
        } else if (fs.existsSync(path.join(imageDir, `${imageBaseName}.jpg`))) {
            blackboardImage = `weeklies/images/${imageBaseName}.jpg`;
        }

        if (!existing) {
            // 新文件，先添加到数组
            const newWeekly = {
                date: startDate,
                endDate: endDate,
                filename: `weeklies/${filename}`,  // 包含文件夹路径
                title: `AI圈热点周报`,  // 临时标题，后面会重新分配期数
                summary: `${startDate.substring(0, 7).replace('-', '年')}月的AI圈精彩内容，包含最新的技术突破和工具发布。`,
                newsCount: stats.newsCount,
                toolCount: stats.toolCount,
                techCount: stats.techCount,
                published: true,
                blackboardImage: blackboardImage
            };
            config.weeklies.push(newWeekly);
            newFiles++;
            console.log(`📄 发现新文件: weeklies/${filename} (${stats.newsCount}条新闻, ${stats.toolCount}个工具, ${stats.techCount}个新发布)`);
            if (blackboardImage) {
                console.log(`🖼️  发现黑板图片: ${blackboardImage}`);
            }
        } else {
            // 更新现有文件的统计数据
            const oldStats = `${existing.newsCount}/${existing.toolCount}/${existing.techCount}`;
            const newStats = `${stats.newsCount}/${stats.toolCount}/${stats.techCount}`;

            existing.newsCount = stats.newsCount;
            existing.toolCount = stats.toolCount;
            existing.techCount = stats.techCount;

            // 更新图片路径
            if (blackboardImage && existing.blackboardImage !== blackboardImage) {
                existing.blackboardImage = blackboardImage;
                updatedFiles++;
                console.log(`🖼️  更新黑板图片: ${existing.filename} -> ${blackboardImage}`);
            }

            if (!existing.published) {
                existing.published = true;
                updatedFiles++;
                console.log(`📤 标记已发布: ${existing.filename}`);
            }

            if (oldStats !== newStats) {
                console.log(`🔄 更新统计: ${existing.filename} (${oldStats} → ${newStats})`);
                updatedFiles++;
            }
        }
    });

    // 按日期排序（最早的在前）
    config.weeklies.sort((a, b) => new Date(a.date) - new Date(b.date));

    // 重新分配期数
    config.weeklies.forEach((weekly, index) => {
        const issueNumber = index + 1;
        weekly.title = `AI圈热点周报 第${issueNumber}期`;
    });

    if (newFiles > 0 || updatedFiles > 0) {
        if (writeConfig(config)) {
            updateReadmeStatus(config);
            console.log(`✅ 扫描完成: 新增 ${newFiles} 个文件, 更新 ${updatedFiles} 个状态`);
            console.log(`📊 重新分配了 ${config.weeklies.length} 个周报的期数`);
        }
    } else {
        updateReadmeStatus(config);
        console.log('✅ 扫描完成: 没有发现新文件');
    }
}

// 标记文件为已发布
function markPublished(filename) {
    const config = readConfig();
    const weekly = config.weeklies.find(w => w.filename === filename);

    if (!weekly) {
        console.log('❌ 未找到指定的周报文件');
        return;
    }

    weekly.published = true;

    if (writeConfig(config)) {
        updateReadmeStatus(config);
        console.log(`✅ 已标记为发布: ${filename}`);
    }
}

// 显示帮助信息
function showHelp() {
    console.log(`
📋 周报配置更新工具

使用方法:
  node update-config.js add <开始日期> <结束日期> <标题> <简介> [新闻数] [工具数] [新发布数]
  node update-config.js scan
  node update-config.js publish <文件名>
  node update-config.js help

示例:
  # 添加新周报
  node update-config.js add "2025-10-01" "2025-10-07" "第8期" "十月第一周AI圈精彩内容" 15 8 4

  # 扫描文件夹自动检测
  node update-config.js scan

  # 标记文件为已发布
  node update-config.js publish "20251001-20251007周新闻.html"

参数说明:
  开始日期: YYYY-MM-DD 格式
  结束日期: YYYY-MM-DD 格式
  标题: 周报标题（可包含"第X期"或仅期数）
  简介: 周报简要描述
  新闻数: 可选，默认为0
  工具数: 可选，默认为0
  新发布数: 可选，默认为0
`);
}

// 主函数
function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        showHelp();
        return;
    }

    const command = args[0];

    switch (command) {
        case 'add':
            if (args.length < 5) {
                console.log('❌ 参数不足，请提供开始日期、结束日期、标题和简介');
                console.log('使用: node update-config.js add <开始日期> <结束日期> <标题> <简介> [新闻数] [工具数] [新发布数]');
                return;
            }
            addWeekly(
                args[1], // startDate
                args[2], // endDate
                args[3], // title
                args[4], // summary
                args[5] || 0, // newsCount
                args[6] || 0, // toolCount
                args[7] || 0  // techCount
            );
            break;

        case 'scan':
            scanFolder();
            break;

        case 'publish':
            if (args.length < 2) {
                console.log('❌ 请提供文件名');
                console.log('使用: node update-config.js publish <文件名>');
                return;
            }
            markPublished(args[1]);
            break;

        case 'help':
        default:
            showHelp();
            break;
    }
}

// 运行主函数
if (require.main === module) {
    main();
}

module.exports = { addWeekly, scanFolder, markPublished, readConfig, writeConfig, updateReadmeStatus };
