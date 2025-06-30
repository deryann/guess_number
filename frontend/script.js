// 動態檢測 API URL，自動適應當前環境
const API_URL = window.location.origin;
let guessCount = 0;
let gameOver = false;
let timerInterval;
let startTime;
let playerName = "";
let lastGameResultId = null;
let currentGameId = null;  // Store the current game UUID
let currentTableIndex = 0;  // 當前表格索引
const ROWS_PER_TABLE = 5;   // 每個表格最多顯示的行數

// Load version information when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadVersionInfo();
});

async function loadVersionInfo() {
    try {
        const response = await fetch(`${API_URL}/version`);
        if (response.ok) {
            const versionData = await response.json();
            const versionDisplay = document.getElementById('version-display');
            versionDisplay.textContent = `${versionData.main_version}.${versionData.minor_version}`;
        } else {
            console.error('Failed to load version info');
            document.getElementById('version-display').textContent = 'dev.dev';
        }
    } catch (error) {
        console.error('Error loading version info:', error);
        document.getElementById('version-display').textContent = 'dev.dev';
    }
}

function startGame() {
    playerName = document.getElementById('playerName').value;
    if (!playerName) {
        alert('請輸入您的姓名！');
        return;
    }

    document.getElementById('start-screen').style.display = 'none';
    document.querySelector('.game-container').style.display = 'block';
    document.getElementById('playerNameDisplay').textContent = playerName;

    newGame();
}

function toggleRulesModal(show) {
    const modal = document.getElementById('rules-modal');
    modal.style.display = show ? 'block' : 'none';
}

function toggleRankingModal(show) {
    const modal = document.getElementById('ranking-modal');
    modal.style.display = show ? 'block' : 'none';
}

window.onclick = function(event) {
    const rulesModal = document.getElementById('rules-modal');
    const rankingModal = document.getElementById('ranking-modal');
    if (event.target == rulesModal) {
        toggleRulesModal(false);
    }
    if (event.target == rankingModal) {
        toggleRankingModal(false);
    }
}

// 將全形數字轉換為半形數字
function convertToHalfWidth(str) {
    return str.replace(/[０-９]/g, function(s) {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });
}

// 驗證輸入
function validateInput(input) {
    input = convertToHalfWidth(input);
    if (input.length !== 4) {
        return '請輸入4位數字！';
    }
    if (!/^\d{4}$/.test(input)) {
        return '請只輸入數字！';
    }
    const digits = input.split('');
    const uniqueDigits = [...new Set(digits)];
    if (uniqueDigits.length !== 4) {
        return '數字不能重複！';
    }
    return null;
}

