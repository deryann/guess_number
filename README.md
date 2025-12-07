# 🎯 猜數字遊戲 (Guess the Number)

> **最後更新日期**: 2025-12-07

經典的 4A0B 猜數字網頁遊戲，使用 Python FastAPI 後端 + 純 HTML/CSS/JavaScript 前端，支援 Docker 部署。

## 🌐 線上試玩

- **Render**: https://guess-number-ywjn.onrender.com/

## ✨ 主要功能

| 功能 | 說明 |
|------|------|
| 經典 4A0B 玩法 | 系統隨機產生不重複的四位數字，猜出正確數字與位置 |
| 玩家系統 | 開始遊戲前輸入姓名 |
| 即時狀態追蹤 | 顯示猜測次數與花費時間 |
| 歷史紀錄 | 以表格形式呈現所有猜測歷史 |
| TOP 10 排行榜 | 記錄成績並高亮顯示玩家紀錄 |
| SQLite 資料庫 | 排名資料持久化儲存 |

## 📂 專案結構

```
guess_number/
├── backend/                # 後端 Python FastAPI 應用
│   ├── main.py             # API 邏輯與端點
│   ├── requirements.txt    # Python 依賴套件
│   ├── database_setup.py   # 資料庫初始化腳本
│   └── ranking.db          # SQLite 資料庫 (自動產生)
├── frontend/               # 前端靜態網頁
│   ├── index.html          # 遊戲主頁面
│   ├── style.css           # 頁面樣式
│   └── script.js           # 遊戲互動邏輯
├── Dockerfile              # Docker 構建檔案
├── docker-compose.yml      # Docker Compose 設定
├── start_build.sh          # Linux/macOS 構建腳本
├── start_build.bat         # Windows 構建腳本
└── README.md               # 說明文件
```

## 🚀 快速開始

### Docker 部署 (推薦)

```bash
# 構建映像
chmod +x start_build.sh && ./start_build.sh

# 運行容器
docker run -p 12527:12527 guess-number-game:latest

# 或使用 Docker Compose
docker-compose up -d
```

開啟瀏覽器前往 `http://localhost:12527`

### 本機開發

```bash
# 1. 安裝依賴 (首次)
cd backend
pip install -r requirements.txt
python database_setup.py

# 2. 啟動後端
uvicorn main:app --reload --port 12527
```

開啟瀏覽器前往 `http://localhost:12527` 或直接開啟 `frontend/index.html`

## 📝 API 端點

| 端點 | 方法 | 說明 |
|------|------|------|
| `/` | GET | 主頁面 |
| `/new_game` | POST | 初始化新遊戲，產生隨機數字 |
| `/guess` | POST | 提交猜測，回傳 A/B 結果 |
| `/add_score` | POST | 儲存遊戲結果 |
| `/ranking` | GET | 取得 TOP 10 排行榜 |
| `/version` | GET | 取得版本資訊 |
| `/static/*` | GET | 靜態檔案服務 |

## 🏗️ 版本管理

應用程式支援自動版本管理：

| 版本號 | 來源 | 格式 |
|--------|------|------|
| 主版本 (MAIN_VERSION) | 建置日期 | YYYYMMDD |
| 次版本 (MINOR_VERSION) | Git commit | 短 hash |

若無法取得 Git 資訊，預設為 `dev.dev`

## 📄 授權

MIT License
