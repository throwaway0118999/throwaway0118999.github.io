
//Autores: Álvaro Santos (45537) e Mariana Aires (44915)
//Todas as funcionalidades do trabalho foram implementadas

var ctx, player, empty, world, control;

const SECONDS_PER_ROUND = 120
const POINTS_PER_LIFE = 200;
const POINTS_PER_SECOND = 1;
const NUMBER_OF_LEVELS = 7;

var Actor = EXTENDS(JSRoot, {
	x: null,
	y: null,
	image: null,
	time: null,
	dying: null,
	time_dying: null,
	INIT: function(x, y, kind) {
		this.x = x;
		this.y = y;
		this.image = GameImage.get(kind, "").image;
		this.time = 0;
		this.dying = false;
		this.time_dying = 0;
		this.show();
	},
	show: function() {
		world[this.x][this.y] = this;
		ctx.drawImage(this.image, this.x * ACTOR_PIXELS_X,
					  this.y * ACTOR_PIXELS_Y);
	},
	hide: function() {
		world[this.x][this.y] = empty;
		ctx.drawImage(empty.image, this.x * ACTOR_PIXELS_X,
					  this.y * ACTOR_PIXELS_Y);
	},
	move: function() {
		return 0;
	},
	animation: function() {},
	//While not strictly necessary, the parameter
	//is here to indicate that some "subclasses" may
	//need it.
	destroy: function(killer) {
		this.dying = true;
	},
	isSmashable: function() {
		return false;
	},
	isBiteable: function() {
		return false;
	},
	isHittable: function() {
		return false;
	},
	isLiftable: function() {
		return false;
	},
	isCompressible: function() {
		return false;
	},
	grantsVictory: function() {
		return false;
	},
	//Notice how only isPickup is in the Actor "class".
	//While every actor can be querried to ascertain
	//its "pickup-ability", only those that reply
	//positively have to worry about being picked up
	isPickup: function() {
		return false;
	},
	//Returns true when the blinking has ended
	private_blink: function() {
		if(this.time_dying === ANIMATION_EVENTS_PER_SECOND) {
			this.hide();
			return true;
		}

		if(this.time_dying%2 === 0) {
			ctx.drawImage(this.image, this.x * ACTOR_PIXELS_X,
						  this.y * ACTOR_PIXELS_Y);
		} else {
			ctx.drawImage(empty.image, this.x * ACTOR_PIXELS_X,
						  this.y * ACTOR_PIXELS_Y);
		}

		++this.time_dying;
		return false;
	}
});

var Empty = Object.freeze(EXTENDS(Actor, {
	INIT: function() {
		this.SUPER(Actor.INIT, -1, -1, "Empty");
	},
	show: function() {},
	hide: function() {}
}));


var InertActor = EXTENDS(Actor, {
	//While not strictly necessary, I find it aesthetically
	//pleasing to have a constructor for every "class"
	INIT: function(x, y, kind) {
		this.SUPER(Actor.INIT, x, y, kind);
	}
});

var Block = EXTENDS(InertActor, {
	INIT: function(x, y) {
		this.SUPER(InertActor.INIT, x, y, "Block");
	}
});

var Sun = EXTENDS(InertActor, {
	INIT: function(x, y) {
		this.SUPER(Actor.INIT, x, y, "Sun");
	},
	animation: function() {
		var item = world[this.x][this.y - 1];
		
		if(item.grantsVictory()) {
			control.advanceLevel();
		}
	}
});

