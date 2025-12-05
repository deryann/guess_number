// 管理員後台 JavaScript 功能

// 全域變數
let currentEditingId = null;
let currentDeletingId = null;
let rankings = [];

// 動態檢測 API URL
function getApiUrl() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:12527';
    } else {
        return window.location.origin;
    }
}

const API_URL = getApiUrl();

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    // 檢查是否已經登入
    checkAuthStatus();
    
    // 綁定登入表單事件
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // 綁定編輯表單事件
    document.getElementById('editForm').addEventListener('submit', handleEditSubmit);
    
    // 綁定 ESC 鍵關閉模態框
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeEditModal();
            closeDeleteModal();
        }
    });
});

// 檢查認證狀態
function checkAuthStatus() {
    const sessionToken = getCookie('admin_session');
    if (sessionToken) {
        showAdminPanel();
        loadRankings();
    } else {
        showLoginPanel();
    }
}

// 顯示登入面板
function showLoginPanel() {
    document.getElementById('login-container').style.display = 'block';
    document.getElementById('admin-container').style.display = 'none';
}

// 顯示管理員面板
function showAdminPanel() {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('admin-container').style.display = 'block';
}

// 處理登入
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('loginMessage');
    
    try {
        const response = await fetch(`${API_URL}/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // 設置 cookie
            setCookie('admin_session', data.session_token, 1);
            
            // 顯示成功訊息
            messageDiv.className = 'message-success';
            messageDiv.textContent = '登入成功！';
            
            // 切換到管理員面板
            setTimeout(() => {
                showAdminPanel();
                loadRankings();
            }, 1000);
        } else {
            throw new Error(data.detail || '登入失敗');
        }
    } catch (error) {
        messageDiv.className = 'message-error';
        messageDiv.textContent = error.message || '登入失敗，請檢查網路連線';
    }
}

// 登出
async function logout() {
    try {
        await fetch(`${API_URL}/admin/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error('登出請求失敗:', error);
    }
    
    // 清除 cookie
    setCookie('admin_session', '', -1);
    
    // 顯示登入面板
    showLoginPanel();
    
    // 清空表單
    document.getElementById('loginForm').reset();
    document.getElementById('loginMessage').textContent = '';
}

