﻿/// <reference path="http://code.jquery.com/jquery-latest.min.js" />
(function ($) {
    Object.prototype.clone = function () {
        var newObj = (this instanceof Array) ? [] : {};
        for (i in this) {
            if (i == 'clone') continue;
            if (this[i] && typeof this[i] == "object") {
                newObj[i] = this[i].clone();
            } else newObj[i] = this[i]
        } return newObj;
    };


    function GameMove(symbol, row, column) {
        this.symbol = symbol;
        this.row = row;
        this.column = column;
    }


    function GamePad() {
        this.padSize = 3;
        this.pad = new Array(this.padSize);
        for (x = 0; x < this.pad.length; x++) {
            this.pad[x] = new Array(this.padSize);
        }
        this.isGameOver = false;
        this.winnerSymbol = null;
    }
    /// <summary>
    /// Check if there is a winner based on Row Line 
    /// Sample Data : 
    /// X X X 
    /// </summary>
    GamePad.prototype.checkRows = function () {
        for (var row = 0; row < this.pad.length; row++) {
            var symbol = this.pad[row][0]; //Get first element of the current Row
            var lineMatched = symbol != null; //Ensure that it is not empty cell
            for (var column = 0; column < this.pad.length; column++) {
                lineMatched &= symbol == this.pad[row][column];
                if (!lineMatched)
                    break;
            }
            if (lineMatched)
                this.endGame(symbol);
        }
    }
    /// <summary>
    /// Check if there is a winner based on Column Line 
    /// Sample Data : 
    /// X
    /// X
    /// X
    /// </summary>
    GamePad.prototype.checkColumns = function () {
        for (var column = 0; column < this.pad.length; column++) {
            var symbol = this.pad[0][column]; //Get first element of the current Column
            var lineMatched = symbol != null; //Ensure that it is not empty cell
            for (var row = 0; row < this.pad.length; row++) {
                lineMatched &= symbol == this.pad[row][column];
                if (!lineMatched)
                    break;
            }
            if (lineMatched)
                this.endGame(symbol);
        }
    }
    /// <summary>
    /// Check if there is a winner based on Diagonal Line 
    /// Sample Data : 
    /// X 
    ///   X 
    ///     X 
    /// </summary>
    GamePad.prototype.checkDiagonals = function () {
        for (var diagonal = 0; diagonal < 2; diagonal++) {
            var symbol = this.pad[diagonal][diagonal]; //Get an element of the current Diagonal
            var lineMatched = symbol != null; //Ensure that it is not empty cell
            for (var row = 0; row < this.pad.length; row++) {
                var column = 0;

                switch (diagonal) {
                    case 0:
                        column = row;
                        break;
                    case 1:
                        column = (this.pad.length - 1) - row;
                        break;
                }

                lineMatched &= symbol == this.pad[row][column];
                if (!lineMatched)
                    break;
            }
            if (lineMatched)
                this.endGame(symbol);
        }
    }
    GamePad.prototype.processGame = function () {
        //Check if there is a winner
        this.checkRows();
        if (this.isGameOver)
            return;
        this.checkColumns();
        if (this.isGameOver)
            return;
        this.checkDiagonals();
        if (this.isGameOver)
            return;
        this.checkGameOver();
    }
    GamePad.prototype.addMove = function (gameMove) {
        if (!this.validateMove(gameMove))
            return;
        this.pad[gameMove.row][gameMove.column] = gameMove.symbol;

        //Process Game status to see whether there is a Winner, or the game ends
        this.processGame();
    }
    GamePad.prototype.validateMove = function (gameMove) {
        return this.pad[gameMove.row][gameMove.column] == null;
    }
    GamePad.prototype.endGame = function (winnerSymbol) {
        this.isGameOver = true;
        this.winnerSymbol = winnerSymbol;
    }
    /// <summary>
    /// Check if the game is over with no winner , because the Game Pad if full
    /// Sample Data : 
    /// X O X 
    /// X O O 
    /// O X O
    /// </summary>
    GamePad.prototype.checkGameOver = function () {
        var noEmptyCells = true; //Assume there is no empty cells
        for (row = 0; row < this.pad.length; row++) {
            for (column = 0; column < this.pad[row].length; column++) {
                noEmptyCells &= this.pad[row][column] != null;
            }
        }
        if (noEmptyCells)
            this.endGame("");
    }



    function GameEngine(player1, player2) {
        this.player1 = player1;
        this.player2 = player2;
        this.gamePad = new GamePad();
        this.currentPlayer = player1;
    }
    GameEngine.prototype.isGameOver = function () {
        return this.gamePad.winnerSymbol || this.gamePad.isGameOver;
    }
    GameEngine.prototype.switchPlayers = function () {
        this.currentPlayer = this.currentPlayer == this.player1 ? this.player2 : this.player1;
    }
    GameEngine.prototype.move = function (gameMove) {
        if (gameMove.symbol != this.currentPlayer.symbol)
            return;
        this.gamePad.addMove(gameMove);
        //Switch the player turns
        this.switchPlayers();
    }



    function HumanPlayer(symbol) {
        this.symbol = symbol;
    }

    function ThinkingNode() {
        this.relatedGameMove = null;
        this.xFunction = 0;
        this.oFunction = 0;
        this.isWinningMove = false;
        this.relatedGamePad = null;
    }
    ThinkingNode.prototype.heuristic = function () {
        return this.xFunction - this.oFunction;
    }


    function MinimaxGameStrategy(gameEngine) {
        this.gameEngine = gameEngine;
    }
    MinimaxGameStrategy.prototype.isWinningMove = function (symbol, symbolLine) {
        var isMathced = true;
        $.each(symbolLine, function (i, symbolCell) {
            isMathced &= (symbolCell == symbol);
        });
        return isMathced;
    }
    MinimaxGameStrategy.prototype.hasPotential = function (symbol, symbolLine) {
        var isMatchedOrEmpty = true;
        $.each(symbolLine, function (i, symbolCell) {
            isMatchedOrEmpty &= (symbolCell == symbol || symbolCell == null);
        });
        return isMatchedOrEmpty;
    }
    MinimaxGameStrategy.prototype.calculateRows = function (symbol, thinkingNode) {
        for (var row = 0; row < thinkingNode.relatedGamePad.length; row++) {
            var symbolLine = new Array();
            for (var column = 0; column < thinkingNode.relatedGamePad.length; column++) {
                symbolLine.push(thinkingNode.relatedGamePad[row][column]);
            }
            if (this.isWinningMove(symbol, symbolLine)) {
                thinkingNode.isWinningMove = true;
                return;
            }
            if (this.hasPotential(symbol, symbolLine)) {
                switch (symbol) {
                    case "x":
                        thinkingNode.xFunction++;
                        break;
                    case "o":
                        thinkingNode.oFunction++;
                        break;
                }
            }
        }
    }
    MinimaxGameStrategy.prototype.calculateColumns = function (symbol, thinkingNode) {
        for (var column = 0; column < thinkingNode.relatedGamePad.length; column++) {
            var symbolLine = new Array();
            for (var row = 0; row < thinkingNode.relatedGamePad.length; row++) {
                symbolLine.push(thinkingNode.relatedGamePad[row][column]);
            }
            if (this.isWinningMove(symbol, symbolLine)) {
                thinkingNode.isWinningMove = true;
                return;
            }
            if (this.hasPotential(symbol, symbolLine)) {
                switch (symbol) {
                    case "x":
                        thinkingNode.xFunction++;
                        break;
                    case "o":
                        thinkingNode.oFunction++;
                        break;
                }
            }
        }
    }
    MinimaxGameStrategy.prototype.calculateDiagonals = function (symbol, thinkingNode) {
        for (var diagonal = 0; diagonal < 2; diagonal++) {
            var symbolLine = new Array();
            for (var row = 0; row < thinkingNode.relatedGamePad.length; row++) {
                var column = 0;
                switch (diagonal) {
                    case 0: column = row;
                        break;
                    case 1: column = (thinkingNode.relatedGamePad.length - 1) - row;
                        break;
                }
                symbolLine.push(thinkingNode.relatedGamePad[row][column]);
            }
            if (this.isWinningMove(symbol, symbolLine)) {
                thinkingNode.isWinningMove = true;
                return;
            }
            if (this.hasPotential(symbol, symbolLine)) {
                switch (symbol) {
                    case "x":
                        thinkingNode.xFunction++;
                        break;
                    case "o":
                        thinkingNode.oFunction++;
                        break;
                }
            }
        }
    }
    MinimaxGameStrategy.prototype.calculateXFunction = function (thinkingNode) {
        this.calculateRows("x", thinkingNode);
        this.calculateColumns("x", thinkingNode);
        this.calculateDiagonals("x", thinkingNode);
    }
    MinimaxGameStrategy.prototype.calculateOFunction = function (thinkingNode) {
        this.calculateRows("o", thinkingNode);
        this.calculateColumns("o", thinkingNode);
        this.calculateDiagonals("o", thinkingNode);
    }
    MinimaxGameStrategy.prototype.calculateHeuristic = function (thinkingNode) {
        this.calculateXFunction(thinkingNode);
        this.calculateOFunction(thinkingNode);
    }
    MinimaxGameStrategy.prototype.getEmptyCells = function (gamePad) {
        var emptyCellsIndecis = new Array();
        var index = 0;
        for (var row = 0; row < gamePad.length; row++) {
            for (var column = 0; column < gamePad[row].length; column++) {
                if (gamePad[row][column] == null) {
                    var currentIndex = {
                        row: row,
                        column: column
                    };
                    emptyCellsIndecis.push(currentIndex);
                }
            }
        }
        return emptyCellsIndecis;
    }
    MinimaxGameStrategy.prototype.generatePossibleMoves = function (gamePad, symbol) {
        var emptyCellsIndecis;
        var possibleMoves = new Array();
        emptyCellsIndecis = this.getEmptyCells(gamePad);
        $.each(emptyCellsIndecis, function (i, currentIndex) {
            var thinkingNode = new ThinkingNode();
            thinkingNode.relatedGamePad = gamePad.clone();
            thinkingNode.relatedGamePad[currentIndex.row][currentIndex.column] = symbol;
            thinkingNode.relatedGameMove = new GameMove(symbol, currentIndex.row, currentIndex.column);
            possibleMoves.push(thinkingNode);
        });
        return possibleMoves;
    }
    MinimaxGameStrategy.prototype.think = function (symbol) {
        var possibleMoves = this.generatePossibleMoves(this.gameEngine.gamePad.pad, symbol);
        var $this = this;
        var winningMove = null;
        $.each(possibleMoves, function (i, possibleMove) {
            $this.calculateHeuristic(possibleMove);
            if (possibleMove.isWinningMove)
                winningMove = possibleMove.relatedGameMove;
        });
        if (winningMove)
            return winningMove;
        //Find Best Heuristic
        var bestIndex = 0;
        var bestMove = null;
        var best = 0;
        var randomPossibility = 0;
        switch (symbol) {
            case "x":
                best = Number.MIN_VALUE;
                break;
            case "o":
                best = Number.MAX_VALUE;
                break;
        }

        $.each(possibleMoves, function (i, possibleMove) {
            bestMove = possibleMove;
            randomPossibility = Math.round(Math.random());
            switch (symbol) {
                case "x": //Look for max value
                    if (bestMove.heuristic() > best) {
                        best = bestMove.heuristic();
                        bestIndex = i;
                    }
                    //This case to select a random game move in case of a tie, to have unpredectable behaviour.
                    else if (bestMove.heuristic() == best && randomPossibility == 1) {
                        best = bestMove.heuristic();
                        bestIndex = i;
                    }
                    break;
                case "o": //Look for min Value
                    if (bestMove.heuristic() < best) {
                        best = bestMove.heuristic();
                        bestIndex = i;
                    }
                    //This case to select a random game move in case of a tie, to have unpredectable behaviour.
                    else if (bestMove.heuristic() == best && randomPossibility == 1) {
                        best = bestMove.heuristic();
                        bestIndex = i;
                    }
                    break;
            }
        });

        return possibleMoves[bestIndex].relatedGameMove;
    }


    function PcPlayer(symbol, gameStrategy) {
        this.symbol = symbol;
        this.strategy = gameStrategy;
    }
    PcPlayer.prototype.think = function () {
        return this.strategy.think(this.symbol);
    }


    var templates = {
        game_intro: {
            html: '<a class="patrick" href="javascript:void(0);"></a><a class="sponge" href="javascript:void(0);"></a>',
            class: 'game-intro'
        },
        game_play: {
            html: '<div class="game-pad"></div><div class="disable-game"></div>',
            class: 'game-play'
        },
        game_end: {
            html: '<img src="css/youwon.png" class="game-result" /><a class="character-select" href="javascript:void(0);"></a><a class="play-again" href="javascript:void(0);"></a>',
            class: 'game-end',
            won: 'css/youwon.png',
            lost: 'css/youlost.png'
        }
    };


    function GameController(gameUi) {
        this.gameUi = gameUi;
        this.humanSymbol = null;
    }
    GameController.prototype.showIntro = function () {
        this.gameUi.removeClass();
        this.gameUi.addClass(templates.game_intro.class);
        this.gameUi.html(templates.game_intro.html);

        _this = this;
        $("a", this.gameUi).click(function () {
            var symbolClass = $(this).attr("class");
            switch (symbolClass) {
                case "sponge":
                    _this.humanSymbol = "o";
                    break;
                case "patrick":
                    _this.humanSymbol = "x";
                    break;
            }
            _this.playGame();
        });
    }
    GameController.prototype.playGame = function () {
        var humanPlayer = new HumanPlayer(this.humanSymbol);
        var pcPlayer = new PcPlayer(this.humanSymbol == "o" ? "x" : "o");

        var gameEngine = new GameEngine(humanPlayer, pcPlayer);
        pcPlayer.strategy = new MinimaxGameStrategy(gameEngine);

        this.gameUi.removeClass();
        this.gameUi.addClass(templates.game_play.class);
        this.gameUi.html(templates.game_play.html);
        _this = this;

        gamepadUi = $(".game-pad", this.gameUi);
        for (var x = 0; x < 9; x++) { //Create 9 cells to play on
            var div = $("<div/>");
            div.attr("row", parseInt(x / 3));
            div.attr("col", x % 3);
            gamepadUi.append(div);
        }
        $(">div", gamepadUi).addClass("pad-cell");
        $(">div", gamepadUi).click(function () {
            var $this = $(this);
            var this_class = $this.attr("class");
            if (this_class.indexOf("x") > -1 || this_class.indexOf("o") > -1)
                return;
            gameEngine.move(new GameMove(humanPlayer.symbol, $this.attr("row"), $this.attr("col")));
            $this.addClass(humanPlayer.symbol);
            if (!gameEngine.isGameOver()) {
                var pcMove = pcPlayer.think();
                gameEngine.move(pcMove);
                pcCell = ">div[row=" + pcMove.row + "][col=" + pcMove.column + "]";
                $(pcCell, $this.parent()).addClass(pcPlayer.symbol);
            }

            if (gameEngine.isGameOver()) {
                result = humanPlayer.symbol == gameEngine.isGameOver() ? "won" : "lost";
                $(".disable-game", _this.gameUi).show();
                function endWrapper() {
                    _this.endGame(result);
                }
                setTimeout(endWrapper, 1000);
            }
        });
    }
    GameController.prototype.endGame = function (result) {
        this.gameUi.removeClass();
        this.gameUi.addClass(templates.game_end.class);
        this.gameUi.html(templates.game_end.html);
        _this = this;

        $(">img", this.gameUi).attr("src", templates.game_end[result]);
        $(".character-select", this.gameUi).click(function () {
            _this.showIntro();
        });
        $(".play-again", this.gameUi).click(function () {
            _this.playGame();
        });
    }

    $.fn.playxo = function () {
        var controller = new GameController(this);
        controller.showIntro();

        //        //Show intro
        //        this.html(templates.game_intro.html);
        //        this.addClass(templates.game_intro.class);
        //        var gameUi = this;

        //        $("a", this).click(function () {
        //            var symbolClass = $(this).attr("class");
        //            switch (symbolClass) {
        //                case "sponge":
        //                    symbol = "o";
        //                    break;
        //                case "patrick":
        //                    symbol = "x";
        //                    break;
        //            }
        //            playGame(symbol);
        //        });

        //        function playGame(symbol) {
        //            //Go to game
        //            var humanPlayer = new HumanPlayer(symbol);
        //            var pcPlayer = new PcPlayer(symbol == "o" ? "x" : "o");

        //            var gameEngine = new GameEngine(humanPlayer, pcPlayer);
        //            pcPlayer.strategy = new MinimaxGameStrategy(gameEngine);

        //            gameUi.removeClass(templates.game_intro.class);
        //            gameUi.addClass(templates.game_play.class);
        //            gameUi.html(templates.game_play.html);

        //            gamepadUi = $(".game-pad", gameUi);
        //            for (var x = 0; x < 9; x++) { //Create 9 cells to play on
        //                var div = $("<div/>");
        //                div.attr("row", parseInt(x / 3));
        //                div.attr("col", x % 3);
        //                gamepadUi.append(div);
        //            }
        //            $(">div", gamepadUi).addClass("pad-cell");
        //            $(">div", gamepadUi).click(function () {
        //                var $this = $(this);
        //                var this_class = $this.attr("class");
        //                if (this_class.indexOf("x") > -1 || this_class.indexOf("o") > -1)
        //                    return;
        //                gameEngine.move(new GameMove(humanPlayer.symbol, $this.attr("row"), $this.attr("col")));
        //                $this.addClass(humanPlayer.symbol);

        //                var pcMove = pcPlayer.think();
        //                gameEngine.move(pcMove);
        //                pcCell = ">div[row=" + pcMove.row + "][col=" + pcMove.column + "]";
        //                $(pcCell, $this.parent()).addClass(pcPlayer.symbol);

        //                if (gameEngine.isGameOver()) {
        //                    result = humanPlayer.symbol == gameEngine.isGameOver() ? "won" : "lost";
        //                    function endWrapper() {
        //                        endGame(result);
        //                    }
        //                    setTimeout(endWrapper, 1000);

        //                }
        //            });
        //        }

        //        function endGame(result) {
        //            gameUi.removeClass(templates.game_play.class);
        //            gameUi.addClass(templates.game_end.class);
        //            gameUi.html(templates.game_end.html);

        //            $(">img", gameUi).attr("src", templates.game_end[result]);
        //        }

        return this;
    }
})(jQuery);

$(document).ready(function () {
    $("#test").playxo();
});