//Short summary of this class's methods:
//private_move and animation are not to be called
//by (most) other objects. Use move instead. If it
//fails, it fails, and you weren't meant to move this
//object anyway.
var MovableActor = EXTENDS(Actor, {
	dx: null,
	dy: null,
	INIT: function(x, y, kind, dx, dy) {
		this.SUPER(Actor.INIT, x, y, kind);
		this.dx = dx;
		this.dy = dy;
	},
	//How does asking an object to "move" differ from
	//asking it to perform "animation"?
	//Move is expected to be called by other objects
	//requesting that this one move itself.
	//Animation is only to be called by "subclasses",
	//defining their own animation methods,
	//and by the game controller.
	move: function(dx, dy, failure_callback, failure_action_callback) {
			return this.private_move(dx, dy, failure_callback,
									 failure_action_callback);
		},
	//The exact same thing as move, except that it
	//explicitly indicates that it's "private".
	//Meaning that no one object should call this
	//on another object (other than itself!)
	//The actual difference is that this one will
	//always succeed in *trying* to move, while
	//"move" is free to refuse to do anything.
	private_move: function(dx, dy, failure_callback, failure_action_callback) {
		var neighbour = world[this.x + dx][this.y + dy];

		if(null === failure_callback || undefined === failure_callback) {
			failure_callback = function(neighbour) {
				return empty !== neighbour;
			};
		}
		
		if(null === failure_action_callback ||
		   undefined === failure_action_callback) {
			failure_action_callback = function() {return 0;};
		}
		
		if(failure_callback(neighbour)) {
			return failure_action_callback(neighbour);
		}

		var dist = distance(this.x, this.y, this.x + dx, this.y + dy);

		this.hide();
		this.x += dx;
		this.y += dy;
		this.show();

		return dist;
	},
	//Will try to move itself by default (as is natural
	//for a *movable* object, unless a subclass
	//has redefined what to do.
	animation: function(speed, failure_callback, failure_action_callback,
						 success_action_callback) {
		if(undefined === failure_callback || null === failure_callback) {
			failure_callback = function(neighbour) {
				return empty !== neighbour;
			};
		}
		
		if(undefined === failure_action_callback ||
		   null === failure_action_callback) {
			failure_action_callback = function() {};
		}
		
		if(undefined === success_action_callback ||
		   null === success_action_callback) {
			var movable = this;
			
			success_action_callback = function() {
				movable.private_move(movable.dx, movable.dy, failure_callback,
									 failure_action_callback);
			};
		}
		
		//Notice the Math.round: since control.time
		//starts at 0 and increases in steps of 1,
		//if the right hand side of the % operator
		//were not guaranteed to be an integer as well
		//(i.e. speed === 3 and A_E_P_S === 10)
		//then we'd (almost) never do anything because
		//we'd always have a remainder.
		if(0 === control.time%Math.round(ANIMATION_EVENTS_PER_SECOND/speed)) {
			var neighbour = world[this.x + this.dx][this.y + this.dy];
			
			if(failure_callback(neighbour)) {
				failure_action_callback(neighbour);
			} else {
				success_action_callback(neighbour);
			}
		}
	}
});

var ProjectileActor = EXTENDS(MovableActor, {
	travelling: null,
	owner: null,
	INIT: function(x, y, kind) {
		this.SUPER(MovableActor.INIT, x, y, kind, 0, 0);
		travelling = false;
	},
	//Attempts to fire the projectile in the given direction
	//and returns whether it succeeded in firing or not.
	fire: function(dx, dy) {
		var x = this.owner.x + dx;
		var y = this.owner.y + dy;
		
		if(empty !== world[x][y]) {
			return false;
		}
		
		this.x = x;
		this.y = y;
		this.dx = dx;
		this.dy = dy;
		this.travelling = true;
		this.owner = null;
		this.show();

		return true;
	},
	private_halt: function() {
		this.dx = 0;
		this.dy = 0;
		this.travelling = false;
	},
	isPickup: function() {
		return !this.travelling;
	},
	pickup: function(owner) {
		world[this.x][this.y].hide();
		this.owner = owner;
		return this;
	}
});

var Ball = EXTENDS(ProjectileActor, {
	INIT: function(x, y) {
		this.SUPER(ProjectileActor.INIT, x, y, "Ball");
	},
	animation: function() {
		var projectile = this;
		
		var can_act = function(neighbour) {
			return empty !== neighbour &&
				!neighbour.isHittable()
		};
		
		var on_failure = function(neighbour) {
			projectile.private_halt();
		};
		
		var on_success = function(neighbour) {
			var hit_someone = false;
			if(neighbour.isHittable()) {
				neighbour.destroy();
				hit_someone = true;
			}
			
			projectile.private_move(projectile.dx, projectile.dy);

			if(hit_someone) {
				projectile.private_halt();
			}
		};
		
		this.SUPER(ProjectileActor.animation, BALL_SPEED, can_act, on_failure,
				   on_success);
	}
});


var Jerrycan = EXTENDS(MovableActor, {
	INIT: function(x, y) {
		this.SUPER(MovableActor.INIT, x, y, "Jerrycan", 0, 1);
	},
	move: function(dx, dy) {  
		var failure = function(neighbour) {
			return (dy < 0 && dx === 0) || empty !== neighbour;	
			};
		
		var failure_action = function(neighbour) {
		
			if(neighbour.isSmashable()) {
				neighbour.destroy();
			}
			
			return 0;
		};

		return this.SUPER(MovableActor.private_move, dx, dy, failure,
						  failure_action);
	},
	animation: function() {
		var jerrycan = this;
		
		var fails = function(neighbour) {
			return empty !== neighbour && !neighbour.isSmashable();
		}
		
		var on_success = function(neighbour) {
			if(neighbour.isSmashable()) {
				neighbour.destroy();
			}

			jerrycan.move(jerrycan.dx, jerrycan.dy);
		}
		
		this.SUPER(MovableActor.animation, WEIGHT_SPEED,
					fails, null, on_success);
	},
	grantsVictory: function() {
		return true;
	},
	destroy: function() {}
});

