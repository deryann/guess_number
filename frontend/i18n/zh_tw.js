/**
 * Traditional Chinese (繁體中文) Language Pack
 */

i18n.registerLanguage('zh_tw', {
    // Page title
    pageTitle: '猜數字遊戲',

    // Start screen
    startScreen: {
        title: '猜數字遊戲',
        subtitle: '經典的邏輯推理遊戲',
        playerNamePlaceholder: '請輸入您的姓名',
        startButton: '開始遊戲',
        rankingButton: '查看排行榜',
        adminLink: '管理員入口'
    },

    // Game rules
    rules: {
        title: '遊戲規則：',
        rule1: '系統會隨機產生一個4位數字（0-9，不重複）',
        rule2: '你需要猜出這個數字的正確順序',
        rule3_prefix: '',
        rule3_suffix: '：數字和位置都正確的個數',
        rule4_prefix: '',
        rule4_suffix: '：數字正確但位置錯誤的個數',
        rule5_prefix: '當你得到 ',
        rule5_suffix: ' 時就獲勝了！'
    },

    // Theme switcher
    theme: {
        title: '主題切換',
        original: '原版模式',
        dark: '暗黑模式',
        special: '特殊配色'
    },

    // Language switcher
    language: {
        title: '語言'
    },

    // Game screen
    game: {
        title: '猜數字',
        player: '玩家：',
        guessCount: '目前猜測次數：',
        elapsedTime: '經過時間：',
        pauseButton: '暫停',
        resumeButton: '繼續',
        guessInputPlaceholder: '輸入4位數字 (支援全形/半形)',
        guessButton: '猜測',
        surrenderButton: '投降',
        newGameButton: '新遊戲',
        settingsTitle: '符號設定'
    },

    // History table
    history: {
        guessRange: '猜測 {start}-{end}',
        headerGuess: '猜測',
        headerResult: '結果',
        headerTime: '時間(秒)',
        correct: '正確！'
    },

    // Ranking
    ranking: {
        title: '排行榜 (TOP 10)',
        headerRank: '排名',
        headerName: '姓名',
        headerGuessCount: '猜測次數',
        headerDuration: '花費時間 (秒)'
    },

    // Settings modal
    settings: {
        title: '符號設定',
        description: '自訂遊戲結果顯示的符號，讓遊戲更有個人風格！',
        symbolALabel: '正確位置符號：',
        symbolBLabel: '錯誤位置符號：',
        presetTitle: '快速選擇：',
        presetClassic: 'A/B 經典',
        presetTarget: '目標',
        presetCheck: '勾選',
        presetDot: '圓點',
        presetStar: '星星',
        presetFlame: '火焰',
        saveButton: '儲存設定',
        resetButton: '恢復預設'
    },

    // Hint modal
    hint: {
        title: '提示',
        positionLabel: '第 {position} 位數字'
    },

    // Victory screen
    victory: {
        title: '恭喜過關！',
        playerLabel: '玩家：',
        guessCountLabel: '猜測次數：',
        guessCountSuffix: ' 次',
        durationLabel: '花費時間：',
        durationSuffix: ' 秒',
        viewRankingButton: '查看排行榜',
        playAgainButton: '再來一局'
    },

    // Messages
    messages: {
        enterName: '請輸入您的姓名！',
        enterFourDigits: '請輸入4位數字！',
        digitsOnly: '請只輸入數字！',
        noRepeat: '數字不能重複！',
        settingsSaved: '設定已儲存！',
        gamePaused: '遊戲已暫停',
        gameResumed: '遊戲已恢復',
        gameIsPaused: '遊戲已暫停，請先恢復遊戲。',
        startNewGame: '請先開始新遊戲。',
        startGameFirst: '請先開始遊戲並進行第一次猜測。',
        gameEnded: '遊戲已結束。',
        congratulations: '恭喜 {playerName}！你猜對了！你總共猜了 {guessCount} 次，花了 {duration} 秒。',
        resultKeepGoing: '結果：{a}{symbolA}{b}{symbolB}，繼續加油！',
        errorOccurred: '發生錯誤，請稍後再試。',
        cannotStartNewGame: '無法開始新遊戲，請檢查後端服務是否啟動。',
        confirmSurrender: '確定要投降嗎？投降後將不會計入排名。',
        surrenderAnswer: '正確答案是：{answer}。遊戲結束（未計入排名）。',
        surrenderFailed: '投降失敗，請稍後再試。',
        cannotGetRanking: '無法獲取排行榜，請稍後再試。',
        cannotGetHint: '無法獲取提示，請稍後再試。',
        waitingForFirstGuess: '(輸入第一組數字後開始計時)',
        seconds: ' 秒'
    },

    // Footer
    footer: {
        version: '版本：',
        loading: '載入中...'
    }
});
