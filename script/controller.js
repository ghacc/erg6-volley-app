"use strict";

var volley = (function(app) {

	const GAME_KEY = "game";
	const BANNER_KEY = "banner_";
	const saved = localStorage.getItem(GAME_KEY);
	// saving banners @ different localStorage entry for better performance
	app.model.setBanner(localStorage.getItem(BANNER_KEY + app.model.GROUND.home), app.model.GROUND.home);
	app.model.setBanner(localStorage.getItem(BANNER_KEY + app.model.GROUND.away), app.model.GROUND.away);
	let game;

	window.addEventListener("load", function() {
		game = new app.model.Game(saved);
		init();
	});


	function init() {
		switch (game.state) {
		case app.model.STATE.notStarted:
			if (game.home) {
				app.view.showSetup(app.model.GROUND.home, game.home.officialName, game.home.shortName, app.model.bannerHome);
			} else {
				app.view.showSetup(app.model.GROUND.home);
			}
			break;
		case app.model.STATE.playing:
			app.view.showScoreboard(copy(game), app.model.bannerHome, app.model.bannerAway);
			break;
		case app.model.STATE.finished:
			app.view.showScoreboard(copy(game), app.model.bannerHome, app.model.bannerAway);
			app.view.showFinished(game.winner);
			break;
		default:
			throw "WARNING: could not extract state";
		}
	}

	// Returns a copy object keeping only data propeties (e.g. no functions)
	function copy(object) {
		return JSON.parse(JSON.stringify(object));
	}

	function saveGame(saveImage) {
		localStorage.setItem(GAME_KEY, JSON.stringify(game));
		if (saveImage) {
			localStorage.setItem(BANNER_KEY + app.model.GROUND.home, app.model.bannerHome);
			localStorage.setItem(BANNER_KEY + app.model.GROUND.away, app.model.bannerAway);
		}
	}

	function technicalTimeoutHandler() {
		app.view.showTimeout();
	}

	function setWonHandler() {
		app.view.showScoreboard(copy(game), app.model.bannerHome, app.model.bannerAway, true);
	}

	function gameWonHandler(winner) {
		app.view.showScoreboard(copy(game), app.model.bannerHome, app.model.bannerAway, true);
		app.view.showFinished(winner, true);
	}

	app.controller = {};

	app.controller.updateTeam = function(isHome, officialName, shortName, banner) {
		if (isHome) {
			game.setHomeTeam(officialName, shortName);
			app.model.setBanner(banner, app.model.GROUND.home);
		} else {
			game.setAwayTeam(officialName, shortName);
			app.model.setBanner(banner, app.model.GROUND.away);
		}
		saveGame(true);
	};

	app.controller.onNext = function() {
		if (game.away) {
			app.view.showSetup(app.model.GROUND.away, game.away.officialName, game.away.shortName, app.model.bannerAway);
		} else {
			app.view.showSetup(app.model.GROUND.away);
		}
	};

	app.controller.onBack = function() {
		if (game.home) {
			app.view.showSetup(app.model.GROUND.home, game.home.officialName, game.home.shortName, app.model.bannerHome);
		} else {
			app.view.showSetup(app.model.GROUND.home);
		}
	};

	app.controller.onStartGame = function() {
		game.addNewSet();
		saveGame(true);
		app.view.showScoreboard(copy(game), app.model.bannerHome, app.model.bannerAway);
	};

	app.controller.onTimeout = function(ground) {
		game.useTimeout(ground);
		saveGame();
	};

	app.controller.onTimeoutEnd = function() {
		game.endTimeout();
	};

	app.controller.onPoint = function(ground) {
		if (game.state === app.model.STATE.playing) {
			game.pointFor(ground, technicalTimeoutHandler, setWonHandler, gameWonHandler);
			saveGame();
		}
	};

	app.controller.onNewMatch = function() {
		localStorage.removeItem(GAME_KEY);
		localStorage.removeItem(BANNER_KEY + app.model.GROUND.home);
		localStorage.removeItem(BANNER_KEY + app.model.GROUND.away);
		game = new app.model.Game(null);
		app.model.bannerHome = undefined;
		app.model.bannerAway = undefined;
		init();
	};

	app.controller.executeIfState = function(func, state) {
		if (game.state === state) {
			func();
		}
	};

	return app;

})(volley || {});
