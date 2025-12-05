# 🎯 猜數字遊戲 (Guess the Number)

這是一個經典的猜數字 (4A0B) 網頁遊戲，前端使用純 HTML/CSS/JavaScript 打造，後端則由 Python FastAPI 驅動，並使用 SQLite 資料庫來記錄玩家的排行榜。

## Online docker connector
- https://guess-number-ywjn.onrender.com/

## ✨ 主要功能

- **經典 4A0B 玩法**: 系統隨機產生一組不重複的四位數字，玩家需要猜出正確的數字與位置。
- **玩家系統**: 玩家在開始遊戲前可以輸入自己的姓名。
- **即時狀態追蹤**: 遊戲介面會即時顯示玩家的猜測次數與所花費的時間。
- **表格化歷史紀錄**: 所有的猜測歷史都會以清晰的表格形式呈現在遊戲畫面上方。
- **TOP 10 排行榜**: 
    - 遊戲結束後，玩家的成績（姓名、猜測次數、花費時間）會被記錄下來。
    - 系統會自動彈出排行榜，並將玩家當前的紀錄以高亮方式顯示。
    - 玩家也可以在遊戲中隨時點擊「🏆」按鈕來查看排行榜。
- **SQLite 資料庫**: 所有排名資料都儲存在後端的 `ranking.db` 檔案中，方便管理與部署。

## 📂 專案結構

```
/guess_number
├── backend/            # 後端 Python FastAPI 應用
│   ├── main.py         # API 邏輯與端點
│   ├── requirements.txt# Python 依賴套件
│   ├── database_setup.py # 用於初始化資料庫的腳本
│   └── ranking.db      # SQLite 資料庫檔案 (執行 setup 後產生)
│
├── frontend/           # 前端靜態網頁
│   ├── index.html      # 遊戲主頁面
│   ├── style.css       # 頁面樣式
│   └── script.js       # 遊戲互動邏輯
│
└── README.md           # 本說明檔案
```

## 🚀 部署與啟動說明

您可以選擇使用 Docker 容器化部署，或是傳統的本機部署方式。

### 方式一：Docker 容器化部署 (推薦)

這是最簡單快速的部署方式，使用 Docker 來建置和運行整個應用程式。

**1. 使用自動化 Build Script:**

在 Linux/macOS 系統上：
```bash
chmod +x start_build.sh
./start_build.sh
```

**2. 運行容器:**
```bash
docker run -p 12527:12527 guess-number-game:latest
```

**3. 使用 Docker Compose (可選):**
```bash
# 設定環境變數 (可選)
export BUILD_DATE=$(date +"%Y%m%d")
export GIT_HASH=$(git rev-parse --short HEAD)

# 啟動服務
docker-compose up -d
```

**4. 存取應用程式:**
開啟瀏覽器並前往 `http://localhost:12527`

### 方式二：傳統本機部署

請依照以下步驟來啟動遊戲。您需要同時運行後端伺服器與前端頁面。

#### 1. 後端 (Backend)

後端服務負責處理遊戲邏輯、儲存與讀取排行榜資料。

**初次設定 (僅需執行一次):**

1.  **進入後端目錄**:
    ```bash
    cd backend
    ```

2.  **安裝依賴套件**:
    ```bash
    pip install -r requirements.txt
    ```

3.  **產生資料庫**: 執行 `database_setup.py` 腳本來建立 `ranking.db` 資料庫與相關資料表。
    ```bash
    python database_setup.py
    ```
    您應該會看到 "Database and tables 'rankings', 'games', and 'game_history' created successfully." 的訊息。

**啟動後端伺服器:**

1.  在 `backend` 目錄下，執行以下指令來啟動 FastAPI 服務：
    ```bash
    uvicorn main:app --reload --port 12527
    ```
2.  伺服器將會運行在 `http://127.0.0.1:12527`。請保持此終端機視窗開啟。

#### 2. 前端 (Frontend)

前端是靜態的網頁，不需要伺服器即可運行。

1.  在您的檔案總管中，找到 `frontend` 資料夾。
2.  直接用您的網頁瀏覽器 (例如 Chrome, Firefox, Edge) **打開 `index.html` 檔案**。
3.  輸入您的姓名，即可開始遊戲！

## 📝 API 端點

後端提供了以下 API 端點供前端呼叫：

- `GET /`: 主頁面，直接提供 index.html
- `POST /new_game`: 初始化一場新遊戲，產生一組新的隨機數字。
- `POST /guess`: 接收玩家的猜測，並回傳 `A` 和 `B` 的結果。
- `POST /add_score`: 當遊戲結束時，接收前端傳來的遊戲結果 (姓名、時間、次數) 並存入資料庫。
- `GET /ranking`: 從資料庫讀取排名資訊 (依猜測次數與時間排序)，並回傳前 10 名的紀錄。
- `GET /version`: 取得應用程式版本資訊 (主版本號.次版本號)
- `/static/*`: 靜態檔案服務 (CSS, JS 等)

## 🏗️ Docker 構建說明

### 版本管理

應用程式支援自動版本管理：
- **主版本號 (MAIN_VERSION)**: 建置日期 (YYYYMMDD 格式)
- **次版本號 (MINOR_VERSION)**: Git commit hash (短格式)
- 如果無法取得 Git 資訊，則預設為 `dev.dev`

### 構建過程

Dockerfile 使用兩階段構建：
1. **Builder Stage**: 安裝 Python 依賴套件
2. **Runtime Stage**: 複製應用程式檔案，初始化資料庫，並啟動服務

### 檔案結構

```
/guess_number
├── Dockerfile              # Docker 構建檔案
├── docker-compose.yml      # Docker Compose 設定檔
├── .dockerignore           # Docker 忽略檔案清單
├── start_build.sh          # Linux/macOS 構建腳本
├── start_build.bat         # Windows 構建腳本
├── backend/                # 後端 Python FastAPI 應用
├── frontend/               # 前端靜態網頁檔案
└── README.md               # 本說明檔案
```
