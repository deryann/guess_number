# 🎯 猜數字遊戲 (Guess the Number)

這是一個經典的猜數字 (4A0B) 網頁遊戲，前端使用純 HTML/CSS/JavaScript 打造，後端則由 Python FastAPI 驅動，並使用 SQLite 資料庫來記錄玩家的排行榜。

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

請依照以下步驟來啟動遊戲。您需要同時運行後端伺服器與前端頁面。

### 1. 後端 (Backend)

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

3.  **產生資料庫**: 執行 `database_setup.py` 腳本來建立 `ranking.db` 資料庫與 `rankings` 資料表。
    ```bash
    python database_setup.py
    ```
    您應該會看到 "Database and table 'rankings' created successfully." 的訊息。

**啟動後端伺服器:**

1.  在 `backend` 目錄下，執行以下指令來啟動 FastAPI 服務：
    ```bash
    uvicorn main:app --reload
    ```
2.  伺服器將會運行在 `http://127.0.0.1:8000`。請保持此終端機視窗開啟。

### 2. 前端 (Frontend)

前端是靜態的網頁，不需要伺服器即可運行。

1.  在您的檔案總管中，找到 `frontend` 資料夾。
2.  直接用您的網頁瀏覽器 (例如 Chrome, Firefox, Edge) **打開 `index.html` 檔案**。
3.  輸入您的姓名，即可開始遊戲！

## 📝 API 端點

後端提供了以下 API 端點供前端呼叫：

- `POST /new_game`: 初始化一場新遊戲，產生一組新的隨機數字。
- `POST /guess`: 接收玩家的猜測，並回傳 `A` 和 `B` 的結果。
- `POST /add_score`: 當遊戲結束時，接收前端傳來的遊戲結果 (姓名、時間、次數) 並存入資料庫。
- `GET /ranking`: 從資料庫讀取排名資訊 (依猜測次數與時間排序)，並回傳前 10 名的紀錄。
