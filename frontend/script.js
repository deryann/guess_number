// 動態檢測 API URL，自動適應當前環境
const API_URL = window.location.origin;
let guessCount = 0;

// ===== 符號設定 =====
const DEFAULT_SYMBOLS = { a: 'A', b: 'B' };
const SYMBOL_PRESETS = [
    { a: 'A', b: 'B', name: '經典' },
    { a: '🎯', b: '🔄', name: '目標' },
    { a: '✅', b: '🔶', name: '勾選' },
    { a: '🟢', b: '🟡', name: '圓點' },
    { a: '⭐', b: '💫', name: '星星' },
    { a: '🔥', b: '💨', name: '火焰' },
];

function getSymbolSettings() {
    const saved = localStorage.getItem('guessNumberSymbols');
    return saved ? JSON.parse(saved) : DEFAULT_SYMBOLS;
}

function saveSymbolSettings(aSymbol, bSymbol) {
    localStorage.setItem('guessNumberSymbols', JSON.stringify({ a: aSymbol, b: bSymbol }));
}

function toggleSettingsModal(show) {
    const modal = document.getElementById('settings-modal');
    if (show) {
        const symbols = getSymbolSettings();
        document.getElementById('symbolA').value = symbols.a;
        document.getElementById('symbolB').value = symbols.b;
    }
    modal.style.display = show ? 'block' : 'none';
}

function applyPreset(index) {
    const preset = SYMBOL_PRESETS[index];
    document.getElementById('symbolA').value = preset.a;
    document.getElementById('symbolB').value = preset.b;
}

function saveSettings() {
    const aSymbol = document.getElementById('symbolA').value.trim() || 'A';
    const bSymbol = document.getElementById('symbolB').value.trim() || 'B';
    saveSymbolSettings(aSymbol, bSymbol);
    toggleSettingsModal(false);
    refreshHistoryDisplay();
    updateRulesDisplay();
    showMessage(i18n.t('messages.settingsSaved'), 'success');
}

function resetSettings() {
    document.getElementById('symbolA').value = DEFAULT_SYMBOLS.a;
    document.getElementById('symbolB').value = DEFAULT_SYMBOLS.b;
}

function refreshHistoryDisplay() {
    // 重新渲染所有歷史記錄以套用新符號
    const symbols = getSymbolSettings();
    document.querySelectorAll('.historyTable tbody tr').forEach(row => {
        const resultCell = row.querySelector('.result');
        if (resultCell && !resultCell.classList.contains('correct')) {
            const text = resultCell.textContent;
            const match = text.match(/(\d+)[^\d]+(\d+)/);
            if (match) {
                resultCell.textContent = `${match[1]}${symbols.a}${match[2]}${symbols.b}`;
            }
        }
    });
}

function updateRulesDisplay() {
    // 根據目前的符號設定更新遊戲規則說明
    const symbols = getSymbolSettings();

    // 更新所有 symbol-a 元素
    document.querySelectorAll('.symbol-a').forEach(el => {
        el.textContent = symbols.a;
    });

    // 更新所有 symbol-b 元素
    document.querySelectorAll('.symbol-b').forEach(el => {
        el.textContent = symbols.b;
    });

    // 更新所有 symbol-win 元素 (4A0B)
    document.querySelectorAll('.symbol-win').forEach(el => {
        el.textContent = `4${symbols.a}0${symbols.b}`;
    });
}
let gameOver = false;
let timerInterval;
let startTime;
let playerName = "";
let lastGameResultId = null;
let currentGameId = null;  // Store the current game UUID
let currentTableIndex = 0;  // 當前表格索引
const ROWS_PER_TABLE = 5;   // 每個表格最多顯示的行數
let isPaused = false;  // 暫停狀態
let timerStarted = false;  // 計時器是否已開始
let pausedTime = 0;  // 暫停時累積的時間（毫秒）
let lastPauseTime = 0;  // 最後一次暫停的時間點

// Load version information when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize i18n first
    i18n.init();

    loadVersionInfo();
    initializeTheme();
    updateRulesDisplay();
});