// 載入排名資料
async function loadRankings() {
    try {
        const sessionToken = getCookie('admin_session');
        const response = await fetch(`${API_URL}/admin/rankings`, {
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${sessionToken}`
            }
        });
        
        if (response.status === 401) {
            // 未授權，返回登入頁面
            logout();
            return;
        }
        
        if (!response.ok) {
            throw new Error('載入排名資料失敗');
        }
        
        rankings = await response.json();
        renderRankingsTable();
    } catch (error) {
        console.error('載入排名資料失敗:', error);
        alert('載入排名資料失敗，請重新整理頁面');
    }
}

// 渲染排名表格
function renderRankingsTable() {
    const tbody = document.getElementById('rankingsTableBody');
    tbody.innerHTML = '';
    
    rankings.forEach(ranking => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${ranking.id}</td>
            <td>${ranking.name}</td>
            <td>${formatDateTime(ranking.start_time)}</td>
            <td>${formatDateTime(ranking.end_time)}</td>
            <td>${ranking.duration.toFixed(1)}</td>
            <td>${ranking.guess_count}</td>
            <td>
                <div class="action-buttons">
                    <button class="edit-btn" onclick="editRanking(${ranking.id})">編輯</button>
                    <button class="delete-btn" onclick="deleteRanking(${ranking.id})">刪除</button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// 編輯排名
function editRanking(id) {
    const ranking = rankings.find(r => r.id === id);
    if (!ranking) return;
    
    currentEditingId = id;
    
    // 填充表單
    document.getElementById('editId').value = id;
    document.getElementById('editName').value = ranking.name;
    document.getElementById('editStartTime').value = formatDateTimeForInput(ranking.start_time);
    document.getElementById('editEndTime').value = formatDateTimeForInput(ranking.end_time);
    document.getElementById('editDuration').value = ranking.duration;
    document.getElementById('editGuessCount').value = ranking.guess_count;
    
    // 顯示模態框
    document.getElementById('editModal').style.display = 'block';
}

// 處理編輯提交
async function handleEditSubmit(event) {
    event.preventDefault();
    
    const id = document.getElementById('editId').value;
    const name = document.getElementById('editName').value.trim();
    const startTime = document.getElementById('editStartTime').value;
    const endTime = document.getElementById('editEndTime').value;
    const duration = parseFloat(document.getElementById('editDuration').value);
    const guessCount = parseInt(document.getElementById('editGuessCount').value);
    
    // 前端驗證
    const validationError = validateRankingData(name, startTime, endTime, duration, guessCount);
    if (validationError) {
        alert(validationError);
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/admin/rankings/${id}`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getCookie('admin_session')}`
            },
            body: JSON.stringify({
                name,
                start_time: formatDateTimeForAPI(startTime),
                end_time: formatDateTimeForAPI(endTime),
                duration,
                guess_count: guessCount
            })
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || '更新失敗');
        }
        
        // 成功更新
        closeEditModal();
        loadRankings();
        showMessage('排名記錄更新成功！', 'success');
    } catch (error) {
        console.error('更新失敗:', error);
        showMessage(error.message || '更新失敗，請重試', 'error');
    }
}

// 刪除排名
function deleteRanking(id) {
    currentDeletingId = id;
    document.getElementById('deleteModal').style.display = 'block';
}

// 確認刪除
async function confirmDelete() {
    if (!currentDeletingId) return;
    
    try {
        const response = await fetch(`${API_URL}/admin/rankings/${currentDeletingId}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${getCookie('admin_session')}`
            }
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        if (!response.ok) {
            throw new Error('刪除失敗');
        }
        
        // 成功刪除
        closeDeleteModal();
        loadRankings();
        alert('排名記錄刪除成功！');
    } catch (error) {
        console.error('刪除失敗:', error);
        alert('刪除失敗，請重試');
    }
}

// 關閉編輯模態框
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    document.getElementById('editForm').reset();
    currentEditingId = null;
}

// 關閉刪除模態框
function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    currentDeletingId = null;
}

// 格式化日期時間顯示
function formatDateTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// 格式化日期時間給 input[type="datetime-local"]
function formatDateTimeForInput(isoString) {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hour}:${minute}`;
}

// 格式化日期時間給 API
function formatDateTimeForAPI(dateTimeLocal) {
    return new Date(dateTimeLocal).toISOString();
}

// Cookie 操作函數
function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// 資料驗證函數
function validateRankingData(name, startTime, endTime, duration, guessCount) {
    if (!name) {
        return '玩家姓名不能為空';
    }
    
    if (name.length > 50) {
        return '玩家姓名不能超過50個字元';
    }
    
    if (!startTime || !endTime) {
        return '開始時間和結束時間都不能為空';
    }
    
    if (isNaN(duration) || duration <= 0) {
        return '遊戲時長必須是大於0的數字';
    }
    
    if (duration > 86400) { // 24小時
        return '遊戲時長不能超過24小時';
    }
    
    if (isNaN(guessCount) || guessCount <= 0) {
        return '猜測次數必須是大於0的整數';
    }
    
    if (guessCount > 1000) {
        return '猜測次數不能超過1000次';
    }
    
    if (new Date(startTime) >= new Date(endTime)) {
        return '結束時間必須晚於開始時間';
    }
    
    // 檢查日期是否在合理範圍內
    const now = new Date();
    const maxDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 一年後
    const minDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // 一年前
    
    if (new Date(startTime) > maxDate || new Date(endTime) > maxDate) {
        return '日期不能超過一年後';
    }
    
    if (new Date(startTime) < minDate || new Date(endTime) < minDate) {
        return '日期不能早於一年前';
    }
    
    return null; // 無錯誤
}

// 顯示訊息函數
function showMessage(message, type = 'info') {
    // 移除現有的訊息
    const existingMessage = document.querySelector('.admin-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // 創建新的訊息元素
    const messageDiv = document.createElement('div');
    messageDiv.className = `admin-message message-${type}`;
    messageDiv.textContent = message;
    
    // 添加到頁面頂部
    const adminContent = document.querySelector('.admin-content');
    adminContent.insertBefore(messageDiv, adminContent.firstChild);
    
    // 3秒後自動移除
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 3000);
}

// 點擊模態框外部關閉
window.onclick = function(event) {
    const editModal = document.getElementById('editModal');
    const deleteModal = document.getElementById('deleteModal');
    
    if (event.target === editModal) {
        closeEditModal();
    }
    
    if (event.target === deleteModal) {
        closeDeleteModal();
    }
}