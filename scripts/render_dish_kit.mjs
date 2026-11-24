#!/usr/bin/env node
/**
 * 衡水老白干 · 接待餐厅「本周新菜」一键渲染引擎
 * 零第三方依赖（仅依赖 Node 22+、本机 Google Chrome、FFmpeg）
 * 支持输出：
 *   1. A6 竖版打印卡 PNG (1240x1748 @ 300 DPI)
 *   2. 餐厅大屏 16:9 Flash 小动画 MP4 (1920x1080, 30fps, H.264)
 *   3. A4 四拼打印 PDF (210x297mm, 含轻裁切线)
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SKILL_ROOT = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(SKILL_ROOT, 'assets');

// 跨平台定位 Chrome：优先环境变量 CHROME_PATH，其次各系统默认安装路径。
function resolveChrome() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',       // macOS
    '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',          // Windows
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/usr/bin/google-chrome',                                              // Linux
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return process.env.CHROME_PATH || candidates[0];
}
const CHROME = resolveChrome();

const THEMES = {
  xiaochenpi: {
    id: 'xiaochenpi',
    label: '小陈皮 · 暖阳杏黄',
    cardPose: 6,
    flashPoses: [0, 6, 5, 3],
    mascotW: 268,
    mascotRight: -16,
    mascotBottom: -52,
    bg: 'linear-gradient(168deg, #FFFDF7 0%, #FFF7E4 55%, #FDEFD1 100%)',
    flashBg: 'linear-gradient(135deg, #FFFDF6 0%, #FFF5DF 52%, #FDEAC4 100%)',
    glow1: 'rgba(255, 212, 118, 0.42)',
    glow2: 'rgba(248, 202, 132, 0.25)',
    cardBg: 'rgba(255, 255, 255, 0.92)',
    outerBorder: '#EED5A9',
    innerBorder: '#F6E6C8',
    cornerColor: '#E29E35',
    badgeBg: 'linear-gradient(135deg, #F5B544 0%, #E39224 100%)',
    badgeShadow: 'rgba(227, 146, 36, 0.28)',
    photoBorder: '#F5E3C2',
    kickerColor: '#C57D1E',
    titleFont: '"PingFang SC", "Hiragino Sans GB", sans-serif',
    titleColor: '#3B2514',
    ruleColor: '#E5A035',
    ingBoxBg: '#FFF9EE',
    ingBoxBorder: '#F3E0BC',
    pill1Bg: '#F7DFB3',
    pill1Color: '#6E4212',
    pill2Bg: '#FCECD1',
    pill2Color: '#875620',
    footerBorder: '#EEDCC0',
    footerColor: '#99754D',
    footerRight: '暖阳相伴 · 美味上新',
    footerRightColor: '#C87C1C',
    particleRgb: '238, 168, 52',
    sparkleRgb: '255, 224, 130',
  },
  xiao20: {
    id: 'xiao20',
    label: '小20 · 晴空晨光',
    cardPose: 4,
    flashPoses: [0, 6, 4, 3],
    mascotW: 264,
    mascotRight: -14,
    mascotBottom: -54,
    bg: 'linear-gradient(168deg, #F8FCFF 0%, #EBF5FD 55%, #DFEFFB 100%)',
    flashBg: 'linear-gradient(135deg, #F8FCFF 0%, #E9F4FD 52%, #D8ECFA 100%)',
    glow1: 'rgba(130, 198, 245, 0.34)',
    glow2: 'rgba(255, 218, 138, 0.28)',
    cardBg: 'rgba(255, 255, 255, 0.93)',
    outerBorder: '#C6E0F4',
    innerBorder: '#DFEEF9',
    cornerColor: '#2E74B0',
    badgeBg: 'linear-gradient(135deg, #3A84C4 0%, #24639C 100%)',
    badgeShadow: 'rgba(36, 99, 156, 0.25)',
    photoBorder: '#D5E7F5',
    kickerColor: '#2B6EA6',
    titleFont: '"PingFang SC", "Hiragino Sans GB", sans-serif',
    titleColor: '#1A3247',
    ruleColor: '#D0353A',
    ingBoxBg: '#F5FAFE',
    ingBoxBorder: '#D8EAF7',
    pill1Bg: '#DCEEFB',
    pill1Color: '#1C5687',
    pill2Bg: '#FDEBD0',
    pill2Color: '#945B12',
    footerBorder: '#DCEAF4',
    footerColor: '#6F8CA3',
    footerRight: '清爽明快 · 鲜味直达',
    footerRightColor: '#C82D32',
    particleRgb: '58, 140, 210',
    sparkleRgb: '255, 210, 108',
  },
  xiao30: {
    id: 'xiao30',
    label: '小30 · 暖金新中式',
    cardPose: 3,
    flashPoses: [0, 6, 4, 3],
    mascotW: 258,
    mascotRight: -10,
    mascotBottom: -48,
    bg: 'linear-gradient(168deg, #FDF9F1 0%, #F9F0E0 55%, #F3E5CE 100%)',
    flashBg: 'linear-gradient(135deg, #FDF9F0 0%, #F8EDDA 52%, #EFE0C4 100%)',
    glow1: 'rgba(222, 184, 118, 0.34)',
    glow2: 'rgba(206, 96, 86, 0.14)',
    cardBg: 'rgba(255, 253, 248, 0.94)',
    outerBorder: '#D7B276',
    innerBorder: '#E8CFA5',
    cornerColor: '#BE8A3B',
    badgeBg: 'linear-gradient(135deg, #C73238 0%, #A91E24 100%)',
    badgeShadow: 'rgba(169, 30, 36, 0.25)',
    photoBorder: '#E4CBA0',
    kickerColor: '#A8762C',
    titleFont: '"Songti SC", "STSong", "PingFang SC", serif',
    titleColor: '#2E1D12',
    ruleColor: '#C28F3E',
    ingBoxBg: '#FBF6EC',
    ingBoxBorder: '#E7D3B0',
    pill1Bg: '#EFE0C4',
    pill1Color: '#6A4716',
    pill2Bg: '#F6E9D3',
    pill2Color: '#7D5824',
    footerBorder: '#E8D5B7',
    footerColor: '#92734E',
    footerRight: '匠心烹制 · 温暖家味',
    footerRightColor: '#B42429',
    particleRgb: '204, 152, 64',
    sparkleRgb: '235, 198, 122',
  },
};

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    if (!k.startsWith('--')) continue;
    const key = k.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i++;
    }
  }
  return args;
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function runProc(cmd, cmdArgs) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, cmdArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
    let err = '';
    p.stderr.on('data', d => (err += d.toString()));
    p.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited ${code}: ${err.slice(-400)}`));
    });
  });
}

function buildCardHtml({ dish, mainIng, subIng, imageUri, restaurant, badge, theme }) {
  const brandUri = pathToFileURL(path.join(ASSETS_DIR, 'brand', 'brand.png')).href;
  const mascotUri = pathToFileURL(path.join(ASSETS_DIR, 'mascots', `${theme.id}-pose${theme.cardPose}.png`)).href;
  const titleSize = dish.length >= 8 ? 58 : dish.length >= 6 ? 64 : 74;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  width: 1240px;
  height: 1748px;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
  font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
}
body { background: ${theme.bg}; position: relative; }
.glow-1 {
  position: absolute; top: -120px; right: -110px; width: 600px; height: 600px; border-radius: 50%;
  background: radial-gradient(circle, ${theme.glow1} 0%, rgba(255,255,255,0) 72%);
}
.glow-2 {
  position: absolute; bottom: -140px; left: -120px; width: 560px; height: 560px; border-radius: 50%;
  background: radial-gradient(circle, ${theme.glow2} 0%, rgba(255,255,255,0) 72%);
}
.outer {
  position: relative; width: 1128px; height: 1636px; margin: 56px auto; padding: 12px;
  border-radius: 40px; border: 3px solid ${theme.outerBorder}; background: ${theme.cardBg};
  box-shadow: 0 22px 54px rgba(80, 58, 30, 0.08);
}
.inner {
  position: relative; width: 100%; height: 100%; border-radius: 30px;
  border: 1.5px solid ${theme.innerBorder}; padding: 44px 52px 40px;
  display: flex; flex-direction: column;
}
.corner {
  position: absolute; width: 28px; height: 28px; border-color: ${theme.cornerColor};
  border-style: solid; opacity: 0.72;
}
.c-tl { top: 16px; left: 16px; border-width: 3.5px 0 0 3.5px; border-top-left-radius: 10px; }
.c-tr { top: 16px; right: 16px; border-width: 3.5px 3.5px 0 0; border-top-right-radius: 10px; }
.c-bl { bottom: 16px; left: 16px; border-width: 0 0 3.5px 3.5px; border-bottom-left-radius: 10px; }
.c-br { bottom: 16px; right: 16px; border-width: 0 3.5px 3.5px 0; border-bottom-right-radius: 10px; }
.top-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 30px; }
.brand-logo { height: 66px; width: auto; object-fit: contain; }
.badge {
  display: inline-flex; align-items: center; gap: 12px; background: ${theme.badgeBg}; color: #FFFFFF;
  font-size: 31px; font-weight: 600; letter-spacing: 5px; padding: 13px 30px 13px 26px;
  border-radius: 999px; box-shadow: 0 8px 20px ${theme.badgeShadow};
}
.badge-dot { width: 11px; height: 11px; border-radius: 50%; background: rgba(255,255,255,0.92); }
.photo-stage { position: relative; width: 100%; height: 800px; margin-bottom: 42px; }
.photo-frame {
  width: 100%; height: 100%; border-radius: 34px; overflow: hidden;
  border: 6px solid ${theme.photoBorder}; background: #FFF9EE;
  box-shadow: 0 16px 40px rgba(90, 62, 28, 0.10);
}
.photo-frame img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 50%; }
.mascot {
  position: absolute; right: ${theme.mascotRight}px; bottom: ${theme.mascotBottom}px;
  width: ${theme.mascotW}px; height: auto;
  filter: drop-shadow(0 14px 22px rgba(72, 46, 18, 0.18)); z-index: 3;
}
.info-block { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
.title-area { padding-right: 235px; margin-bottom: 26px; }
.kicker { font-size: 25px; font-weight: 600; color: ${theme.kickerColor}; letter-spacing: 5px; margin-bottom: 10px; }
.dish-name {
  font-family: ${theme.titleFont}; font-size: ${titleSize}px; font-weight: 700;
  color: ${theme.titleColor}; letter-spacing: 4px; line-height: 1.18; margin-bottom: 16px;
}
.accent-rule { width: 88px; height: 6px; border-radius: 99px; background: ${theme.ruleColor}; opacity: 0.88; }
.ing-box {
  background: ${theme.ingBoxBg}; border: 2px solid ${theme.ingBoxBorder};
  border-radius: 26px; padding: 28px 34px; display: flex; flex-direction: column; gap: 20px;
}
.ing-row { display: flex; align-items: baseline; gap: 22px; }
.ing-pill {
  flex-shrink: 0; width: 112px; text-align: center; font-size: 27px; font-weight: 600;
  letter-spacing: 4px; padding: 7px 0; border-radius: 999px;
}
.ing-pill.main { background: ${theme.pill1Bg}; color: ${theme.pill1Color}; }
.ing-pill.sub { background: ${theme.pill2Bg}; color: ${theme.pill2Color}; }
.ing-val { font-size: 35px; font-weight: 500; color: ${theme.titleColor}; line-height: 1.42; letter-spacing: 1px; }
.footer {
  margin-top: 24px; padding-top: 18px; border-top: 1.5px dashed ${theme.footerBorder};
  display: flex; align-items: center; justify-content: space-between;
  font-size: 24px; color: ${theme.footerColor}; letter-spacing: 3px;
}
.footer-right { color: ${theme.footerRightColor}; font-weight: 600; }
</style>
</head>
<body>
  <div class="glow-1"></div>
  <div class="glow-2"></div>
  <div class="outer">
    <div class="inner">
      <div class="corner c-tl"></div>
      <div class="corner c-tr"></div>
      <div class="corner c-bl"></div>
      <div class="corner c-br"></div>

      <div class="top-bar">
        <img class="brand-logo" src="${brandUri}" alt="衡水老白干">
        <div class="badge"><span class="badge-dot"></span>${esc(badge)}</div>
      </div>

      <div class="photo-stage">
        <div class="photo-frame">
          <img src="${imageUri}" alt="${esc(dish)}">
        </div>
        <img class="mascot" src="${mascotUri}" alt="${esc(theme.label)}">
      </div>

      <div class="info-block">
        <div>
          <div class="title-area">
            <div class="kicker">${esc(restaurant)} · ${esc(badge)}</div>
            <div class="dish-name">${esc(dish)}</div>
            <div class="accent-rule"></div>
          </div>
          <div class="ing-box">
            <div class="ing-row">
              <span class="ing-pill main">主料</span>
              <span class="ing-val">${esc(mainIng)}</span>
            </div>
            <div class="ing-row">
              <span class="ing-pill sub">辅料</span>
              <span class="ing-val">${esc(subIng)}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <span>衡水老白干 · ${esc(restaurant)}</span>
          <span class="footer-right">${esc(theme.footerRight)}</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function buildFlashHtml({ dish, mainIng, subIng, imageUri, restaurant, badge, theme }) {
  const brandUri = pathToFileURL(path.join(ASSETS_DIR, 'brand', 'brand.png')).href;
  const poseUris = theme.flashPoses.map(p =>
    pathToFileURL(path.join(ASSETS_DIR, 'mascots', `${theme.id}-pose${p}.png`)).href
  );
  const titleSize = dish.length >= 8 ? 72 : dish.length >= 6 ? 84 : 98;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  width: 1920px; height: 1080px; overflow: hidden;
  -webkit-font-smoothing: antialiased;
  font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
}
body { background: ${theme.flashBg}; position: relative; }
.bg-glow-1 {
  position: absolute; top: -180px; left: -120px; width: 920px; height: 920px; border-radius: 50%;
  background: radial-gradient(circle, ${theme.glow1} 0%, rgba(255,255,255,0) 70%);
}
.bg-glow-2 {
  position: absolute; bottom: -220px; right: -120px; width: 880px; height: 880px; border-radius: 50%;
  background: radial-gradient(circle, ${theme.glow2} 0%, rgba(255,255,255,0) 70%);
}
.frame-outer {
  position: absolute; inset: 40px 48px;
  border-radius: 42px; border: 3px solid ${theme.outerBorder};
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 24px 64px rgba(80, 58, 30, 0.08);
  padding: 12px;
}
.frame-inner {
  position: relative; width: 100%; height: 100%;
  border-radius: 32px; border: 1.5px solid ${theme.innerBorder};
  padding: 46px 56px;
  display: flex; align-items: stretch; gap: 58px;
  overflow: hidden;
}
.left-stage {
  position: relative; width: 980px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.dish-card {
  position: relative; width: 960px; height: 760px;
  border-radius: 38px; overflow: hidden;
  border: 8px solid ${theme.photoBorder};
  background: #FFF9EE;
  box-shadow: 0 24px 56px rgba(90, 62, 28, 0.14);
  transform-origin: center center;
}
.dish-card img {
  width: 100%; height: 100%; object-fit: cover;
  transform-origin: center center;
}
.dish-sheen {
  position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(115deg, rgba(255,255,255,0) 35%, rgba(255,255,255,0.46) 50%, rgba(255,255,255,0) 65%);
}
.right-stage {
  position: relative; flex: 1;
  display: flex; flex-direction: column; justify-content: space-between;
  padding: 10px 6px 10px 0;
}
.top-header {
  display: flex; align-items: center; justify-content: space-between;
}
.brand-logo { height: 66px; width: auto; }
.badge {
  display: inline-flex; align-items: center; gap: 12px;
  background: ${theme.badgeBg}; color: #FFFFFF;
  font-size: 30px; font-weight: 600; letter-spacing: 5px;
  padding: 12px 28px 12px 24px; border-radius: 999px;
  box-shadow: 0 8px 20px ${theme.badgeShadow};
}
.badge-dot { width: 10px; height: 10px; border-radius: 50%; background: #FFFFFF; }
.title-wrap { margin-top: 16px; }
.kicker {
  font-size: 28px; font-weight: 600; color: ${theme.kickerColor};
  letter-spacing: 6px; margin-bottom: 12px;
}
.dish-name {
  font-family: ${theme.titleFont}; font-size: ${titleSize}px; font-weight: 700;
  color: ${theme.titleColor}; letter-spacing: 5px; line-height: 1.15; margin-bottom: 18px;
}
.accent-rule {
  width: 112px; height: 7px; border-radius: 99px;
  background: ${theme.ruleColor}; transform-origin: left center;
}
.ing-box {
  background: ${theme.ingBoxBg}; border: 2px solid ${theme.ingBoxBorder};
  border-radius: 28px; padding: 30px 34px;
  display: flex; flex-direction: column; gap: 22px;
  margin-top: 18px; width: 100%;
}
.ing-row { display: flex; align-items: baseline; gap: 20px; }
.ing-pill {
  flex-shrink: 0; width: 116px; text-align: center;
  font-size: 28px; font-weight: 600; letter-spacing: 4px;
  padding: 8px 0; border-radius: 999px;
}
.ing-pill.main { background: ${theme.pill1Bg}; color: ${theme.pill1Color}; }
.ing-pill.sub { background: ${theme.pill2Bg}; color: ${theme.pill2Color}; }
.ing-val { font-size: 40px; font-weight: 600; color: ${theme.titleColor}; line-height: 1.35; }
.bottom-row {
  display: flex; align-items: flex-end; justify-content: space-between;
  padding-top: 12px;
}
.footer-meta {
  display: flex; flex-direction: column; gap: 8px;
  font-size: 26px; color: ${theme.footerColor}; letter-spacing: 3px;
}
.footer-slogan { color: ${theme.footerRightColor}; font-weight: 600; font-size: 28px; }
.mascot-stage {
  position: relative; width: 290px; height: 310px;
  display: flex; align-items: flex-end; justify-content: center;
  transform-origin: center bottom;
}
.mascot-pose {
  position: absolute; bottom: 0; max-width: 286px; max-height: 306px;
  width: auto; height: auto;
  filter: drop-shadow(0 16px 24px rgba(72, 46, 18, 0.20));
  opacity: 0;
}
#fx-canvas {
  position: absolute; inset: 0; width: 1920px; height: 1080px; pointer-events: none; z-index: 20;
}
</style>
</head>
<body>
  <div class="bg-glow-1" id="glow1"></div>
  <div class="bg-glow-2" id="glow2"></div>

  <div class="frame-outer">
    <div class="frame-inner">
      <div class="left-stage">
        <div class="dish-card" id="dishCard">
          <img id="dishImg" src="${imageUri}" alt="${esc(dish)}">
          <div class="dish-sheen" id="dishSheen"></div>
        </div>
      </div>

      <div class="right-stage">
        <div class="top-header" id="topHeader">
          <img class="brand-logo" src="${brandUri}" alt="衡水老白干">
          <div class="badge"><span class="badge-dot"></span>${esc(badge)}</div>
        </div>

        <div class="title-wrap">
          <div class="kicker" id="kicker">${esc(restaurant)} · ${esc(badge)}</div>
          <div class="dish-name" id="dishName">${esc(dish)}</div>
          <div class="accent-rule" id="accentRule"></div>
        </div>

        <div class="ing-box" id="ingBox">
          <div class="ing-row" id="ingRow1">
            <span class="ing-pill main">主料</span>
            <span class="ing-val">${esc(mainIng)}</span>
          </div>
          <div class="ing-row" id="ingRow2">
            <span class="ing-pill sub">辅料</span>
            <span class="ing-val">${esc(subIng)}</span>
          </div>
        </div>

        <div class="bottom-row">
          <div class="footer-meta" id="footerMeta">
            <span>衡水老白干 · ${esc(restaurant)}</span>
            <span class="footer-slogan">${esc(theme.footerRight)}</span>
          </div>
          <div class="mascot-stage" id="mascotStage">
            ${poseUris.map((u, idx) => `<img class="mascot-pose" id="pose${idx}" src="${u}">`).join('')}
          </div>
        </div>
      </div>
    </div>
  </div>

  <canvas id="fx-canvas" width="1920" height="1080"></canvas>

<script>
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const easeOutCubic = x => 1 - Math.pow(1 - x, 3);
const easeOutBack = x => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

const canvas = document.getElementById('fx-canvas');
const ctx = canvas.getContext('2d');
const PRGB = "${theme.particleRgb}";
const SRGB = "${theme.sparkleRgb}";

// Perimeter of the dish card in viewport coordinates:
// frame-outer inset (48, 40) + padding 12 + frame-inner padding (56, 46) => left-stage x=116, y=98, w=980, h=884
// dishCard centered inside left-stage (960x760): x=126, y=160, w=960, h=760, r=38
function roundedRectPoint(u) {
  const x = 126, y = 160, w = 960, h = 760, r = 38;
  const pTop = w - 2*r, pRight = h - 2*r, pBot = w - 2*r, pLeft = h - 2*r;
  const arc = 0.5 * Math.PI * r;
  const total = pTop + pRight + pBot + pLeft + 4 * arc;
  let d = ((u % 1) + 1) % 1 * total;
  if (d < pTop) return [x + r + d, y];
  d -= pTop;
  if (d < arc) { const a = -Math.PI/2 + d/r; return [x + w - r + Math.cos(a)*r, y + r + Math.sin(a)*r]; }
  d -= arc;
  if (d < pRight) return [x + w, y + r + d];
  d -= pRight;
  if (d < arc) { const a = d/r; return [x + w - r + Math.cos(a)*r, y + h - r + Math.sin(a)*r]; }
  d -= arc;
  if (d < pBot) return [x + w - r - d, y + h];
  d -= pBot;
  if (d < arc) { const a = Math.PI/2 + d/r; return [x + r + Math.cos(a)*r, y + h - r + Math.sin(a)*r]; }
  d -= arc;
  if (d < pLeft) return [x, y + h - r - d];
  d -= pLeft;
  const a = Math.PI + d/r;
  return [x + r + Math.cos(a)*r, y + r + Math.sin(a)*r];
}

function drawStar(cx, cy, size, alpha) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = 'rgba(' + SRGB + ',' + alpha.toFixed(3) + ')';
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    ctx.lineTo(Math.cos(a) * size, Math.sin(a) * size);
    ctx.lineTo(Math.cos(a + Math.PI/4) * size * 0.28, Math.sin(a + Math.PI/4) * size * 0.28);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

const SPARKLES = [
  { x: 240, y: 260, s: 18, ph: 0.2 },
  { x: 980, y: 240, s: 22, ph: 1.4 },
  { x: 220, y: 820, s: 16, ph: 2.5 },
  { x: 960, y: 840, s: 20, ph: 3.7 },
  { x: 1710, y: 690, s: 17, ph: 0.9 },
  { x: 1510, y: 830, s: 15, ph: 2.1 },
];

window.renderAt = function(t) {
  // 1. Header
  const pHead = easeOutCubic(clamp(t / 0.65));
  const topHeader = document.getElementById('topHeader');
  topHeader.style.opacity = pHead;
  topHeader.style.transform = 'translateY(' + ((1 - pHead) * -28).toFixed(1) + 'px)';

  // 2. Dish card bounce-in + gentle breathing zoom
  const pDish = easeOutBack(clamp((t - 0.15) / 0.85));
  const dishCard = document.getElementById('dishCard');
  dishCard.style.opacity = clamp((t - 0.10) / 0.45);
  dishCard.style.transform = 'scale(' + (0.86 + 0.14 * pDish).toFixed(4) + ')';
  const zoom = 1.0 + 0.038 * (0.5 - 0.5 * Math.cos((t / 6.5) * Math.PI * 2));
  document.getElementById('dishImg').style.transform = 'scale(' + zoom.toFixed(4) + ')';

  // Dish sunlit sheen sweep (twice: at 1.3s and 5.1s)
  let sheenX = -140;
  if (t >= 1.1 && t <= 2.3) sheenX = -120 + ((t - 1.1) / 1.2) * 240;
  else if (t >= 4.9 && t <= 6.1) sheenX = -120 + ((t - 4.9) / 1.2) * 240;
  document.getElementById('dishSheen').style.transform = 'translateX(' + sheenX.toFixed(1) + '%)';

  // 3. Kicker, Title, Rule
  const pTitle = easeOutBack(clamp((t - 0.70) / 0.70));
  const kicker = document.getElementById('kicker');
  kicker.style.opacity = clamp((t - 0.55) / 0.45);
  kicker.style.transform = 'translateY(' + ((1 - easeOutCubic(clamp((t - 0.55) / 0.5))) * 18).toFixed(1) + 'px)';

  const dishName = document.getElementById('dishName');
  dishName.style.opacity = clamp((t - 0.70) / 0.40);
  dishName.style.transform = 'translateX(' + ((1 - pTitle) * 44).toFixed(1) + 'px)';

  const pRule = easeOutCubic(clamp((t - 1.05) / 0.45));
  document.getElementById('accentRule').style.transform = 'scaleX(' + pRule.toFixed(4) + ')';

  // 4. Ingredients box & rows
  const pBox = easeOutCubic(clamp((t - 1.20) / 0.55));
  const ingBox = document.getElementById('ingBox');
  ingBox.style.opacity = pBox;
  ingBox.style.transform = 'translateY(' + ((1 - pBox) * 24).toFixed(1) + 'px)';

  const pR1 = easeOutCubic(clamp((t - 1.45) / 0.45));
  const r1 = document.getElementById('ingRow1');
  r1.style.opacity = pR1;
  r1.style.transform = 'translateX(' + ((1 - pR1) * 24).toFixed(1) + 'px)';

  const pR2 = easeOutCubic(clamp((t - 1.70) / 0.45));
  const r2 = document.getElementById('ingRow2');
  r2.style.opacity = pR2;
  r2.style.transform = 'translateX(' + ((1 - pR2) * 24).toFixed(1) + 'px)';

  // 5. Footer
  const pFoot = easeOutCubic(clamp((t - 1.90) / 0.50));
  document.getElementById('footerMeta').style.opacity = pFoot;

  // 6. Mascot multi-pose Flash bounce & cheerful sway
  const mIn = easeOutBack(clamp((t - 0.90) / 0.75));
  const stage = document.getElementById('mascotStage');
  const poseIdx = t < 2.2 ? 0 : t < 3.7 ? 1 : t < 5.1 ? 2 : 3;
  const poseStart = [0.9, 2.2, 3.7, 5.1][poseIdx];
  const dtPose = Math.max(0, t - poseStart);
  const pop = dtPose < 0.28 ? 1 + 0.09 * Math.sin((dtPose / 0.28) * Math.PI) : 1.0;
  const sway = Math.sin(t * 3.2) * 3.2;
  const bob = Math.abs(Math.sin(t * 3.2)) * -7;
  stage.style.opacity = clamp((t - 0.90) / 0.35);
  stage.style.transform =
    'translateY(' + ((1 - mIn) * 90 + bob).toFixed(1) + 'px) ' +
    'scale(' + (mIn * pop).toFixed(4) + ') ' +
    'rotate(' + sway.toFixed(2) + 'deg)';

  for (let i = 0; i < 4; i++) {
    document.getElementById('pose' + i).style.opacity = i === poseIdx ? 1 : 0;
  }

  // 7. Canvas Flash-style particle trail along dish border + sunlit sparkles
  ctx.clearRect(0, 0, 1920, 1080);

  if (t >= 0.45) {
    const headU = ((t - 0.45) * 0.24) % 1;
    const trailCount = 26;
    for (let i = 0; i < trailCount; i++) {
      const frac = i / trailCount;
      const u = headU - frac * 0.14;
      const [px, py] = roundedRectPoint(u);
      const alpha = (1 - frac) * 0.78 * clamp((t - 0.45) / 0.4);
      const rad = (1 - frac) * 7.5 + 1.5;
      ctx.beginPath();
      ctx.arc(px, py, rad, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + PRGB + ',' + alpha.toFixed(3) + ')';
      ctx.fill();
    }
    const [hx, hy] = roundedRectPoint(headU);
    drawStar(hx, hy, 18, 0.92 * clamp((t - 0.45) / 0.4));

    // Opposite twin particle for balanced Flash sparkle
    const headU2 = (headU + 0.5) % 1;
    for (let i = 0; i < 18; i++) {
      const frac = i / 18;
      const [px, py] = roundedRectPoint(headU2 - frac * 0.09);
      const alpha = (1 - frac) * 0.55 * clamp((t - 0.45) / 0.4);
      ctx.beginPath();
      ctx.arc(px, py, (1 - frac) * 5.5 + 1.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + SRGB + ',' + alpha.toFixed(3) + ')';
      ctx.fill();
    }
  }

  for (const sp of SPARKLES) {
    const pulse = 0.5 + 0.5 * Math.sin(t * 4.2 + sp.ph);
    const vis = clamp((t - 0.8) / 0.6);
    drawStar(sp.x, sp.y - Math.sin(t * 2 + sp.ph) * 6, sp.s * (0.65 + 0.45 * pulse), pulse * 0.85 * vis);
  }
};
window.renderAt(0);
</script>
</body>
</html>`;
}

async function renderFlashMp4(htmlPath, outMp4, previewDir) {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lbg-chrome-'));
  const port = 9222 + Math.floor(Math.random() * 500);
  const chrome = spawn(CHROME, [
    '--headless=new',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--window-size=1920,1080',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    pathToFileURL(htmlPath).href,
  ], { stdio: 'ignore' });

  try {
    let wsUrl = null;
    for (let i = 0; i < 40; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${port}/json/list`);
        const pages = await res.json();
        const page = pages.find(p => p.type === 'page' && p.webSocketDebuggerUrl);
        if (page) { wsUrl = page.webSocketDebuggerUrl; break; }
      } catch {}
      await new Promise(r => setTimeout(r, 150));
    }
    if (!wsUrl) throw new Error('Chrome CDP endpoint not ready');

    const ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', reject, { once: true });
    });

    let msgId = 0;
    const pending = new Map();
    ws.addEventListener('message', ev => {
      const m = JSON.parse(ev.data.toString());
      if (m.id && pending.has(m.id)) {
        const { resolve, reject } = pending.get(m.id);
        pending.delete(m.id);
        if (m.error) reject(new Error(m.error.message));
        else resolve(m.result);
      }
    });

    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++msgId;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });

    await send('Emulation.setDeviceMetricsOverride', {
      width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false,
    });
    // Wait briefly for all images/fonts to finish loading
    await send('Runtime.evaluate', {
      expression: 'Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))).then(() => document.fonts.ready)',
      awaitPromise: true,
    });

    const fps = 30;
    const duration = 6.5;
    const totalFrames = Math.round(fps * duration);
    const ff = spawn('ffmpeg', [
      '-y', '-loglevel', 'error',
      '-f', 'image2pipe', '-vcodec', 'mjpeg', '-framerate', String(fps), '-i', '-',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-movflags', '+faststart',
      outMp4,
    ], { stdio: ['pipe', 'ignore', 'pipe'] });

    let ffErr = '';
    ff.stderr.on('data', d => (ffErr += d.toString()));

    const previewFrames = new Set([36, 90, 165]); // 1.2s, 3.0s, 5.5s
    for (let f = 0; f < totalFrames; f++) {
      const t = f / fps;
      await send('Runtime.evaluate', { expression: `window.renderAt(${t.toFixed(4)})` });
      const { data } = await send('Page.captureScreenshot', { format: 'jpeg', quality: 94 });
      const buf = Buffer.from(data, 'base64');
      if (previewDir && previewFrames.has(f)) {
        fs.writeFileSync(path.join(previewDir, `flash-frame-${f}.jpg`), buf);
      }
      if (!ff.stdin.write(buf)) {
        await new Promise(r => ff.stdin.once('drain', r));
      }
    }
    ff.stdin.end();
    await new Promise((resolve, reject) => {
      ff.on('close', code => code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}: ${ffErr}`)));
    });
    ws.close();
  } finally {
    chrome.kill('SIGKILL');
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }
}

async function renderA4Pdf(cardPaths, outPdf) {
  const slots = [...cardPaths];
  while (slots.length < 4) slots.push(cardPaths[slots.length % cardPaths.length]);
  const uris = slots.slice(0, 4).map(p => pathToFileURL(path.resolve(p)).href);

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<style>
@page { size: 210mm 297mm; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 210mm; height: 297mm; overflow: hidden; background: #FFFFFF; }
.sheet {
  position: relative; width: 210mm; height: 297mm;
  display: grid; grid-template-columns: 105mm 105mm; grid-template-rows: 148.5mm 148.5mm;
}
.slot { width: 105mm; height: 148.5mm; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.slot img { width: 105mm; height: 148mm; object-fit: contain; }
.cut-v { position: absolute; top: 0; bottom: 0; left: 105mm; border-left: 0.4mm dashed rgba(160,160,160,0.45); }
.cut-h { position: absolute; left: 0; right: 0; top: 148.5mm; border-top: 0.4mm dashed rgba(160,160,160,0.45); }
</style>
</head>
<body>
  <div class="sheet">
    ${uris.map(u => `<div class="slot"><img src="${u}"></div>`).join('')}
    <div class="cut-v"></div>
    <div class="cut-h"></div>
  </div>
</body>
</html>`;

  const tmpHtml = path.join(os.tmpdir(), `lbg-a4-${Date.now()}.html`);
  fs.writeFileSync(tmpHtml, html, 'utf-8');
  try {
    await runProc(CHROME, [
      '--headless=new',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-pdf-header-footer',
      `--print-to-pdf=${path.resolve(outPdf)}`,
      pathToFileURL(tmpHtml).href,
    ]);
  } finally {
    fs.rmSync(tmpHtml, { force: true });
  }
}

async function main() {
  const args = parseArgs(process.argv);

  if (args['a4-from']) {
    const cards = args['a4-from'].split(',').map(s => s.trim()).filter(Boolean);
    const outPdf = args['a4-out'] || '本周新菜-A4四拼打印.pdf';
    await renderA4Pdf(cards, outPdf);
    console.log('A4_PDF_OK', path.resolve(outPdf));
    return;
  }

  const dish = args.dish;
  const mainIng = args.main;
  const subIng = args.sub;
  const image = args.image;
  if (!dish || !mainIng || !subIng || !image) {
    console.error('Usage: node render_dish_kit.mjs --dish <菜名> --main <主料> --sub <辅料> --image <卡通菜品图路径> [--mascot xiaochenpi|xiao20|xiao30] [--restaurant 接待餐厅] [--badge 本周新菜] [--output-dir <目录>] [--no-flash] [--a4]');
    process.exit(1);
  }

  const mascotKey = args.mascot && THEMES[args.mascot] ? args.mascot : 'xiao20';
  const theme = THEMES[mascotKey];
  const restaurant = args.restaurant || '接待餐厅';
  const badge = args.badge || '本周新菜';
  const outDir = path.resolve(args['output-dir'] || '.');
  fs.mkdirSync(outDir, { recursive: true });

  const safeDish = dish.replace(/[\\/:*?"<>|]/g, '_');
  const imageUri = pathToFileURL(path.resolve(image)).href;

  // 1. Render A6 Card PNG
  const cardHtmlPath = path.join(os.tmpdir(), `lbg-card-${Date.now()}.html`);
  const cardPngPath = path.join(outDir, `${safeDish}-${theme.id}-A6卡片.png`);
  fs.writeFileSync(cardHtmlPath, buildCardHtml({ dish, mainIng, subIng, imageUri, restaurant, badge, theme }), 'utf-8');
  try {
    await runProc(CHROME, [
      '--headless=new',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--window-size=1240,1748',
      `--screenshot=${cardPngPath}`,
      pathToFileURL(cardHtmlPath).href,
    ]);
  } finally {
    fs.rmSync(cardHtmlPath, { force: true });
  }
  console.log('CARD_PNG_OK', cardPngPath);

  // 2. Render A4 4-up PDF if requested
  if (args.a4) {
    const a4PdfPath = path.join(outDir, `${safeDish}-${theme.id}-A4四拼打印.pdf`);
    await renderA4Pdf([cardPngPath], a4PdfPath);
    console.log('A4_PDF_OK', a4PdfPath);
  }

  // 3. Render 16:9 Restaurant Screen Flash MP4
  if (!args['no-flash']) {
    const flashHtmlPath = path.join(os.tmpdir(), `lbg-flash-${Date.now()}.html`);
    const flashMp4Path = path.join(outDir, `${safeDish}-${theme.id}-餐厅屏Flash.mp4`);
    fs.writeFileSync(flashHtmlPath, buildFlashHtml({ dish, mainIng, subIng, imageUri, restaurant, badge, theme }), 'utf-8');
    try {
      await renderFlashMp4(flashHtmlPath, flashMp4Path, args['save-preview-frames'] ? outDir : null);
    } finally {
      fs.rmSync(flashHtmlPath, { force: true });
    }
    console.log('FLASH_MP4_OK', flashMp4Path);
  }
}

main().catch(err => {
  console.error('RENDER_ERROR', err);
  process.exit(1);
});