//Why not make the jerrycan a subclass
//of weight? Because despite both having
//similar physics (falling down and
//crushing things), they're different things [COMEBACK]
var Weight = EXTENDS(MovableActor, {
	INIT: function(x, y) {
		this.SUPER(MovableActor.INIT, x, y, "Weight", 0, 1);
	}, //ensures mover automatically dies on attempt to push up
	move: function(dx, dy) {
		var failure = function(neighbour) {
			return (dy < 0 && dx === 0) || empty !== neighbour;	
			};
		
		var failure_action = function(neighbour) {
		
			if(neighbour.isSmashable()) {
				neighbour.destroy();
			}
			
			return 0;
		};

		return this.SUPER(MovableActor.private_move, dx, dy, failure,
						  failure_action);
	},
	animation: function() {
		if(this.dying) {
			this.private_blink();
		}
		
		var weight = this;
		
		var fails = function(neighbour) {
			return empty !== neighbour && !neighbour.isSmashable();
		}
		
		var on_success = function(neighbour) {
			if(neighbour.isSmashable()) {
				neighbour.destroy();
			}

			weight.move(weight.dx, weight.dy);
		}
		
		
		this.SUPER(MovableActor.animation, WEIGHT_SPEED,
					fails, null, on_success);
	},
	destroy: function(killer) {
		var killer_is_below = (killer.x === this.x && killer.y === this.y + 1);
		
		if(killer_is_below && killer.isSmashable()) {
			killer.destroy();
		} else {
			this.SUPER(MovableActor.destroy);
		}
	},
	isCompressible: function() {
		return !this.dying;
	}
});

var Ballon = EXTENDS(MovableActor, {
	INIT: function(x, y) {
		this.SUPER(MovableActor.INIT, x, y, "Ballon", 0, -1);
	},
	animation: function() {
		if(this.dying) {
			this.private_blink();
		}
		
		var baloon = this;
		
		this.SUPER(MovableActor.animation, BALLON_SPEED,
					function(neighbour) {
						return empty !== neighbour && !neighbour.isLiftable();
					},
					null,
					function(neighbour) {
						if(neighbour.isLiftable()) {
							neighbour.destroy();
						}

						baloon.move(baloon.dx, baloon.dy);
		});
	},
	isCompressible: function() {
		return !this.dying;
	}
});

//olaceholder
var CharacterActor = EXTENDS(MovableActor, {
	//Notice how characters default to being stopped.
	//It's every "subclass"' responsability to
	//update its dx and dy.
	INIT: function(x, y, kind) {
		this.SUPER(MovableActor.INIT, x, y, kind, 0, 0);
	},
	//Why not allow characters to be moved?
	//Because they have their own agency ("free will")
	move: function() {
		return 0;
	},
	private_pathing: function(x_goal_dist, y_goal_dist) {		
		if(Math.abs(x_goal_dist) > Math.abs(y_goal_dist)) {
			//we're farther away in the x-axis, so that's where we
			//have to get closer
			this.dy = 0;
			this.dx = (x_goal_dist < 0 ? -1 : 1);
		} else if(Math.abs(x_goal_dist) < Math.abs(y_goal_dist)) {
			this.dx = 0;
			this.dy = (y_goal_dist < 0 ? -1 : 1);
		} else {	//Add a little randomness to the pathing
			var toss = rand(2);
	
			if(toss == 2) {
				this.dx = 0;
				this.dy = (y_goal_dist < 0 ? -1 : 1);
			} else {
				this.dy = 0;
				this.dx = (x_goal_dist < 0 ? -1 : 1); 
			}
		}
	}
});

//placeholder: EnemyActor and HeroActor

