
const API_URL = 'http://127.0.0.1:8000';
let guessCount = 0;
let gameOver = false;

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
            body: JSON.stringify({ number: input }),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const result = await response.json();
        guessCount++;
        document.getElementById('guessCount').textContent = guessCount;
        addToHistory(input, result.a, result.b);

        if (result.a === 4) {
            gameOver = true;
            showMessage(`🎉 恭喜你！你猜對了！你總共猜了 ${guessCount} 次。`, 'success');
        } else {
            showMessage(`結果：${result.a}A${result.b}B，繼續加油！`, 'hint');
        }
    } catch (error) {
        showMessage('發生錯誤，請稍後再試。', 'error');
    }

    document.getElementById('guessInput').value = '';
}

// 顯示訊息
function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.innerHTML = `<div class="${type === 'success' ? 'success-message' : type === 'error' ? 'error-message' : 'hint'}">${text}</div>`;
}

// 添加到歷史記錄
function addToHistory(guess, a, b) {
    const historyList = document.getElementById('historyList');
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';

    const resultText = a === 4 ? '🎉 正確！' : `${a}A${b}B`;
    const resultClass = a === 4 ? 'correct' : 'hint';

    historyItem.innerHTML = `
        <span class="guess-number">${guess}</span>
        <span class="result ${resultClass}">${resultText}</span>
    `;

    historyList.appendChild(historyItem);
}

// 開始新遊戲
async function newGame() {
    try {
        await fetch(`${API_URL}/new_game`, { method: 'POST' });
        guessCount = 0;
        gameOver = false;
        document.getElementById('guessCount').textContent = '0';
        document.getElementById('guessInput').value = '';
        document.getElementById('message').innerHTML = '';
        document.getElementById('historyList').innerHTML = '';
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

// 開始遊戲
window.onload = newGame;
