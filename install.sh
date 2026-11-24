#!/usr/bin/env bash
# 衡水老白干「本周新菜」技能 一键安装 / 更新脚本
# 用法： curl -fsSL https://raw.githubusercontent.com/didi4007/laobaigan-dish-card/main/install.sh | bash
set -euo pipefail

REPO="https://github.com/didi4007/laobaigan-dish-card.git"
SKILL_NAME="laobaigan-dish-card"
REPO_DIR="laobaigan-dish-card"

# 目标目录：默认 WorkBuddy 用户技能目录，可用第一个参数指定为 gemini
TARGET="${1:-workbuddy}"
case "$TARGET" in
  workbuddy) BASE="$HOME/.workbuddy/skills" ;;
  gemini)    BASE="$HOME/.gemini/config/skills" ;;
  *) echo "未知目标: $TARGET（可用 workbuddy 或 gemini）" >&2; exit 1 ;;
esac
DEST="$BASE/$SKILL_NAME"

echo "==> 目标目录: $DEST"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "==> 下载技能包..."
if command -v git >/dev/null 2>&1; then
  git clone --depth 1 "$REPO" "$TMP/$REPO_DIR"
else
  # 无 git 时退化为下载 ZIP
  echo "未检测到 git，改用 ZIP 下载"
  curl -fsSL "https://github.com/didi4007/laobaigan-dish-card/archive/refs/heads/main.zip" -o "$TMP/main.zip"
  unzip -q "$TMP/main.zip" -d "$TMP"
  mv "$TMP/$REPO_DIR-main" "$TMP/$REPO_DIR"
fi

mkdir -p "$BASE"

if [ -d "$DEST" ]; then
  echo "==> 检测到已安装，执行更新（保留目录，覆盖内容）..."
  # 用 rsync 若可用，否则逐个覆盖
  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete "$TMP/$REPO_DIR/" "$DEST/"
  else
    (cd "$TMP/$REPO_DIR" && tar cf - .) | (cd "$DEST" && tar xf -)
  fi
else
  mv "$TMP/$REPO_DIR" "$DEST"
fi

echo "==> 安装完成: $DEST"
echo "==> 请重开一次 AI 助手会话以加载技能。"
