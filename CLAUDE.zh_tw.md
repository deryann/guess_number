# CLAUDE.md

本文件提供給 Claude Code (claude.ai/code) 在本程式庫中操作程式碼時的指引。

## 專案概述

這是一個經典的 4A0B 猜數字遊戲，後端採用 Python FastAPI，前端為純 HTML/CSS/JavaScript。應用程式使用 SQLite 進行資料持久化，並支援 Docker 部署。

## 架構說明

**後端 (`/backend/`)**：
- FastAPI 應用程式於 `main.py`，已啟用 CORS
- SQLite 資料庫（`ranking.db`），包含三個資料表：`games`、`rankings`、`game_history`
- 以 UUID 管理遊戲會話
- 版本資訊來自環境變數（`MAIN_VERSION`、`MINOR_VERSION`）

**前端 (`/frontend/`)**：
- 純 JavaScript，動態偵測 API URL
- 以 session 追蹤管理遊戲狀態
- 動態產生遊戲歷史表格（每表 5 列）
- 即時計時器與猜測次數統計

**資料庫結構**：
- `games`：儲存以 UUID 為主的遊戲會話、答案、玩家資訊
- `rankings`：TOP 10 排行榜，依猜測次數及用時排序
- `game_history`：每次猜測紀錄，與遊戲會話關聯

## 常用指令

### 開發
```bash
# 後端安裝（僅首次）
cd backend
pip install -r requirements.txt
python database_setup.py

# 啟動後端伺服器
cd backend
uvicorn main:app --reload --port 12527

# 前端：於瀏覽器開啟 frontend/index.html
```

### Docker 部署
```bash
# 版本化建置
chmod +x start_build.sh
./start_build.sh

# 執行容器
docker run -p 12527:12527 guess-number-game:latest
```

### 測試
尚未設定自動化測試。請透過網頁介面進行手動測試。

## 主要開發模式

- **遊戲流程**：輸入玩家名稱 → 建立 UUID 遊戲 → 提交猜測 → 完成並進入排行
- **API 版本管理**：主版本為建置日期（YYYYMMDD），次版本為 Git hash
- **靜態檔案服務**：後端透過 FastAPI 靜態掛載提供前端檔案
- **資料庫連線**：使用 `get_db_connection()` 輔助函式，支援 dict 取用
- **CORS**：開發階段允許所有來源

## 重要檔案

- `backend/main.py`：所有 API 端點與遊戲邏輯
- `frontend/script.js`：遊戲狀態管理與 UI 互動
- `backend/database_setup.py`：資料庫初始化腳本
- `start_build.sh`：自動版本化 Docker 建置腳本
- `ranking.db`：SQLite 資料庫（由 setup 腳本建立）

## API 端點

- `POST /new_game`：初始化遊戲會話並取得 UUID
- `POST /guess`：提交猜測並取得 A/B 結果
- `GET /ranking`：取得 TOP 10 排行榜
- `GET /version`：取得應用程式版本資訊
- `GET /`：提供主頁 HTML
- `/static/*`：前端靜態檔案