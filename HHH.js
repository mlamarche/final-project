$(document).ready(function() {
    var theCanvas = document.getElementById('canvasOne');
    var context = theCanvas.getContext("2d")
    var usernamed = "";
    var allPlayers = {};
    var socket = io();
    var myID = "";
    var winner = "";
    var Hippos = "";
    var balls = "";
    var whatIsThis = "";

    // Uses Modernizr.js to check for canvas support
    function canvasSupport(test) {
        if (test) {
            return Modernizr.canvas;
        } else {
            //console.log("waiting to begin again");
        }
    }

    function createGuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0,
                v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    var canBegin = true;
    var numHippos = 0;

    intro();

    function begin(bal, Hipp, obj) {
        balls = bal;
        Hippos = Hipp;
        var waitingPlayers = obj["wait"];
        for (i = 0; i < waitingPlayers.length; i++) {
            waitingPlayers[i].state = "alive";
        }
        socket.emit('update state', allPlayers);
        canBegin = true;
        canvasApp(balls, Hippos);
    }


    $('button.begin').click(function() {
        socket.emit('start');
    });

    function resets() {
        //context.fillStyle = "black";
        //context.fillRect(0, 0, 1280, 720);
        canBegin = false;
        //$(".alive").empty();
        //$(".dead").empty();
    }

    function removeHippo(outID) {
        for (h = 0; h < Hippos.length; h++) {
            if (Hippos[h].id === outID) {
                Hippos.splice(h, 1);
            }
        }
    }

    function removeBall(newBall, oldBall) {
        for (b = 0; b < balls.length; b++) {
            if (balls[b].id === oldBall.id) {
                balls.splice(b, 1);
            }
        }
        balls.push(newBall)
    }

    function canvasApp(balls, Hippos) {
        //Check for canvas support
        if (!canvasSupport(canBegin)) {
            return;
        } else {
            // Grab the canvas and set the context to 2d
            //theCanvas.width = window.innerWidth - 300;
            //theCanvas.height = window.innerHeight;
            $(context).css("width", "100%").css("background-color", "white");
        }

        function hitTestCircle(ball1, ball2) {
            var retVal = false;
            var dx = ball1.nextX - ball2.nextX;
            var dy = ball1.nextY - ball2.nextY;
            var distance = (dx * dx + dy * dy);
            if (distance <= (ball1.radius + ball2.radius) * (ball1.radius + ball2.radius)) {
                retVal = true;
            }
            return retVal;
        }
        $(window).keydown(function(e) {
            var currentPlace = "";
            for (i = 0; i < Hippos.length; i++) {
                if (Hippos[i].id === myID) {
                    currentPlace = i;
                    //console.log("You are at", currentPlace)
                }
            }
            if (Hippos.length > 1) {
                if (e.keyCode === 37) {
                    console.log("moving left");
                    //console.log(Hippos[currentPlace])
                    //if (Hippos[currentPlace].velocityX > -10) {
                    Hippos[currentPlace].velocityX--;
                    // }
                }
                if (e.keyCode === 38) {
                    console.log("moving up");
                    //if (Hippos[currentPlace].velocityY > -10) {
                    Hippos[currentPlace].velocityY--;
                    //}
                }
                if (e.keyCode === 39) {
                    console.log("moving right");
                    //if (Hippos[currentPlace].velocityX < 10) {
                    Hippos[currentPlace].velocityX++;
                    //}
                }
                if (e.keyCode === 40) {
                    console.log("moving down");
                    //if (Hippos[currentPlace].velocityY < 10) {
                    Hippos[currentPlace].velocityY++;
                    //}
                }
                Hippos[currentPlace].nextX = (Hippos[currentPlace].x += Hippos[currentPlace].velocityX);
                Hippos[currentPlace].nextY = (Hippos[currentPlace].y += Hippos[currentPlace].velocityY);
                $(window).keyup(function(e) {
                    if (Hippos.length > 1) {
                        if (e.keyCode === 37 || e.keyCode === 39) {
                            Hippos[currentPlace].velocityX = 0;
                        }
                        if (e.keyCode === 38 || e.keyCode === 40) {
                            Hippos[currentPlace].velocityY = 0;
                        }
                    }
                })
                console.log(Hippos[currentPlace].x, Hippos[currentPlace].y)
                socket.emit('my position', Hippos[currentPlace].x, Hippos[currentPlace].y, myID)
            }
        })

        function collideBalls(ball1, ball2) {
            var w = theCanvas.width,
                h = theCanvas.height;

            var scale = Math.min(w / 1280, h / 720);

            var nw = w * scale,
                nh = h * scale;

            var dx = ball1.nextX * scale - ball2.nextX * scale;
            var dy = ball1.nextY * scale - ball2.nextY * scale;
            var collisionAngle = Math.atan2(dy, dx);

            // Get velocities of each ball before collision
            var speed1 = Math.sqrt(ball1.velocityX * ball1.velocityX + ball1.velocityY * ball1.velocityY);
            var speed2 = Math.sqrt(ball2.velocityX * ball2.velocityX + ball2.velocityY * ball2.velocityY);

            // Get angles (in radians) for each ball, given current velocities
            var direction1 = Math.atan2(ball1.velocityY, ball1.velocityX);
            var direction2 = Math.atan2(ball2.velocityY, ball2.velocityX);

            // Rotate velocity vectors so we can plug into equation for conservation of momentum
            var rotatedVelocityX1 = speed1 * Math.cos(direction1 - collisionAngle);
            var rotatedVelocityY1 = speed1 * Math.sin(direction1 - collisionAngle);
            var rotatedVelocityX2 = speed2 * Math.cos(direction2 - collisionAngle);
            var rotatedVelocityY2 = speed2 * Math.sin(direction2 - collisionAngle);

            // Update actual velocities using conservation of momentum
            /* Uses the following formulas:
           velocity1 = ((mass1 - mass2) * velocity1 + 2*mass2 * velocity2) / (mass1 + mass2)
           velocity2 = ((mass2 - mass1) * velocity2 + 2*mass1 * velocity1) / (mass1 + mass2)*/
            var finalVelocityX1 = ((ball1.mass - ball2.mass) * rotatedVelocityX1 + (ball2.mass + ball2.mass) * rotatedVelocityX2) / (ball1.mass + ball2.mass);
            var finalVelocityX2 = ((ball1.mass + ball1.mass) * rotatedVelocityX1 + (ball2.mass - ball1.mass) * rotatedVelocityX2) / (ball1.mass + ball2.mass);

            // Y velocities remain constant
            var finalVelocityY1 = rotatedVelocityY1;
            var finalVelocityY2 = rotatedVelocityY2;

            // Rotate angles back again so the collision angle is preserved
            ball1.velocityX = Math.cos(collisionAngle) * finalVelocityX1 + Math.cos(collisionAngle + Math.PI / 2) * finalVelocityY1;
            ball1.velocityY = Math.sin(collisionAngle) * finalVelocityX1 + Math.sin(collisionAngle + Math.PI / 2) * finalVelocityY1;
            ball2.velocityX = Math.cos(collisionAngle) * finalVelocityX2 + Math.cos(collisionAngle + Math.PI / 2) * finalVelocityY2;
            ball2.velocityY = Math.sin(collisionAngle) * finalVelocityX2 + Math.sin(collisionAngle + Math.PI / 2) * finalVelocityY2;

            // Update nextX and nextY for both balls so we can use them in render() or another collision
            ball1.nextX += ball1.velocityX;
            ball1.nextY += ball1.velocityY;
            ball2.nextX += ball2.velocityX;
            ball2.nextY += ball2.velocityY;
        }
        var hitHippoBall = function(ball1, hippo1) {
            var retVal = false;
            var w = theCanvas.width,
                h = theCanvas.height;

            var scale = Math.min(w / 1280, h / 720);
            //var scale = w * 720 / 1280;
            var nw = w * scale,
                nh = h * scale;
            var dxx = ball1.nextX * scale - hippo1.nextX * scale;
            var dyy = ball1.nextY * scale - hippo1.nextY * scale;
            var distance = (dxx * dxx + dyy * dyy);
            if (distance <= (ball1.radius + hippo1.radius) * (ball1.radius + hippo1.radius)) {
                retVal = true;
            }
            return retVal;
        }
        var collideBallsHippo = function(ball1, hippo1) {
            // console.log("collision");
            ball1.velocityX = 0;
            ball1.velocityY = 0;
            if (myID === hippo1.id) {
                socket.emit('remove ball', ball1)
                //removeBall(ball1);
                socket.emit('remove hippo', hippo1)
                //removeHippo(hippo1);
                //ballCount(); server
            }
        }

            function update() {
                for (var i = 0; i < balls.length; i += 1) {
                    ball = balls[i];
                    ball.nextX = (ball.x += ball.velocityX);
                    ball.nextY = (ball.y += ball.velocityY);
                }

                var w = window.innerWidth - 300,
                    h = window.innerHeight;

                var scale = Math.min(w / 1280, h / 720);


                $(theCanvas).css("width", Math.floor(1280 * scale) + "px").css("height", Math.floor(720 * scale) + "px");


                //theCanvas.width = window.innerWidth - 300;
                //theCanvas.height = window.innerHeight;
            }

            function testWalls() {
                var ball;
                var testBall;
                var datHippo;
                var w = theCanvas.width,
                    h = theCanvas.height;

                var scale = Math.min(w / 1280, h / 720);

                var nw = w * scale,
                    nh = h * scale;

                for (var i = 0; i < balls.length; i += 1) {
                    ball = balls[i];

                    if (ball.nextX * scale + ball.radius > 1280) { // right wall
                        ball.velocityX = ball.velocityX * (-1);
                        ball.nextX = 1280 - ball.radius;

                    } else if (ball.nextX - ball.radius < 0) { // top wall
                        ball.velocityX = ball.velocityX * (-1);
                        ball.nextX = ball.radius;

                    } else if (ball.nextY + ball.radius > 720) { // bottom wall
                        ball.velocityY = ball.velocityY * (-1);
                        ball.nextY = 720 - ball.radius;

                    } else if (ball.nextY - ball.radius < 0) { // left wall
                        ball.velocityY = ball.velocityY * (-1);
                        ball.nextY = ball.radius;
                    }

                }
                for (var i = 0; i < Hippos.length; i += 1) {
                    datHippo = Hippos[i];
                    if (datHippo.nextX * scale + datHippo.radius > 1280) { // right wall
                        datHippo.velocityX = datHippo.velocityX * (-1);
                        datHippo.nextX = 1280 - datHippo.radius;
                    } else if (datHippo.nextX - datHippo.radius < 0) { // top wall
                        datHippo.velocityX = datHippo.velocityX * (-1);
                        datHippo.nextX = datHippo.radius;
                    } else if (datHippo.nextY + datHippo.radius > 720) { // bottom wall
                        datHippo.velocityY = datHippo.velocityY * (-1);
                        datHippo.nextY = 720 - datHippo.radius;
                    } else if (datHippo.nextY - datHippo.radius < 0) { // left wall
                        datHippo.velocityY = datHippo.velocityY * (-1);
                        datHippo.nextY = datHippo.radius;
                    }
                }
            }

            function collide() {
                var ball;
                var testBall;
                for (var i = 0; i < balls.length; i += 1) {
                    ball = balls[i];
                    for (var j = i + 1; j < balls.length; j += 1) {
                        testBall = balls[j];
                        if (hitTestCircle(ball, testBall)) {
                            collideBalls(ball, testBall);
                        }
                    }
                }
            }
        var collideHippo = function() {
            var ball;
            var Hippo;
            for (var i = 0; i < balls.length; i += 1) {
                ball = balls[i];
                for (var j = 0; j < Hippos.length; j += 1) {
                    hippo = Hippos[j];
                    if (hitHippoBall(ball, hippo)) {
                        // console.log("Collision")
                        collideBallsHippo(ball, hippo);
                    }
                }
            }
        }

            function renderBall() {
                var ball;

                var w = theCanvas.width,
                    h = theCanvas.height;

                var scale = Math.min(w / 1280, h / 720);

                var nw = w * scale,
                    nh = h * scale;

                context.fillStyle = "red";
                for (var i = 0; i < balls.length; i += 1) {
                    ball = balls[i];
                    ball.x = ball.nextX;
                    ball.y = ball.nextY;

                    context.beginPath();
                    context.arc(ball.x * scale, ball.y * scale, ball.radius, 0, Math.PI * 2, true);
                    context.closePath();
                    context.fill();
                }
            }
        var renderHippo = function() {
            var Hippo;
            var w = theCanvas.width,
                h = theCanvas.height;

            var scale = Math.min(w / 1280, h / 720);

            var nw = w * scale,
                nh = h * scale;
            for (var i = 0; i < Hippos.length; i += 1) {
                if (Hippos[i].id === myID) {
                    context.fillStyle = "#00FF00";
                } else {
                    context.fillStyle = "#0000FF";
                }
                Hippo = Hippos[i];
                Hippo.x = Hippo.nextX;
                Hippo.y = Hippo.nextY;

                context.beginPath();
                context.arc(Hippo.x * scale, Hippo.y * scale, 20, 0, Math.PI * 2, true);
                context.closePath();
                context.fill();
            }
        }

            function drawScreen() {
                //console.log("Drawing");
                // Reset canvas
                context.fillStyle = "#FFFFFF";
                context.fillRect(0, 0, 1280, 720);

                // Outside border
                context.strokeStyle = "#FF0000";
                context.strokeRect(1, 1, 1280 - 2, 720 - 2);
                /*for (name in allPlayers) {
                    console.log(allPlayers[name].state);
                }*/
                //console.log("rendering");
                if (Hippos.length === 1) {
                    console.log("The game is over")
                    if (Hippos[0].id === myID) {
                        socket.emit('game over', Hippos[0].name);
                        console.log("CONGRATULATIONS CHAMPION. YOU ARE OUR WINNER")
                    }
                    Hippos = [];
                    balls = [];
                    clearInterval(whatIsThis);
                    numHippos = 0;
                }
                if (canBegin === true) {
                    //console.log("Hippos: ", Hippos, "Balls: ", balls.length);
                    update();
                    testWalls();
                    collide();
                    collideHippo();
                    renderBall();
                    renderHippo();
                } else {
                    return;
                }
            }

        whatIsThis = setInterval(drawScreen, 33);
    }

    function intro() {
        var FADE_TIME = 150; // ms
        var TYPING_TIMER_LENGTH = 300; // ms
        var COLORS = [
            '#e21400', '#91580f', '#f8a700', '#f78b00',
            '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
            '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
        ];

        // Initialize varibles
        var $window = $(window);
        var $usernameInput = $('.usernameInput'); // Input for username
        var $loginPage = $('.login.page'); // The login page
        var $game = $('.game');

        // Prompt for setting a username
        var connected = false;
        var typing = false;
        var lastTypingTime;
        var $currentInput = $usernameInput.focus();

        // Sets the client's username
        function setUsername() {
            usernamed = $usernameInput.val().trim();
            // If the username is valid
            if (usernamed) {
                $loginPage.fadeOut();
                $game.show();
                // canvasApp(); //Here I call The game page
                $loginPage.off('click');

                // Tell the server your username
                myID = createGuid();
                socket.emit('add user', usernamed, myID);
            }
        }

        // Keyboard events

        $window.keydown(function(event) {
            // Auto-focus the current input when a key is typed
            if (!(event.ctrlKey || event.metaKey || event.altKey)) {
                $currentInput.focus();
            }
            // When the client hits ENTER on their keyboard
            if (event.which === 13) {
                if (usernamed) {
                    sendMessage();
                    typing = false;
                } else {
                    setUsername();

                }
            }
        });

        // Click events

        // Focus input when clicking anywhere on login page
        $loginPage.click(function() {
            $currentInput.focus();
        });

        // Socket events
        socket.on('numPlayers', function(numPlays) {
            //console.log("inside numPlayers")
            numHippos = numPlays;
        });
        socket.on('frodo', function(usernames) {
            //console.log("i went into frodo");
            allPlayers = (usernames);
        });
        socket.on('begin', function(balls, Hippos, obj) {
            //console.log("Got balls", balls);
            begin(balls, Hippos, obj);
        });
        socket.on('end', function(winner) {
            //console.log(winner, " is the champion");
            resets();
        });
        socket.on('moves', function(posX, posY, theirID) {
            var place = -1;
            for (z = 0; z < Hippos.length; z++) {
                if (Hippos[z].id === theirID) {
                    console.log(Hippos[z].name, " is moving to ( ", posX, ", ", posY, ")");
                    if (Hippos[z].id !== myID) {
                        place = z;
                    }
                }
            }
            if (place === -1) {
                return;
            }
            Hippos[place].velocityX = posX - Hippos[place].x;
            Hippos[place].velocityY = posY - Hippos[place].y;
            Hippos[place].nextX = Hippos[place].x += Hippos[place].velocityX;
            Hippos[place].nextY = Hippos[place].y += Hippos[place].velocityY;
            // Hippos[place].nextX = posX;
            // Hippos[place].nextX = posY;
        })
        socket.on('im out', function(outID) {
            removeHippo(outID);
        });
        socket.on('new ball', function(newBall, ball1) {
            //console.log("A new ball has been generated")
            removeBall(newBall, ball1);
        });
        socket.on('update bar', function(objs) {
            //console.log("Inside update bar")
            //console.log(objs)
            $('.alive').empty();
            $('.dead').empty();
            $('.waits').empty();
            var count = 0;
            for (key in objs) {
                count++;
                //console.log(objs[key].length);
                if (objs[key].length > 0) {
                    if (key === "alive") {
                        for (i = 0; i < objs[key].length; i++) {
                            var $os = $('<li>').addClass('log').text(objs[key][i].name)
                            $('.alive').append($os);
                        }
                    } else if (key === "dead") {
                        for (i = 0; i < objs[key].length; i++) {
                            var $os = $('<li>').addClass('log').text(objs[key][i].name)
                            $('.dead').append($os);
                        }
                    } else if (key === "wait") {
                        for (i = 0; i < objs[key].length; i++) {
                            var $os = $('<li>').addClass('log').text(objs[key][i].name)
                            $('.waits').append($os);
                        }
                    }
                }
            }
        });

        // Whenever the server emits 'login', log the login message
        /*     socket.on('login', function(data) {
            connected = true;
        });

        // Whenever the server emits 'user joined', log it in the chat body
        socket.on('user joined', function(data) {

        });

        // Whenever the server emits 'user left', log it in the chat body
        socket.on('user left', function(data) {

        });*/
    }
});