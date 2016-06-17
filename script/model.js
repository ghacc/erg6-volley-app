"use strict";

var volley = (function(app) {

	const GROUND = {
		home: "home",
		away: "away"
	};
	const STATE = {
		notStarted: "notStarted",
		playing: "playing",
		timeout: "timeout",
		finished: "finished"
	};
	const TECHNICAL_TIMEOUT_POINTS = [8, 16];
	const POINTS_FOR_SET = [25, 25, 25, 25, 15];



	class Game {
		constructor(options) {
			let that = this;
			// If there is a game saved in localStorage, populate the object's
			// properties from there.
			if (options !== null) {
				options = JSON.parse(options);
				Object.keys(options).forEach(function(key) {
					that[key] = options[key];
				});
				// We keep no state for the ellapsed timeout time, so if the state was
				// "timeout" when the user left, the game will start as if the timeout
				// just finished.
				if (this.state === STATE.timeout) {
					this.state = STATE.playing;
				}
			} else {
				this.home = undefined;
				this.away = undefined;
				this.state = STATE.notStarted;
				this.currentSetId = -1;
				this.sets = new Array(5);
				this.winner = undefined;
			}
		}

		static createTeam(officialName, shortName) {
			return {
				officialName: officialName,
				shortName: shortName,
				scoreSet: 0
			};
		}

		static createSet(setId, serviceGround) {
			// Randomly choose who serves first
			if (setId === 0) {
				serviceGround = Math.random() < 0.5 ? GROUND.home : GROUND.away;
			}
			return {
				setId: setId,
				winner: undefined,
				lastPoint: undefined,
				service: serviceGround,
				home: {
					score: 0,
					timeoutsLeft: 2
				},
				away: {
					score: 0,
					timeoutsLeft: 2
				}
			};
		}

		setHomeTeam(officialName, shortName) {
			this.home = Game.createTeam(officialName, shortName);
		}

		setAwayTeam(officialName, shortName) {
			this.away = Game.createTeam(officialName, shortName);
		}

		addNewSet(serviceGround) {
			if (this.currentSetId >= -1 && this.currentSetId <= 3) {
				this.state = STATE.playing;
				let newSetId = ++this.currentSetId;
				this.sets[newSetId] = Game.createSet(newSetId, serviceGround);
			}
		}

		checkTechnicalTimeout(ground) {
			if (this.currentSetId !== 4) {
				let score = this.sets[this.currentSetId][ground].score;
				let min = Math.min(this.sets[this.currentSetId].home.score, this.sets[this.currentSetId].away.score);
				if (score > min) {
					for (let s of TECHNICAL_TIMEOUT_POINTS) {
						if (score === s) return true;
					}
				}
			}
			return false;
		}

		/**
		 * Updates score and fires callbacks if it's time for technical timeout or
		 * the set or the game is won.
		 * @param  {volley.model.GROUND} ground		which ground is the team that won
		 *                                        the point
		 * @param  {function} callbackTimeout			callback for when a technical
		 *                                      	timeout is due
		 * @param  {function} callbackSet					callback for when the set is won
		 * @param  {function} callbackGame				callback for when the game is won
		 */
		pointFor(ground, callbackTimeout, callbackSet, callbackGame) {
			if (this.state !== STATE.playing) return;

			let set = this.sets[this.currentSetId];
			set.service = ground;
			let lastPoint;
			if (ground === GROUND.home) {
				lastPoint = ++set.home.score;
			} else if (ground === GROUND.away) {
				lastPoint = ++set.away.score;
			}

			// Is it time for a technical timeout?
			if (this.checkTechnicalTimeout(ground)) {
				this.state === STATE.timeout;
				callbackTimeout();
				return; // Well if it's a technical there's no need to check for set winner
			}

			let diff = Math.abs(set.home.score - set.away.score);
			// Did ground win the current set with this point?
			if (lastPoint >= POINTS_FOR_SET[this.currentSetId] && diff >= 2) {
				let scoreSetLeader = ++this[ground].scoreSet;
				set.winner = ground;
				// Did ground also win the game with this point?
				if (scoreSetLeader === 3) {
					this.state = STATE.finished;
					this.winner = ground;
					callbackGame(ground);
				} else {
					this.addNewSet(ground);
					callbackSet();
				}
			}
		}

		useTimeout(ground) {
			let teamSet = this.sets[this.currentSetId][ground];
			if (teamSet.timeoutsLeft > 0) {
				teamSet.timeoutsLeft--;
			}
			this.state = STATE.timeout;
		}

		endTimeout() {
			this.state = STATE.playing;
		}
	}

	app.model = {};

	app.model.setBanner = function(banner, ground) {
		if (ground === GROUND.home) {
			app.model.bannerHome = banner;
		} else if (ground === GROUND.away) {
			app.model.bannerAway = banner;
		}
	};

	app.model.GROUND = GROUND;
	app.model.STATE = STATE;
	app.model.Game = Game;

	return app;

})(volley || {});
