"use strict";

var volley = (function(app) {

	let TRIUMPH_PATTERN = [200, 260, 125, 80, 125, 125, 300, 300, 125, 125, 600, 0];
	let SET_PATTERN = [80, 200, 80, 200, 120, 200, 600, 0];
	let TIMEOUT_PATTERN = [600, 0];

	// Elements
	let
		$animationCurtain = $(".animationCurtain"),
		$setupContainer = $("#setupContainer"),
		$next = $("#next"),
		$back = $("#back"),
		$banner = $("#banner"),
		$officialName = $("#officialName"),
		$shortName = $("#shortName"),
		$selectPhoto = $("#selectPhoto"),
		$takePhoto = $("#takePhoto"),
		$camera = $("#camera"),
		$shootPhoto = $("#shootPhoto"),
		$cancel = $("#cancel"),
		$player = $("#player"),
		$scoreboardContainer = $("#scoreboardContainer"),
		$timeoutHomeArr = $(".homeScore tr:last-child td"),
		$timeoutAwayArr = $(".awayScore tr:last-child td"),
		$teamScoreHome = $(".homeScore .teamScore"),
		$teamScoreAway = $(".awayScore .teamScore"),
		$teamNameHome = $(".homeScore .teamName"),
		$teamNameAway = $(".awayScore .teamName"),
		$teamShortNameHome = $("#gameScoreContainer tr:nth-child(2) > td:nth-child(1)"),
		$teamShortNameAway = $("#gameScoreContainer tr:nth-child(3) > td:nth-child(1)"),
		$setRowHome = $("#gameScoreContainer tr:nth-child(2)"),
		$setRowAway = $("#gameScoreContainer tr:nth-child(3)"),
		$bannerContainer = $("#bannerContainer"),
		$homeBanner = $("#homeBanner"),
		$awayBanner = $("#awayBanner"),
		$newMatch = $(".message"),
		$timer = $("#timer"),
		$seconds = $("#seconds");

	function populateFields(officialNameValue, shortNameValue, bannerSrc) {
		$banner.attr("src", bannerSrc || "img/placeholder.png");
		$officialName.val(officialNameValue || "");
		$shortName.val(shortNameValue || "");
	}

	// maybe make a generic function for animations
	function flashCurtain() {
		$animationCurtain.css("z-index", 100);
		$animationCurtain.on("animationend webkitAnimationEnd oAnimationEnd", function() {
			$(this).css("z-index", -1);
			$(this).removeClass("disappearAppear");
		});
		$animationCurtain.addClass("disappearAppear");
	}

	function dance() {
		$bannerContainer.on("animationend webkitAnimationEnd oAnimationEnd", function() {
			$(this).removeClass("dance");
		});
		$bannerContainer.addClass("dance");
	}

	function timeoutHandler(e, ground) {
		app.controller.executeIfState(function() {
			let $light = $(e.currentTarget).children();
			if ($light.hasClass("on")) return;
			app.controller.onTimeout(ground);
			app.view.showTimeout();
			$light.addClass("on");
		}, app.model.STATE.playing);
	}

	function startTimer() {
		let TIMEOUT_SECONDS = 1;
		$seconds.text(TIMEOUT_SECONDS);
		$timer.show();
		let iid = setInterval(() => {
			TIMEOUT_SECONDS--;
			$seconds.text(TIMEOUT_SECONDS);
			if (TIMEOUT_SECONDS < 0) {
				clearInterval(iid);
				$timer.hide();
				app.controller.onTimeoutEnd();
			}
		}, 1000);
	}

	/*======================================================
	 * EVENT HANDLERS
	 ======================================================*/

	// Android let's you take a photo when you are selecting an image too.
	$selectPhoto.on("click", () => {
		let input = document.createElement("input");
		input.setAttribute("type", "file");
		input.setAttribute("accept", "image/*");

		input.addEventListener("change", function() {
			let file = this.files.item(0);
			let reader = new FileReader();

			reader.onload = function() {
				$banner.attr("src", reader.result);
			};
			reader.readAsDataURL(file);
		});
		input.click();
	});

	navigator.getMedia = (navigator.getUserMedia ||
		navigator.webkitGetUserMedia ||
		navigator.mozGetUserMedia ||
		navigator.msGetUserMedia);

	$takePhoto.on("click", function() {

		function handleSuccess(stream) {
			var streaming = false;

			function stopMedia(stream) {
				if (stream) {
					let tracks = stream.getTracks();
					for (let track of tracks) {
						track.stop();
					}
				}
			}
			$player.on("canplay", () => streaming = true);
			$shootPhoto.on("click", function() {
				if (!streaming) return;
				let canvas = document.createElement("canvas");
				let cxt = canvas.getContext("2d");
				canvas.width = 320;
				canvas.height = 320;
				// Keep aspect ratio
				let vw = $player.get(0).videoWidth;
				let vh = $player.get(0).videoHeight;
				let vmin = Math.min(vw, vh);
				let vmin2 = vmin / 2;
				let cw = vw / 2;
				let ch = vh / 2;
				cxt.drawImage($player.get(0), (cw - vmin2), (ch - vmin2), vmin, vmin, 0, 0, canvas.width, canvas.height);
				let data = canvas.toDataURL("image/jpg");
				$banner.attr("src", data);
				$cancel.trigger("click");
			});

			$cancel.on("click", function() {
				$camera.attr("data-disabled", "true");
				stopMedia(stream);
			});

			$player.attr("src", URL.createObjectURL(stream));
			$player.get(0).play();
		}

		$camera.removeAttr("data-disabled");

		if (navigator.camera) {
			navigator.camera.getPicture((data) => {
				$banner.attr("src", "data:image/jpeg;base64," + data);
				$camera.attr("data-disabled", "true");
			}, (error) => {
				console.log(error);
				$camera.attr("data-disabled", "true");
			}, {
				destinationType: navigator.camera.DestinationType.DATA_URL,
				targetWidth: 600,
				targetHeight: 600
			})
		}
		navigator.getMedia({
				video: true,
				audio: false
			},
			handleSuccess,
			function(error) {
				console.log(error);
				console.log("Could not get access to camera.");
				$camera.attr("data-disabled", "true");
			});
	});

	$(window).on("keypress", (e) => {
		if (e.which === 13) {
			$next.trigger("click");
		}
	});

	$next.on("click", () => {
		let isHome = $back.attr("disabled") !== undefined;
		flashCurtain();
		app.controller.updateTeam(isHome, $officialName.val(), $shortName.val(), $banner.attr("src"));
		if (isHome) {
			$officialName.trigger("focus");
			app.controller.onNext();
		} else {
			app.controller.onStartGame();
		}
	});

	$back.on("click", () => {
		if ($back.attr("disabled")) return;
		$back.attr("disabled", true);
		flashCurtain();
		app.controller.updateTeam(false, $officialName.val(), $shortName.val(), $banner.attr("src"));
		$officialName.trigger("focus");
		app.controller.onBack();
	});

	$timeoutHomeArr.on("click", e => timeoutHandler(e, app.model.GROUND.home));

	$timeoutAwayArr.on("click", e => timeoutHandler(e, app.model.GROUND.away));

	$teamScoreHome.on("click", () => {
		app.controller.executeIfState(function() {
			$teamScoreHome.text(parseInt($teamScoreHome.text()) + 1);
			app.controller.onPoint(app.model.GROUND.home);
			$teamScoreHome.addClass("service");
			$teamScoreAway.removeClass("service");
		}, app.model.STATE.playing);

	});

	$teamScoreAway.on("click", () => {
		app.controller.executeIfState(function() {
			$teamScoreAway.text(parseInt($teamScoreAway.text()) + 1);
			app.controller.onPoint(app.model.GROUND.away);
			$teamScoreAway.addClass("service");
			$teamScoreHome.removeClass("service");
		}, app.model.STATE.playing);

	});

	$bannerContainer.on("dblclick", () => window.applicationCache.update());

	$newMatch.on("click", () => app.controller.onNewMatch());

	// View's public api

	app.view = {};

	app.view.showSetup = (ground, oName, sName, banner) => {
		populateFields(oName, sName, banner);
		$setupContainer.show();
		$scoreboardContainer.hide();
		if (ground === app.model.GROUND.home) {
			$back.attr("disabled", true);
		} else {
			$back.removeAttr("disabled");
		}
	};

	app.view.showScoreboard = (data, bannerHome, bannerAway, isNotRevisiting) => {
		// When I set properties to "", it is to reset them from previous games
		// Update official names
		$teamNameHome.text(data.home.officialName || "");
		$teamNameAway.text(data.away.officialName || "");
		// Update short names
		$teamShortNameHome.text(data.home.shortName || "");
		$teamShortNameAway.text(data.away.shortName || "");
		// Update banners
		$homeBanner.css("background-image", "");
		$awayBanner.css("background-image", "");
		if (bannerHome !== "img/placeholder.png") {
			$homeBanner.css("background-image", "url(" + bannerHome + ")");
		}
		if (bannerAway !== "img/placeholder.png") {
			$awayBanner.css("background-image", "url(" + bannerAway + ")");
		}
		$homeBanner.removeClass("winner loser");
		$awayBanner.removeClass("winner loser");
		$newMatch.hide();
		// Update previous set scores
		for (let i = 0; i < 5 + 1; i++) {
			if (data.sets[i] && data.sets[i].winner) {
				// i+2 instead of i+1 cause css counts from 1 and up
				$setRowHome.find("td:nth-child(" + (i + 2) + ")").text(data.sets[i].home.score);
				$setRowAway.find("td:nth-child(" + (i + 2) + ")").text(data.sets[i].away.score);
			} else {
				$setRowHome.find("td:nth-child(" + (i + 2) + ")").text("");
				$setRowAway.find("td:nth-child(" + (i + 2) + ")").text("");
			}
		}
		if (!data.winner) {
			if (isNotRevisiting) {
				navigator.vibrate(SET_PATTERN);
			}
			// Update timeouts left for current set
			$(".timeoutIndicator").removeClass("on");
			for (let i = 0; i < Math.abs(data.sets[data.currentSetId].home.timeoutsLeft - 2); i++) {
				$($timeoutHomeArr[i]).children().addClass("on");
			}
			for (let i = 0; i < Math.abs(data.sets[data.currentSetId].away.timeoutsLeft - 2); i++) {
				$($timeoutAwayArr[i]).children().addClass("on");
			}
			// Update points for current set
			$teamScoreAway.text(data.sets[data.currentSetId].away.score);
			$teamScoreHome.text(data.sets[data.currentSetId].home.score);
			// Update service indicator
			if (data.sets[data.currentSetId].service === app.model.GROUND.home) {
				$teamScoreHome.addClass("service");
			} else if (data.sets[data.currentSetId].service === app.model.GROUND.away) {
				$teamScoreAway.addClass("service");
			}
		}
		if (data.winner && !isNotRevisiting) {
			$teamScoreAway.text(data.sets[data.currentSetId - 1].away.score);
			$teamScoreHome.text(data.sets[data.currentSetId - 1].home.score);
		}
		$setupContainer.hide();
		$scoreboardContainer.show();
	};

	app.view.showFinished = (winner, isNotRevisiting) => {
		if (isNotRevisiting) {
			navigator.vibrate(TRIUMPH_PATTERN);
			dance();
		}
		$newMatch.show();
		if (winner === app.model.GROUND.home) {
			$homeBanner.addClass("winner");
			$awayBanner.addClass("loser");
		} else if (winner === app.model.GROUND.away) {
			$awayBanner.addClass("winner");
			$homeBanner.addClass("loser");
		}
	};

	app.view.showTimeout = () => {
		navigator.vibrate(TIMEOUT_PATTERN);
		startTimer();
	};

	return app;

})(volley || {});
