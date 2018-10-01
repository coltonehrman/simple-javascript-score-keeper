(function() {
    function element(selector, initialState, render) {
        var self = this;
        self.state = Object.assign({}, initialState);
        self.$element = document.querySelector(selector);
        self.stateChangeHandlers = [];
        self.eventListeners = [];

        if (initialState) {
            reset();
        }

        function changedState() {
            self.stateChangeHandlers.forEach(function(handler) {
                handler(self.state);
            });
        }

        function setState(handler) {
            self.state = Object.assign(self.state, handler(self.state));
            changedState();
            renderHTML();
        }

        function on(event, handler) {
            self.eventListeners.push({ event: event, handler: handler });
            self.$element.addEventListener(event, handler);
        }

        function off(event) {
            self.eventListeners = self.eventListeners.filter(function(listener) {
                if (listener.event === event) {
                    self.$element.removeEventListener(event, listener.handler);
                    return false;
                }

                return true;
            });

            return this;
        }

        function renderHTML() {
            self.$element.innerHTML = render(self.state);
        }

        function reset() {
            self.state = Object.assign({}, initialState);
            renderHTML();
        }

        return {
            on: on,
            off: off,
            reset: reset,
            setState: setState,
            onStateChange: function(props, handler) {
                self.stateChangeHandlers.push(function(state) {
                    handler.apply(null, props.map(function(prop) { return state[prop] }));
                });
            },
            state: self.state,
            $element: self.$element,
        };
    }

    var DEFAULT_PLAY_TO = 5;

    var playerOne   = new element('.player-one');
    var playerTwo   = new element('.player-two');
    var playToInput = new element('input');
    var reset       = new element('.reset');

    var playTo = new element('.play-to', { playTo: DEFAULT_PLAY_TO }, function(state) {
        return 'Playing to ' + state.playTo
    });

    var score = new element('.score', { playerOne: 0, playerTwo: 0 }, function(state) {
        function getScore(player) {
            return (state[player] >= playTo.state.playTo) ?
                '<span class="green">' + state[player] + '</span>' :
                state[player];
        }

        var playerOne = getScore('playerOne');
        var playerTwo = getScore('playerTwo');

        return playerOne + ' to ' + playerTwo;
    });

    score.incrementScore = function(player) {
        this.setState(function(currentState) {
            var newScore = {};
            newScore[player] = currentState[player] + 1;
            return newScore;
        });
    };

    score.onStateChange(['playerOne', 'playerTwo'], function(playerOneScore, playerTwoScore) {
        if (playerOneScore >= playTo.state.playTo || playerTwoScore >= playTo.state.playTo) {
            playerOne.off('click');
            playerTwo.off('click');

            console.log('Game over!');
        }
    });

    playToInput.getValue = function() {
        return playToInput.$element.value;
    }

    playTo.change = function(newPlayTo) {
        this.setState(function() {
            return { playTo: newPlayTo };
        });
    }

    function resetGame() {
        score.reset();

        playerOne.off('click').on('click', function() { score.incrementScore('playerOne') });
        playerTwo.off('click').on('click', function() { score.incrementScore('playerTwo') });
    }
    
    playToInput.on('change', function(event) {
        var value = playToInput.getValue();
    
        if (value < 1) {
            playToInput.$element.value = 1;
            value = playToInput.getValue();
        }

        playTo.change(value);
        score.reset();
    });

    reset.on('click', resetGame);

    resetGame();
})();
