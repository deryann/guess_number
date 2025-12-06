/**
 * English Language Pack
 */

i18n.registerLanguage('en', {
    // Page title
    pageTitle: 'Number Guessing Game',

    // Start screen
    startScreen: {
        title: 'Number Guessing Game',
        subtitle: 'Classic Logic Puzzle Game',
        playerNamePlaceholder: 'Enter your name',
        startButton: 'Start Game',
        rankingButton: 'View Rankings',
        adminLink: 'Admin'
    },

    // Game rules
    rules: {
        title: 'Game Rules:',
        rule1: 'The system generates a 4-digit number (0-9, no repeats)',
        rule2: 'You need to guess the correct sequence',
        rule3_prefix: '',
        rule3_suffix: ': Correct digit in correct position',
        rule4_prefix: '',
        rule4_suffix: ': Correct digit in wrong position',
        rule5_prefix: 'You win when you get ',
        rule5_suffix: '!'
    },

    // Theme switcher
    theme: {
        title: 'Theme',
        original: 'Classic',
        dark: 'Dark Mode',
        special: 'Special'
    },

    // Language switcher
    language: {
        title: 'Language'
    },

    // Game screen
    game: {
        title: 'Guess Number',
        player: 'Player: ',
        guessCount: 'Guess Count: ',
        elapsedTime: 'Elapsed Time: ',
        pauseButton: 'Pause',
        resumeButton: 'Resume',
        guessInputPlaceholder: 'Enter 4 digits',
        guessButton: 'Guess',
        surrenderButton: 'Give Up',
        newGameButton: 'New Game',
        settingsTitle: 'Symbol Settings'
    },

    // History table
    history: {
        guessRange: 'Guess {start}-{end}',
        headerGuess: 'Guess',
        headerResult: 'Result',
        headerTime: 'Time(s)',
        correct: 'Correct!'
    },

    // Ranking
    ranking: {
        title: 'Rankings (TOP 10)',
        headerRank: 'Rank',
        headerName: 'Name',
        headerGuessCount: 'Guesses',
        headerDuration: 'Duration (sec)'
    },

    // Settings modal
    settings: {
        title: 'Symbol Settings',
        description: 'Customize the symbols to personalize your game!',
        symbolALabel: 'Correct position symbol:',
        symbolBLabel: 'Wrong position symbol:',
        presetTitle: 'Quick Select:',
        presetClassic: 'A/B Classic',
        presetTarget: 'Target',
        presetCheck: 'Check',
        presetDot: 'Dots',
        presetStar: 'Stars',
        presetFlame: 'Flame',
        saveButton: 'Save Settings',
        resetButton: 'Reset Default'
    },

    // Hint modal
    hint: {
        title: 'Hint',
        positionLabel: 'Position {position} digit'
    },

    // Victory screen
    victory: {
        title: 'Congratulations!',
        playerLabel: 'Player: ',
        guessCountLabel: 'Guesses: ',
        guessCountSuffix: '',
        durationLabel: 'Time: ',
        durationSuffix: ' seconds',
        viewRankingButton: 'View Rankings',
        playAgainButton: 'Play Again'
    },

    // Messages
    messages: {
        enterName: 'Please enter your name!',
        enterFourDigits: 'Please enter 4 digits!',
        digitsOnly: 'Please enter digits only!',
        noRepeat: 'Digits cannot repeat!',
        settingsSaved: 'Settings saved!',
        gamePaused: 'Game Paused',
        gameResumed: 'Game Resumed',
        gameIsPaused: 'Game is paused. Please resume first.',
        startNewGame: 'Please start a new game first.',
        startGameFirst: 'Please start a game and make your first guess.',
        gameEnded: 'Game has ended.',
        congratulations: 'Congratulations {playerName}! You got it! Total guesses: {guessCount}, Time: {duration} seconds.',
        resultKeepGoing: 'Result: {a}{symbolA}{b}{symbolB}, keep going!',
        errorOccurred: 'An error occurred. Please try again.',
        cannotStartNewGame: 'Cannot start new game. Please check if the backend is running.',
        confirmSurrender: 'Are you sure you want to give up? This will not count towards rankings.',
        surrenderAnswer: 'The answer was: {answer}. Game over (not ranked).',
        surrenderFailed: 'Failed to surrender. Please try again.',
        cannotGetRanking: 'Cannot load rankings. Please try again.',
        cannotGetHint: 'Cannot get hint. Please try again.',
        waitingForFirstGuess: '(Timer starts after first guess)',
        seconds: 's'
    },

    // Footer
    footer: {
        version: 'Version: ',
        loading: 'Loading...'
    }
});