var Mammoth = EXTENDS(CharacterActor, {
	INIT: function(x, y) {
		this.SUPER(CharacterActor.INIT, x, y, "Mammoth");
	},
	animation: function() { 
		if(this.dying) {
			this.private_blink();
			return;
		}
		
		var x_dist = player.x - this.x;
		var y_dist = player.y - this.y;
		
		this.private_pathing(x_dist, y_dist);
		
		var mammoth = this;
		
		var adjacent_to_hero = function() {
			var x = mammoth.x;
			var y = mammoth.y;
			
			return world[x-1][y-1] === player ||
				world[x-1][y+1] === player ||
				world[x+1][y-1] === player ||
				world[x+1][y+1] === player;
		};
		
		var failure = function(neighbour) {
			return neighbour !== empty && !adjacent_to_hero() &&
				!neighbour.isBiteable();
		};	//last case isn't needed, but it makes this fucker more extensible
		
		var success_action = function(neighbour) {
			if(adjacent_to_hero() && player.isBiteable()) {
				player.destroy();
			}
			
			if(neighbour.isBiteable()) {
				neighbour.destroy();
			}

			mammoth.private_move(mammoth.dx, mammoth.dy);
		};
		
		this.SUPER(CharacterActor.animation, MAMMOTH_SPEED, failure, null,
				   success_action);
	},
	isSmashable: function() {
		return !this.dying;
	},
	isHittable: function() {
		return !this.dying;
	},
	isLiftable: function() {
		return !this.dying;
	}
});

var Baron = EXTENDS(CharacterActor, {
	projectiles: null,
	INIT: function(x, y) {
		this.SUPER(CharacterActor.INIT, x, y, "Baron");
		this.projectiles = [];
	},
	move: function(dx, dy) {
			return this.SUPER(MovableActor.move, dx, dy);
	},
	animation: function() {
		if(this.dying) {
			if(this.private_blink()) {
				control.restartLevel();
			}
			return;
		}
		
		var d = control.getKey();
		
		if(null !== d) {
			if(Array.isArray(d)) {
				this.dx = d[0];
				this.dy = d[1];
				
				var neighbour = world[this.x + this.dx][this.y + this.dy];

				//If there's nothing there, go there!
				if(empty === neighbour) {
					this.move(this.dx, this.dy);
				} else if(neighbour.isPickup() &&
						  this.projectiles.length < 10) {
					//If there's something we can pick up,
					//then go there and pick it up
					neighbour.pickup(this);
					this.projectiles.push(neighbour);

					this.move(this.dx, this.dy);
				} else if (!neighbour.isPickup()) {
					//If we can't go there nor
					//pick it up, then try moving it
					var moved = neighbour.move(this.dx, this.dy);

					if(moved > 0) {//If it moved, then go there
						this.move(this.dx, this.dy);
					} else if(0 === moved && neighbour.isCompressible()) {
						//if it didn't move, then destroy it
						neighbour.destroy(this);
					}
				}
			} else {
				switch(d) {
					case 'Z':
						if(0 !== this.projectiles.length) {				
							var projectile = this.projectiles[0];

							var success = projectile.fire(this.dx, this.dy);

							if(success) {
								this.projectiles.shift();
							}
						}
						break;
					default:
						break;
				}
			}
		}
	},
	destroy: function() {
		this.SUPER(CharacterActor.destroy);
	},
	isSmashable: function() {
		return !this.dying;
	},
	isBiteable: function() {
		return !this.dying;
	}
});

// GAME CONTROL

