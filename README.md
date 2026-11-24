# 衡水老白干 · 本周新菜卡片与 Flash 动效技能

> 一键生成「本周新菜」三件套：**A6 竖版打印卡 PNG** + **A4 四拼打印 PDF** + **餐厅大屏 16:9 Flash 小动画 MP4**。
> 适用于 WorkBuddy / Gemini CLI 等支持 `SKILL.md` 的 AI 助手：把菜品实拍图发给助手，即可自动重绘卡通图并出片。

---

## 一、效果预览

给助手一张菜品实拍图 + 菜名 + 主料 + 辅料，产出：

| 产物 | 规格 | 用途 |
| :--- | :--- | :--- |
| `A6卡片.png` | 105×148mm @ 300DPI（1240×1748px） | 打印台卡、亚克力卡 |
| `A4四拼打印.pdf` | A4 单页拼 4 张 A6，带裁切线 | 直接打印裁切 |
| `餐厅屏Flash.mp4` | 1920×1080 / 30fps / 6.5s 无缝循环，H.264 | 餐厅电视、大屏轮播 |

内置三款卡通吉祥物主题，按菜品自动/指定匹配：

- **小陈皮 · 暖阳杏黄** —— 家常暖菜、金黄酥炸、煲汤、温润甜口
- **小20 · 晴空晨光** —— 清爽凉菜、海鲜虾蟹、翠绿时蔬
- **小30 · 暖金新中式** —— 招牌硬菜、红烧酱卤、传统经典热菜

---

## 二、依赖（安装前先装好）

| 依赖 | 版本 | 安装方式 |
| :--- | :--- | :--- |
| **Node.js** | 22+ | <https://nodejs.org> |
| **Google Chrome** | 任意新版 | <https://www.google.com/chrome/> |
| **FFmpeg** | 任意新版 | macOS: `brew install ffmpeg`；Windows: <https://ffmpeg.org/download.html>；Linux: `sudo apt install ffmpeg` |

> 脚本零第三方 npm 依赖，只调用上面三个本机程序。若 Chrome 不在默认安装位置，设置环境变量 `CHROME_PATH` 指向浏览器可执行文件即可。

---

## 三、一键安装（其他电脑照做）

### 方式 A：自动安装脚本（推荐）

macOS / Linux 打开终端执行：

```bash
curl -fsSL https://raw.githubusercontent.com/didi4007/laobaigan-dish-card/main/install.sh | bash
```

脚本会把技能安装到 `~/.workbuddy/skills/laobaigan-dish-card/`，已存在则自动更新。

Windows（PowerShell）:

```powershell
git clone https://github.com/didi4007/laobaigan-dish-card.git "$env:USERPROFILE\.workbuddy\skills\laobaigan-dish-card"
```

### 方式 B：手动下载

1. 点仓库右上角绿色 **Code → Download ZIP**，解压。
2. 把整个 `laobaigan-dish-card` 文件夹放到：
   - WorkBuddy 用户技能目录：`~/.workbuddy/skills/laobaigan-dish-card/`
   - 或 Gemini 技能目录：`~/.gemini/config/skills/laobaigan-dish-card/`
3. 重开一次 AI 助手会话，技能即被识别。

---

## 四、怎么用

安装好后，在对话里直接对助手说：

> 这是新菜图 [附上实拍图]，菜名「荷香绿虾」，主料鲜虾仁，辅料鲜乳酪，做出本周新菜卡片和视频。

助手会按 `SKILL.md` 的四步流程：补全信息 → 重绘卡通美食图 → 匹配吉祥物主题并调用脚本 → 目检交付。

**必填四项**（缺一项助手会先问你）：菜品实拍图、菜名、主料、辅料。
默认落款「接待餐厅」、徽章「本周新菜」，可指定替换。

### 命令行直接调用（进阶）

```bash
SKILL_DIR="$HOME/.workbuddy/skills/laobaigan-dish-card"
node "$SKILL_DIR/scripts/render_dish_kit.mjs" \
  --dish "荷香绿虾" \
  --main "鲜虾仁" \
  --sub "鲜乳酪" \
  --image "/绝对路径/卡通美食图.jpg" \
  --mascot "xiao20" \
  --restaurant "接待餐厅" \
  --output-dir "./成品" \
  --a4 \
  --save-preview-frames
```

参数说明：

| 参数 | 说明 |
| :--- | :--- |
| `--dish` / `--main` / `--sub` / `--image` | **必填**，菜名 / 主料 / 辅料 / 卡通图绝对路径 |
| `--mascot` | `xiaochenpi` / `xiao20` / `xiao30`，默认 `xiao20` |
| `--restaurant` / `--badge` | 落款 / 徽章文案，默认「接待餐厅」/「本周新菜」 |
| `--output-dir` | 输出目录，默认当前目录 |
| `--a4` | 同时生成 A4 四拼打印 PDF |
| `--no-flash` | 只要静态卡，不生成 MP4 |
| `--save-preview-frames` | 保存 Flash 关键帧便于目检 |
| `--a4-from` / `--a4-out` | 把 2–4 张已有 A6 卡拼成一张 A4（见 SKILL.md） |

---

## 五、目录结构

```
laobaigan-dish-card/
├── SKILL.md                       # 技能说明与四步工作流（AI 读取）
├── README.md                      # 本文件
├── install.sh                     # 一键安装/更新脚本
├── scripts/
│   └── render_dish_kit.mjs        # 一键渲染引擎（零 npm 依赖）
└── assets/
    ├── brand/                     # 品牌 logo（彩色/白色）、红/白印章
    └── mascots/                   # 三款吉祥物各 9 个 pose（pose0–pose8）
```

## 六、许可

内部使用。品牌素材版权归衡水老白干所有。