// 進行猜測
async function makeGuess() {
    if (gameOver) return;
    
    if (!currentGameId) {
        showMessage('請先開始新遊戲。', 'error');
        return;
    }

    let input = document.getElementById('guessInput').value;
    input = convertToHalfWidth(input);

    const errorMsg = validateInput(input);
    if (errorMsg) {
        showMessage(errorMsg, 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/guess`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                game_id: currentGameId,
                number: input 
            }),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const result = await response.json();
        guessCount++;
        document.getElementById('guessCount').textContent = guessCount;
        const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
        addToHistory(input, result.a, result.b, elapsedSeconds);

        if (result.game_completed) {
            gameOver = true;
            clearInterval(timerInterval);
            lastGameResultId = result.ranking_id;
            showMessage(`🎉 恭喜 ${playerName}！你猜對了！你總共猜了 ${result.guess_count} 次，花了 ${Math.round(result.duration)} 秒。`, 'success');
            showRanking(lastGameResultId);
        } else {
            showMessage(`結果：${result.a}A${result.b}B，繼續加油！`, 'hint');
        }
    } catch (error) {
        showMessage('發生錯誤，請稍後再試。', 'error');
    }

    document.getElementById('guessInput').value = '';
}

// Note: This function is kept for backward compatibility but is no longer used
// The backend now automatically handles score saving when the game is completed
async function saveScore(name, startTime, endTime, duration, guessCount) {
    try {
        const response = await fetch(`${API_URL}/add_score`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                name: name,
                start_time: startTime,
                end_time: endTime,
                duration: duration,
                guess_count: guessCount
            }),
        });
        const result = await response.json();
        lastGameResultId = result.id;
    } catch (error) {
        console.error('Failed to save score:', error);
    }
}

async function showRanking(highlightId) {
    try {
        const response = await fetch(`${API_URL}/ranking`);
        const rankingData = await response.json();
        const rankingList = document.getElementById('ranking-list');
        
        let tableHtml = '<table><tr><th>排名</th><th>姓名</th><th>猜測次數</th><th>花費時間 (秒)</th></tr>';
        rankingData.forEach((row, index) => {
            const isCurrent = row.id === highlightId;
            tableHtml += `<tr id="rank-${row.id}" class="${isCurrent ? 'current-player' : ''}"><td>${index + 1}</td><td>${row.name}</td><td>${row.guess_count}</td><td>${row.duration}</td></tr>`;
        });
        tableHtml += '</table>';
        rankingList.innerHTML = tableHtml;

        toggleRankingModal(true);

        if (highlightId) {
            const highlightRow = document.getElementById(`rank-${highlightId}`);
            if (highlightRow) {
                highlightRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

    } catch (error) {
        console.error('Failed to fetch ranking:', error);
        alert('無法獲取排行榜，請稍後再試。');
    }
}

// 創建新的歷史表格
function createNewHistoryTable(tableIndex) {
    const historyContainer = document.getElementById('historyContainer');
    
    const tableContainer = document.createElement('div');
    tableContainer.className = 'history-table-container';
    tableContainer.id = `table-container-${tableIndex}`;
    
    const tableTitle = document.createElement('h4');
    const startGuess = tableIndex * ROWS_PER_TABLE + 1;
    const endGuess = (tableIndex + 1) * ROWS_PER_TABLE;
    tableTitle.textContent = `猜測 ${startGuess}-${endGuess}`;
    
    const table = document.createElement('table');
    table.className = 'historyTable';
    table.id = `historyTable-${tableIndex}`;
    
    table.innerHTML = `
        <thead>
            <tr>
                <th>猜測</th>
                <th>結果</th>
                <th>時間(秒)</th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    `;
    
    tableContainer.appendChild(tableTitle);
    tableContainer.appendChild(table);
    historyContainer.appendChild(tableContainer);
    
    return table;
}

// 取得當前應該使用的表格
function getCurrentHistoryTable() {
    const tableIndex = Math.floor((guessCount - 1) / ROWS_PER_TABLE);
    let table = document.getElementById(`historyTable-${tableIndex}`);
    
    if (!table) {
        table = createNewHistoryTable(tableIndex);
        currentTableIndex = tableIndex;
    }
    
    return table;
}

// 顯示訊息
function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.innerHTML = `<div class="${type === 'success' ? 'success-message' : type === 'error' ? 'error-message' : 'hint'}">${text}</div>`;
}

// 添加到歷史記錄 - 修改版本支援多表格
function addToHistory(guess, a, b, time) {
    const currentTable = getCurrentHistoryTable();
    const historyTableBody = currentTable.querySelector('tbody');
    const historyRow = document.createElement('tr');

    const resultText = a === 4 ? '🎉 正確！' : `${a}A${b}B`;
    const resultClass = a === 4 ? 'correct' : 'hint';

    historyRow.innerHTML = `
        <td class="guess-number">${guess}</td>
        <td class="result ${resultClass}">${resultText}</td>
        <td>${time}</td>
    `;

    historyTableBody.appendChild(historyRow);
    
    // 滾動到最新的表格
    const tableContainer = currentTable.closest('.history-table-container');
    if (tableContainer) {
        tableContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// 清除所有歷史記錄表格
function clearAllHistoryTables() {
    const historyContainer = document.getElementById('historyContainer');
    historyContainer.innerHTML = '';
    currentTableIndex = 0;
}

// 開始新遊戲
async function newGame() {
    try {
        const response = await fetch(`${API_URL}/new_game`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ player_name: playerName }),
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const result = await response.json();
        currentGameId = result.game_id;  // Store the game UUID
        
        guessCount = 0;
        gameOver = false;
        lastGameResultId = null;
        currentTableIndex = 0;
        document.getElementById('guessCount').textContent = '0';
        document.getElementById('guessInput').value = '';
        document.getElementById('message').innerHTML = '';
        clearAllHistoryTables(); // 清除所有歷史表格
        
        clearInterval(timerInterval);
        startTime = Date.now();
        document.getElementById('timer').textContent = '0';
        timerInterval = setInterval(() => {
            const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
            document.getElementById('timer').textContent = elapsedSeconds;
        }, 1000);

    } catch (error) {
        showMessage('無法開始新遊戲，請檢查後端服務是否啟動。', 'error');
    }
}

// 監聽Enter鍵
document.getElementById('guessInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        makeGuess();
    }
});