// Listen for language changes to update dynamic content
window.addEventListener('languageChanged', function() {
    // Update dynamic elements that aren't covered by data-i18n
    updateTimerDisplay();
    updatePauseButton();
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

// Generate ranking table HTML safely to prevent XSS
function createRankingTable(rankingData, includeIdColumn = false) {
    const table = document.createElement('table');

    // Create header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = [
        i18n.t('ranking.headerRank'),
        i18n.t('ranking.headerName'),
        i18n.t('ranking.headerGuessCount'),
        i18n.t('ranking.headerDuration')
    ];
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create body
    const tbody = document.createElement('tbody');
    rankingData.forEach((row, index) => {
        const tr = document.createElement('tr');
        if (includeIdColumn && row.id) {
            tr.id = `rank-${row.id}`;
        }

        // Rank
        const tdRank = document.createElement('td');
        tdRank.textContent = index + 1;
        tr.appendChild(tdRank);

        // Name (safely escaped)
        const tdName = document.createElement('td');
        tdName.textContent = row.name;
        tr.appendChild(tdName);

        // Guess count
        const tdGuessCount = document.createElement('td');
        tdGuessCount.textContent = row.guess_count;
        tr.appendChild(tdGuessCount);

        // Duration
        const tdDuration = document.createElement('td');
        tdDuration.textContent = row.duration;
        tr.appendChild(tdDuration);

        tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    return table;
}

function startGame() {
    playerName = document.getElementById('playerName').value;
    if (!playerName) {
        alert(i18n.t('messages.enterName'));
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
    const settingsModal = document.getElementById('settings-modal');
    if (event.target == rulesModal) {
        toggleRulesModal(false);
    }
    if (event.target == rankingModal) {
        toggleRankingModal(false);
    }
    if (event.target == settingsModal) {
        toggleSettingsModal(false);
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
        return i18n.t('messages.enterFourDigits');
    }
    if (!/^\d{4}$/.test(input)) {
        return i18n.t('messages.digitsOnly');
    }
    const digits = input.split('');
    const uniqueDigits = [...new Set(digits)];
    if (uniqueDigits.length !== 4) {
        return i18n.t('messages.noRepeat');
    }
    return null;
}

// 進行猜測
async function makeGuess() {
    if (gameOver) return;
    
    // 檢查是否暫停中
    if (isPaused) {
        showMessage(i18n.t('messages.gameIsPaused'), 'error');
        return;
    }

    if (!currentGameId) {
        showMessage(i18n.t('messages.startNewGame'), 'error');
        return;
    }

    let input = document.getElementById('guessInput').value;
    input = convertToHalfWidth(input);

    const errorMsg = validateInput(input);
    if (errorMsg) {
        showMessage(errorMsg, 'error');
        return;
    }
    
    // 在第一次猜測時開始計時
    if (!timerStarted) {
        startTimer();
        // Show surrender button after first guess
        document.getElementById('surrenderButton').style.display = 'inline-block';
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
        const elapsedSeconds = Math.round((Date.now() - startTime - pausedTime) / 1000);
        addToHistory(input, result.a, result.b, elapsedSeconds);

        if (result.game_completed) {
            gameOver = true;
            clearInterval(timerInterval);
            updatePauseButton(); // 遊戲結束時禁用暫停按鈕
            document.getElementById('surrenderButton').style.display = 'none'; // Hide surrender button
            lastGameResultId = result.ranking_id;
            const congratsMsg = i18n.t('messages.congratulations', {
                playerName: playerName,
                guessCount: result.guess_count,
                duration: Math.round(result.duration)
            });
            showMessage(`🎉 ${congratsMsg}`, 'success');
            showVictoryAnimation(result.guess_count, Math.round(result.duration));
        } else {
            const symbols = getSymbolSettings();
            const resultMsg = i18n.t('messages.resultKeepGoing', {
                a: result.a,
                symbolA: symbols.a,
                b: result.b,
                symbolB: symbols.b
            });
            showMessage(resultMsg, 'hint');
        }
    } catch (error) {
        showMessage(i18n.t('messages.errorOccurred'), 'error');
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
        
        // Clear existing content
        rankingList.innerHTML = '';
        
        // Create and append table
        const table = createRankingTable(rankingData, true);
        rankingList.appendChild(table);
        
        // Apply highlighting if needed
        if (highlightId) {
            const rows = table.querySelectorAll('tbody tr');
            rankingData.forEach((row, index) => {
                if (row.id === highlightId) {
                    rows[index].classList.add('current-player');
                }
            });
        }

        toggleRankingModal(true);

        if (highlightId) {
            const highlightRow = document.getElementById(`rank-${highlightId}`);
            if (highlightRow) {
                highlightRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

    } catch (error) {
        console.error('Failed to fetch ranking:', error);
        alert(i18n.t('messages.cannotGetRanking'));
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
    tableTitle.textContent = i18n.t('history.guessRange', { start: startGuess, end: endGuess });

    const table = document.createElement('table');
    table.className = 'historyTable';
    table.id = `historyTable-${tableIndex}`;

    table.innerHTML = `
        <thead>
            <tr>
                <th>${i18n.t('history.headerGuess')}</th>
                <th>${i18n.t('history.headerResult')}</th>
                <th>${i18n.t('history.headerTime')}</th>
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

    const symbols = getSymbolSettings();
    const resultText = a === 4 ? `🎉 ${i18n.t('history.correct')}` : `${a}${symbols.a}${b}${symbols.b}`;
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
        
        // 重置計時器狀態
        clearInterval(timerInterval);
        timerStarted = false;
        isPaused = false;
        pausedTime = 0;
        lastPauseTime = 0;
        document.getElementById('timer').textContent = `0 ${i18n.t('messages.waitingForFirstGuess')}`;
        updatePauseButton();

        // 啟用輸入框
        document.getElementById('guessInput').disabled = false;

        // Hide surrender button until first guess
        document.getElementById('surrenderButton').style.display = 'none';

    } catch (error) {
        showMessage(i18n.t('messages.cannotStartNewGame'), 'error');
    }
}

// 投降功能
async function surrenderGame() {
    if (gameOver) return;

    if (!currentGameId) {
        showMessage(i18n.t('messages.startNewGame'), 'error');
        return;
    }

    // Confirm surrender
    if (!confirm(i18n.t('messages.confirmSurrender'))) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/surrender/${currentGameId}`, {
            method: 'POST',
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const result = await response.json();
        
        // Mark game as over
        gameOver = true;
        clearInterval(timerInterval);
        updatePauseButton();
        document.getElementById('surrenderButton').style.display = 'none';
        document.getElementById('guessInput').disabled = true;
        
        // Color code all previous guesses
        colorCodeGuesses(result.answer, result.history);

        // Show the correct answer
        showMessage(i18n.t('messages.surrenderAnswer', { answer: result.answer }), 'error');

    } catch (error) {
        showMessage(i18n.t('messages.surrenderFailed'), 'error');
        console.error('Surrender error:', error);
    }
}

// 為猜測結果著色
function colorCodeGuesses(answer, history) {
    // Use history to ensure we color the correct guesses
    const guessRows = document.querySelectorAll('.historyTable tbody tr');
    
    history.forEach((historyItem, index) => {
        if (index >= guessRows.length) return;
        
        const row = guessRows[index];
        const guessCell = row.querySelector('.guess-number');
        if (!guessCell) return;
        
        const guess = historyItem.guess;
        
        // Track which answer digits have been matched to avoid double-counting
        const answerUsed = [false, false, false, false];
        const guessStatus = ['gray', 'gray', 'gray', 'gray']; // default to gray
        
        // First pass: Mark exact matches (green)
        for (let i = 0; i < 4; i++) {
            if (guess[i] === answer[i]) {
                guessStatus[i] = 'green';
                answerUsed[i] = true;
            }
        }
        
        // Second pass: Mark correct digits in wrong positions (red)
        for (let i = 0; i < 4; i++) {
            if (guessStatus[i] === 'gray') { // Only check non-green positions
                for (let j = 0; j < 4; j++) {
                    if (!answerUsed[j] && guess[i] === answer[j]) {
                        guessStatus[i] = 'red';
                        answerUsed[j] = true;
                        break;
                    }
                }
            }
        }
        
        // Create colored version of the guess
        let coloredGuess = '';
        for (let i = 0; i < 4; i++) {
            let color;
            if (guessStatus[i] === 'green') {
                color = '#4ade80'; // Green - correct position
            } else if (guessStatus[i] === 'red') {
                color = '#f87171'; // Red - correct digit, wrong position
            } else {
                color = '#6b7280'; // Dark gray - wrong digit
            }
            coloredGuess += `<span style="color: ${color}; font-weight: bold;">${guess[i]}</span>`;
        }
        
        guessCell.innerHTML = coloredGuess;
    });
}

// 開始計時器
function startTimer() {
    if (timerStarted) return;

    timerStarted = true;
    startTime = Date.now();
    pausedTime = 0;

    timerInterval = setInterval(() => {
        if (!isPaused) {
            updateTimerDisplay();
        }
    }, 1000);

    // 立即更新顯示
    document.getElementById('timer').textContent = `0${i18n.t('messages.seconds')}`;

    // 啟用暫停按鈕
    updatePauseButton();
}

// 更新計時器顯示
function updateTimerDisplay() {
    if (!timerStarted) return;
    const elapsedSeconds = Math.round((Date.now() - startTime - pausedTime) / 1000);
    document.getElementById('timer').textContent = `${elapsedSeconds}${i18n.t('messages.seconds')}`;
}

// 切換暫停/恢復
function togglePause() {
    if (!timerStarted) {
        showMessage(i18n.t('messages.startGameFirst'), 'error');
        return;
    }

    if (gameOver) {
        showMessage(i18n.t('messages.gameEnded'), 'error');
        return;
    }

    isPaused = !isPaused;

    if (isPaused) {
        // 暫停：記錄暫停時間
        lastPauseTime = Date.now();
        document.getElementById('guessInput').disabled = true;
        showMessage(`⏸️ ${i18n.t('messages.gamePaused')}`, 'hint');
    } else {
        // 恢復：累加暫停時間
        pausedTime += Date.now() - lastPauseTime;
        document.getElementById('guessInput').disabled = false;
        showMessage(`▶️ ${i18n.t('messages.gameResumed')}`, 'hint');
    }

    updatePauseButton();
}

// 更新暫停按鈕的顯示狀態
function updatePauseButton() {
    const pauseButton = document.getElementById('pauseButton');
    const pauseButtonText = document.getElementById('pauseButtonText');
    if (!pauseButton) return;

    if (isPaused) {
        if (pauseButtonText) {
            pauseButtonText.textContent = i18n.t('game.resumeButton');
        }
        pauseButton.querySelector('.emoji-icon').textContent = '▶️';
        pauseButton.classList.add('paused');
    } else {
        if (pauseButtonText) {
            pauseButtonText.textContent = i18n.t('game.pauseButton');
        }
        pauseButton.querySelector('.emoji-icon').textContent = '⏸️';
        pauseButton.classList.remove('paused');
    }

    // 如果計時器還沒開始，禁用按鈕
    pauseButton.disabled = !timerStarted || gameOver;
}

// 監聽Enter鍵
document.getElementById('guessInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        makeGuess();
    }
});

// Hint functionality
async function showHint(position) {
    if (!currentGameId) {
        showMessage(i18n.t('messages.startNewGame'), 'error');
        return;
    }

    if (gameOver) {
        showMessage(i18n.t('messages.gameEnded'), 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/hint/${currentGameId}/${position}`);

        if (!response.ok) {
            throw new Error('Failed to get hint');
        }

        const result = await response.json();
        displayHint(result.position, result.digit);
    } catch (error) {
        showMessage(i18n.t('messages.cannotGetHint'), 'error');
        console.error('Error getting hint:', error);
    }
}

function displayHint(position, digit) {
    const hintModal = document.getElementById('hint-modal');
    const hintDisplay = document.getElementById('hint-display');

    hintDisplay.innerHTML = `
        <p class="hint-position">${i18n.t('hint.positionLabel', { position: position })}</p>
        <p class="hint-digit">${digit}</p>
    `;

    hintModal.style.display = 'block';
}

function closeHintModal() {
    const hintModal = document.getElementById('hint-modal');
    hintModal.style.display = 'none';
}

// Keyboard event listener for hint hotkeys
// Use Alt/Option + 1-4 for cross-platform compatibility (works on both Windows and Mac)
document.addEventListener('keydown', function(e) {
    // Check if Alt/Option key is pressed along with number keys 1-4
    if (e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        const key = e.key;
        // Handle both regular number keys and numpad keys
        const numMatch = key.match(/^[1-4]$/);
        if (numMatch) {
            e.preventDefault(); // Prevent default browser behavior
            const position = parseInt(key);
            showHint(position);
        }
    }
});

// Victory Animation Constants
const ANIMATION_COLORS = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#ff1493'];
const FADE_DURATION_MS = 300;
const CONFETTI_COUNT = 100;
const CONFETTI_CLEANUP_MS = 5000;
const FIREWORK_PARTICLE_COUNT = 30;
const FIREWORK_CLEANUP_MS = 1000;

// Victory Animation Functions
function showVictoryAnimation(guessCount, duration) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'victory-overlay';
    overlay.id = 'victory-overlay';

    // Create content
    const content = document.createElement('div');
    content.className = 'victory-content';
    content.innerHTML = `
        <div class="trophy">🏆</div>
        <h2>🎉 ${i18n.t('victory.title')} 🎉</h2>
        <div class="victory-stats">
            <p>${i18n.t('victory.playerLabel')}${playerName}</p>
            <p>${i18n.t('victory.guessCountLabel')}${guessCount}${i18n.t('victory.guessCountSuffix')}</p>
            <p>${i18n.t('victory.durationLabel')}${duration}${i18n.t('victory.durationSuffix')}</p>
        </div>
        <button class="victory-button" onclick="closeVictoryAnimation()">${i18n.t('victory.viewRankingButton')}</button>
        <button class="victory-button" onclick="closeVictoryAndNewGame()">${i18n.t('victory.playAgainButton')}</button>
    `;
    
    overlay.appendChild(content);
    document.body.appendChild(overlay);
    
    // Create confetti
    createConfetti();
    
    // Create fireworks
    setTimeout(() => createFireworks(), 300);
    setTimeout(() => createFireworks(), 600);
    setTimeout(() => createFireworks(), 900);
}

function createConfetti() {
    for (let i = 0; i < CONFETTI_COUNT; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = -10 + 'px';
        confetti.style.backgroundColor = ANIMATION_COLORS[Math.floor(Math.random() * ANIMATION_COLORS.length)];
        confetti.style.animation = `confettiFall ${2 + Math.random() * 3}s linear forwards`;
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        
        document.body.appendChild(confetti);
        
        // Remove after animation
        setTimeout(() => {
            if (confetti.parentNode) {
                confetti.parentNode.removeChild(confetti);
            }
        }, CONFETTI_CLEANUP_MS);
    }
}

function createFireworks() {
    const centerX = window.innerWidth * (0.2 + Math.random() * 0.6);
    const centerY = window.innerHeight * (0.2 + Math.random() * 0.4);
    
    for (let i = 0; i < FIREWORK_PARTICLE_COUNT; i++) {
        const particle = document.createElement('div');
        particle.className = 'firework';
        particle.style.backgroundColor = ANIMATION_COLORS[Math.floor(Math.random() * ANIMATION_COLORS.length)];
        particle.style.left = centerX + 'px';
        particle.style.top = centerY + 'px';
        
        const angle = (Math.PI * 2 * i) / FIREWORK_PARTICLE_COUNT;
        const velocity = 100 + Math.random() * 100;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;
        
        particle.style.setProperty('--tx', tx + 'px');
        particle.style.setProperty('--ty', ty + 'px');
        particle.style.animation = `fireworkExplode 1s ease-out forwards`;
        
        document.body.appendChild(particle);
        
        // Remove after animation
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, FIREWORK_CLEANUP_MS);
    }
}

function closeOverlayWithAnimation(callback) {
    const overlay = document.getElementById('victory-overlay');
    if (overlay) {
        overlay.style.animation = `fadeOut ${FADE_DURATION_MS}ms ease-out`;
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
            if (callback) callback();
        }, FADE_DURATION_MS);
    }
}

function closeVictoryAnimation() {
    closeOverlayWithAnimation(() => showRanking(lastGameResultId));
}

function closeVictoryAndNewGame() {
    closeOverlayWithAnimation(() => newGame());
}

// ===== 主題切換功能 =====
function initializeTheme() {
    // 從 localStorage 載入已儲存的主題
    const savedTheme = localStorage.getItem('guessNumberTheme') || 'original';
    applyTheme(savedTheme);
    
    // 設定主題按鈕的事件監聽器（只在按鈕存在時）
    const themeButtons = document.querySelectorAll('.theme-btn');
    if (themeButtons.length > 0) {
        themeButtons.forEach(button => {
            button.addEventListener('click', function() {
                const theme = this.getAttribute('data-theme');
                applyTheme(theme);
                saveTheme(theme);
            });
        });
    }
}

function applyTheme(theme) {
    const body = document.body;
    
    // 移除所有主題類別
    body.classList.remove('dark-theme', 'special-theme');
    
    // 套用選擇的主題
    if (theme === 'dark') {
        body.classList.add('dark-theme');
    } else if (theme === 'special') {
        body.classList.add('special-theme');
    }
    
    // 更新按鈕的 active 狀態
    const themeButtons = document.querySelectorAll('.theme-btn');
    themeButtons.forEach(button => {
        if (button.getAttribute('data-theme') === theme) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

function saveTheme(theme) {
    localStorage.setItem('guessNumberTheme', theme);
}

// ===== Compact Dropdown Functions =====
function toggleDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    const isOpen = dropdown.classList.contains('open');

    // Close all dropdowns first
    closeAllDropdowns();

    // Toggle the clicked dropdown
    if (!isOpen) {
        dropdown.classList.add('open');
    }
}

function closeAllDropdowns() {
    document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('open'));
}

function selectLanguage(langCode) {
    i18n.setLanguage(langCode);
    closeAllDropdowns();
}

function selectTheme(theme) {
    applyTheme(theme);
    saveTheme(theme);
    closeAllDropdowns();
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(event) {
    if (!event.target.closest('.dropdown')) {
        closeAllDropdowns();
    }
});