var GameControl = EXTENDS(JSRoot, {
	key: null,
	time: 0,
	level: 1,
	lives: 3,
	score: 0,
	INIT: function() {
		ctx = document.getElementById("canvas1").getContext("2d");
		empty = NEW(Empty);	// only one empty actor needed
		control = this;
		world = control.createWorld();
		
		control.lives = 3;
		control.time = 0;
		control.level = 1;
		control.score = 0;
		control.loadLevel(1);
		control.setupEvents();
	},
	createWorld: function () { // stored by columns
		var matrix = new Array(WORLD_WIDTH);
		for( var x = 0 ; x < WORLD_WIDTH ; x++ ) {
			var a = new Array(WORLD_HEIGHT);
			for( var y = 0 ; y < WORLD_HEIGHT ; y++ )
				a[y] = empty;
			matrix[x] = a;
		}
		return matrix;
	},
	loadLevel: function(level) {
		if( level < 1 || level > MAPS.length )
			fatalError("Invalid level " + level)
		var map = MAPS[level-1];  // -1 because levels start at 1
		for(var x=0 ; x < WORLD_WIDTH ; x++)
			for(var y=0 ; y < WORLD_HEIGHT ; y++) {
				world[x][y].hide;				
				var code = map[y][x];  // x/y reversed because map stored by lines
				var gi = GameImage.getByCode(code);
				if( gi ) {
					var a = NEW(globalByName(gi.kind), x, y);
					if( gi.kind == "Baron" )
						player = a;
				} else { 
					//This is a fix: The original code did not
					//recognise the '.' caracter, and so did
					//not fill the ctx with the empty image.
					//This defaults to drawing the empty image
					//when some symbol is not recognised.
					ctx.drawImage(empty.image, x * ACTOR_PIXELS_X, y *
								  ACTOR_PIXELS_Y);
				}
			}
	},
	getKey:  function() {
		var k = this.key;
		this.key = 0;
		switch( k ) {
			case 37: case 79: case 74: return [-1, 0]; //  LEFT, O, J
			case 38: case 81: case 73: return [0, -1]; //    UP, Q, I
			case 39: case 80: case 76: return [1, 0];  // RIGHT, P, L
			case 40: case 65: case 75: return [0, 1];  //  DOWN, A, K
			case 0: return null;
			default: return String.fromCharCode(k);
		};	
	},
	setupEvents: function() {
		addEventListener("keydown", this.keyDownEvent, false);
		addEventListener("keyup", this.keyUpEvent, false);
		setInterval(this.animationEvent, 1000 / ANIMATION_EVENTS_PER_SECOND);
	},
	animationEvent: function() {
		if(control.time === ANIMATION_EVENTS_PER_SECOND * SECONDS_PER_ROUND) {
			control.restartLevel();
		}
		
		control.time++;
		
		updatePageClock();
		
		for(var x=0 ; x < WORLD_WIDTH ; x++)
			for(var y=0 ; y < WORLD_HEIGHT ; y++) {
				var a = world[x][y];
				if( a.time < control.time ) {
					a.time = control.time;
					a.animation();
				}
			}
	},
	keyDownEvent: function(k) { control.key = k.keyCode; },
	keyUpEvent: function(k) { },
	advanceLevel: function() {/*placeholder*/ //[test]
		if(control.level === NUMBER_OF_LEVELS) {
			control.restartLevel();
		} else {
			++control.level;
			var old_time = control.time;

			changeLevel(control.level);

			control.score += (SECONDS_PER_ROUND -
							  Math.floor(old_time/ANIMATION_EVENTS_PER_SECOND))
							* POINTS_PER_SECOND;

			control.score += control.lives*POINTS_PER_LIFE;

			var level_selection = document.getElementById("select_level");
			level_selection.remove(0);

			document.getElementById("score").innerHTML = control.score;
		}
	},
	restartLevel: function() {
		control.lives -= 1;
		
		var lives = document.getElementById("lives");
		lives.removeChild(lives.firstChild);
		
		if(control.lives === 0 || control.level === NUMBER_OF_LEVELS) {
			alert("Game over! Score: " + control.score);
			restartGame();
		} else {
			changeLevel(control.level);
		}
	}
});

// HTML FORM

function updatePageClock() {		
		document.getElementById("current_time").innerHTML =
			SECONDS_PER_ROUND -
			Math.ceil(control.time/ANIMATION_EVENTS_PER_SECOND);
}

function onLoad() {
  // load images an then run the game
	GameImage.loadImages(function() {NEW(GameControl);});

}

//skip level
function skipLevel(l) {
	var level_selection = document.getElementById("select_level");

	for(var i = 0; i < (l - control.level); ++i) {
		level_selection.remove(0);
	}
	
	changeLevel(l);
}

function changeLevel(l) {
	control.key = null;
	control.time = 0;
	world = control.createWorld();
	control.loadLevel(l);
	player.projectiles = [];
	control.level = l;
	document.getElementById("level_info").innerHTML = l;
}

//diferente do restartLevel: esse recomeça o nível, descontando uma vida
//ao herói, etc. Este começa o jogo todo do início
function restartGame() {
	control.lives = 3;
	control.score = 0;

	//Fill the lifebar again
	var lives = document.getElementById("lives");
	while(lives.hasChildNodes()) {
		lives.removeChild(lives.firstChild);
	}
	
	for(var i = 0; i < control.lives; ++i) {
		var img_node = document.createElement("img");
		img_node.setAttribute("src",
							  "http://orig03.deviantart.net/9b11/f/2008/101/c/5/war_skull_16x16__by_xicidal.gif");
		
		lives.appendChild(img_node);
	}
	
	//Reset the dropdown level select menu
	var level_select = document.getElementById("select_level");
	while(level_select.hasChildNodes()) {
		level_select.removeChild(level_select.firstChild);
	}
	
	for(var i = 0; i < NUMBER_OF_LEVELS; ++i) {
		var option_node = document.createElement("OPTION");
		
		if(i === 1) {
			option_node.setAttribute("select", "selected");
		}
			
		option_node.setAttribute("value", i + 1);
		
		var text = document.createTextNode("Level " + (i +1));
		option_node.appendChild(text);
								 
		level_select.appendChild(option_node);
	}
	
	document.getElementById("score").innerHTML = control.score;
	changeLevel(1);
}
