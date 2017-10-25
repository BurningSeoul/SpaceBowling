$(document).ready(function() {
	var canvas = $("#gameCanvas");
	var context = canvas.get(0).getContext("2d");

	// Canvas dimensions
	var canvasWidth = canvas.width();
	var canvasHeight = canvas.height();

	// Game settings 
	var playGame;

	//Platform variables
	var platformX;
	var platformY;
	var platformOuterRadius;
	var platformInnerRadius;

	//Asteroids variable
	var asteroids;

	//Player variables
	var player;
	var playerOriginalX;
	var playerOriginalY;
	var playerSelected;
	var playerMaxAbsVelocity;
	var playerVelocityDampener;
	var powerX;
	var powerY;
	var score;

	//UI elements
	var ui = $("#gameUI");
	var uiIntro = $("#gameIntro");
	var uiStats = $("#gameStats");
	var uiComplete = $("#gameComplete");
	var uiPlay = $("#gamePlay");
	var uiReset = $(".gameReset");
	var uiRemaining = $("#gameRemaining");
	var uiScore = $(".gameScore");

	//Asteroid class
	var Asteroid = function(x, y, radius, mass, friction) {
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.mass = mass;
		this.friction = friction;
		this.vX = 0;
		this.vY = 0;

		this.player = false;
	};

	//Resets the player
	function resetPlayer() {
		player.x = playerOriginalX;
		player.y = playerOriginalY;
		player.vX = 0;
		player.vY = 0;
	};
	
	//Reset and start the game
	function startGame() {

		//Game UI
		uiScore.html("0");
		uiStats.show();

		//set up initial game settings
		playGame = false;
		platformX = canvasWidth/2;
		platformY = 150;
		platformOuterRadius = 100;
		platformInnerRadius = 75;
		
		//set up Asteroids
		asteroids = new Array();
		var outerRing = 8;										//Asteroids around the outer ring
		var ringCount = 3;										//Number of rings
		var ringSpacing = (platformInnerRadius/(ringCount-1));	//Distance between each ring

		//set up player
		var pRadius = 15;
		var pMass = 10;
		var pFriction = 0.97;
	
		playerOriginalX = canvasWidth/2;
		playerOriginalY = canvasHeight-150;
		playerSelected = false;
		playerMaxAbsVelocity = 30;
		playerVelocityDampener = 0.3;
		powerX = -1;
		powerY = -1;
		score = 0;

		player = new Asteroid(playerOriginalX, playerOriginalY, pRadius, pMass, pFriction);
		player.player = true;
		asteroids.push(player);

		//Ring Loop
		for (var r = 0; r < ringCount; r++) {
			var currentRing = 0;								//Asteroids around current ring
			var angle = 0;										//Angle between each asteroid
			var ringRadius = 0;

			//Is this the innermost ring?
			if (r == ringCount-1) {
				currentRing = 1;
			} else {
				currentRing = outerRing-(r*3);
				angle = 360/currentRing;
				ringRadius = platformInnerRadius-(ringSpacing*r);
			};

			//Individual Asteroids
			for (var a = 0; a < currentRing; a++) {
				var x = 0;
				var y = 0;

				//Is this the innermost ring?
				if (r == ringCount-1) {
					x = platformX;
					y = platformY;
				} else {
					x = platformX+(ringRadius*Math.cos((angle*a)*(Math.PI/180)));
					y = platformY+(ringRadius*Math.sin((angle*a)*(Math.PI/180)));
				};

				var radius = 10;
				var mass = 5;
				var friction = 0.95;
				asteroids.push(new Asteroid(x, y, radius, mass, friction));
			};

			uiRemaining.html(asteroids.length-1);
		};

		//Event Listeners
		$(window).mousedown(function(e) {
			if(!playerSelected && player.x == playerOriginalX && player.y == playerOriginalY) {
				var canvasOffset = canvas.offset();
				var canvasX = Math.floor(e.pageX-canvasOffset.left);
				var canvasY = Math.floor(e.pageY-canvasOffset.top);

				if (!playGame) {
					playGame = true;
					animate();
				};

				var dX = player.x-canvasX;
				var dY = player.y-canvasY;
				var distance = Math.sqrt((dX*dX)+(dY*dY));
				var padding = 5;

				if (distance < player.radius+padding) {
					powerX = player.x;
					powerY = player.y;
					playerSelected = true;
				};
			};
		});

		$(window).mousemove(function(e) {
			if (playerSelected) {
				var canvasOffset = canvas.offset();
				var canvasX = Math.floor(e.pageX-canvasOffset.left);
				var canvasY = Math.floor(e.pageY-canvasOffset.top);

				var dX = canvasX-player.x;
				var dY = canvasY-player.y;
				var distance = Math.sqrt((dX*dX)+(dY*dY));

				if (distance*playerVelocityDampener < playerMaxAbsVelocity) {
					powerX = canvasX;
					powerY = canvasY;
				} else {
					var ratio = playerMaxAbsVelocity/(distance*playerVelocityDampener);
					powerX = player.x+(dX*ratio);
					powerY = player.y+(dY*ratio);
				};
			};
		});

		$(window).mouseup(function(e) {
			if (playerSelected) {
				var dX = powerX-player.x;
				var dY = powerY-player.y;

				player.vX = -(dX*playerVelocityDampener);
				player.vY = -(dY*playerVelocityDampener);

				uiScore.html(++score);
			};

			playerSelected = false;
			powerX = -1;
			powerY = -1;
		});

		//Start the animation loop
		animate();
	};

	//Initialize the game environment
	function init() {
		uiStats.hide();
		uiComplete.hide();

		uiPlay.click(function(e) {
			e.preventDefault();
			uiIntro.hide();
			startGame();
		});

		uiReset.click(function(e) {
			e.preventDefault();
			uiComplete.hide();
			startGame();
		});
	};

	// Animation loop that does all the fun stuff
	function animate() {

		//Clear the canvas
		context.clearRect(0, 0, canvasWidth, canvasHeight);

		//Draw the Platform
		context.fillStyle = "rgb(100, 100, 100)";
		context.beginPath();
		context.arc(platformX, platformY, platformOuterRadius, 0 , Math.PI*2, true);
		context.closePath();
		context.fill();

		//Line indicating velocity
		if (playerSelected) {
			context.strokeStyle = "rgb(255, 255, 255)";
			context.lineWidth = 3;
			context.beginPath();
			context.moveTo(player.x, player.y);
			context.lineTo(powerX, powerY);
			context.closePath();
			context.stroke();
		};

		//Draw Asteroids
		context.fillStyle = "rgb(255, 255, 255)";
		var deadAsteroids = new Array();

		var asteroidsLength = asteroids.length;
		for (var i = 0; i < asteroidsLength; i++){
			for (var j = i+1; j < asteroidsLength; j++) {
				var dX = asteroids[j].x - asteroids[i].x;
				var dY = asteroids[j].y - asteroids[i].y;
				var distance = Math.sqrt((dX*dX)+(dY*dY));

				if(distance < asteroids[i].radius + asteroids[j].radius) {
					var angle = Math.atan2(dY, dX);
					var sine = Math.sin(angle);
					var cosine = Math.cos(angle);

					//Rotate asteroid1 position
					var x = 0;
					var y = 0;

					//Rotate asteroid2 position
					var xB = dX * cosine + dY * sine;
					var yB = dY * cosine - dX * sine;

					//Rotate asteroid velocity
					var vX = asteroids[i].vX * cosine + asteroids[i].vY * sine;
					var vY = asteroids[i].vY * cosine - asteroids[i].vX * sine;

					// Rotate asteroidB velocity
					var vXb = asteroids[j].vX * cosine + asteroids[j].vY * sine;
					var vYb = asteroids[j].vY * cosine - asteroids[j].vX * sine;

					// Conserve momentum
					var vTotal = vX - vXb;
					vX = ((asteroids[i].mass - asteroids[j].mass) * vX + 2 * asteroids[j].mass * vXb) / (asteroids[i].mass + asteroids[j].mass);
					vXb = vTotal + vX;

					// Move asteroids apart
					xB = x + (asteroids[i].radius + asteroids[j].radius);

					// Rotate asteroid positions back
					asteroids[i].x = asteroids[i].x + (x * cosine - y * sine);
					asteroids[i].y = asteroids[i].y + (y * cosine + x * sine);
					asteroids[j].x = asteroids[i].x + (xB * cosine - yB * sine);
					asteroids[j].y = asteroids[i].y + (yB * cosine + xB * sine);

					// Rotate asteroid velocities back
					asteroids[i].vX = vX * cosine - vY * sine;
					asteroids[i].vY = vY * cosine + vX * sine;
					asteroids[j].vX = vXb * cosine - vYb * sine;
					asteroids[j].vY = vYb * cosine + vXb * sine;
				};
			};

			//Calculate new position
			asteroids[i].x += asteroids[i].vX;
			asteroids[i].y += asteroids[i].vY;

			//Friction
			if (Math.abs(asteroids[i].vX) > 0.1){
				asteroids[i].vX *= asteroids[i].friction;
			} else {
				asteroids[i].vX = 0;
			};

			if (Math.abs(asteroids[i].vY) > 0.1){
				asteroids[i].vY *= asteroids[i].friction;
			} else {
				asteroids[i].vY = 0;
			};

			//Asteroid Graveyard
			if (!asteroids[i].player) {
				var dXp = asteroids[i].x - platformX;
				var dYp = asteroids[i].y - platformY;
				var distanceP = Math.sqrt ((dXp*dXp)+(dYp*dYp));
				if(distanceP > platformOuterRadius) {
					if(asteroids[i].radius > 0) {
						asteroids[i].radius -= 2;
					} else {
						deadAsteroids.push(asteroids[i]);
					};
				};
			};

			//Resetting the player
			if (player.x != playerOriginalX && player.y != playerOriginalY) {
				if(player.vX == 0 && player.vY == 0) {
					resetPlayer();
				} else if (player.x+player.radius < 0) {
					resetPlayer();
				} else if (player.x-player.radius > canvasWidth) {
					resetPlayer();
				} else if (player.y+player.radius < 0) {
					resetPlayer();
				} else if (player.y-player.radius > canvasHeight) {
					resetPlayer();
				};
			};

			//context call to Draw asteroids
			context.beginPath();
			context.arc(asteroids[i].x, asteroids[i].y, asteroids[i].radius, 0, Math.PI*2, true);
			context.closePath();
			context.fill();
		};

		//Dead Asteroid cleanup
		var deadAsteroidsLength = deadAsteroids.length;
		if (deadAsteroidsLength > 0) {
			for (var di = 0; di < deadAsteroidsLength; di++) {
				asteroids.splice(asteroids.indexOf(deadAsteroids[di]), 1);
			};
			
			//remove player from asteroid count
			var remaining = asteroids.length-1;	
			uiRemaining.html(remaining);

			//Game over
			if (remaining == 0) {
				//Winner!
				playGame = false;
				uiStats.hide();
				uiComplete.show();

				$(window).unbind("mousedown");
				$(window).unbind("mouseup");
				$(window).unbind("mousemove");
			};
		};

		if(playGame) {
			//Run the animation loop again in 33 milliseconds
			setTimeout(animate, 33);
		};
	};

	init();

	function dBug(data) {
		console.log(data);
	};

});