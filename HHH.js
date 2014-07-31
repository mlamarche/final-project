$(document).ready(function() {
    var theCanvas = document.getElementById('canvasOne');
    var context = theCanvas.getContext("2d")
    var usernamed = "";
    var myColor = "";
    var socket = io();
    var myID = "";
    var winner = "";
    var Hippos = [];
    var balls = [];
    var whatIsThis = "";
    var timesRendered = 0;
    var invincible = false;


    // Uses Modernizr.js to check for canvas support
    function canvasSupport(test) {
        if (test) {
            return Modernizr.canvas;
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
    $('#regButt').on("click", function() {
        socket.emit('wants', true, myID);
    });
    $('#blackButt').on("click", function() {
        socket.emit('wants', false, myID);
    });
    $('#regButts').on("click", function() {
        socket.emit('wants', true, myID);
    });
    $('#blackButts').on("click", function() {
        socket.emit('wants', false, myID);
    });

    function begin(bal, Hipp, obj) {
        $('.countDownBox').empty();
        $('#myModal').modal('hide');
        $('#myWant').modal('hide');
        balls = bal;
        Hippos = Hipp;
        var waitingPlayers = obj["wait"];
        for (i = 0; i < waitingPlayers.length; i++) {
            waitingPlayers[i].state = "alive";
        }
        canBegin = true;
        canvasApp(balls, Hippos);
    }

    function resets() {
        canBegin = false;
        $('.theWinner').empty();
        $('.theWinner').text(winner + " is the Winner");
        $('#myModal').modal('show');
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

    function getCurrentPlace(anID) {
        var hold = -1;
        for (index = 0; index < Hippos.length; index++) {
            if (Hippos[index].id === anID) {
                hold = index;
            }
        }
        return hold;
    }

    function canvasApp(balls, Hippos) {
        //Check for canvas support
        if (!canvasSupport(canBegin)) {
            return;
        } else {
            // Grab the canvas and set the context to 2d
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

        $(window).keyup(function(e) {
            var currentPlace = getCurrentPlace(myID);
            if (currentPlace === -1) {
                return;
            }
            if (Hippos.length > 1) {
                if (e.keyCode === 37 || e.keyCode === 39) {
                    //Hippos[currentPlace].velocityX = 0;
                    if (e.keyCode === 37) {
                        Hippos[currentPlace].isLeft = false;
                        socket.emit('left', Hippos[currentPlace].isLeft, myID);
                    }
                    if (e.keyCode === 39) {
                        Hippos[currentPlace].isRight = false;
                        socket.emit('right', Hippos[currentPlace].isRight, myID);
                    }
                }
                if (e.keyCode === 38 || e.keyCode === 40) {
                    //Hippos[currentPlace].velocityY = 0;
                    if (e.keyCode === 38) {
                        Hippos[currentPlace].isUp = false;
                        socket.emit('up', Hippos[currentPlace].isUp, myID);
                    }
                    if (e.keyCode === 40) {
                        Hippos[currentPlace].isDown = false;
                        socket.emit('down', Hippos[currentPlace].isDown, myID);
                    }
                }
                /*if (e.keyCode === 32) {
                    socket.emit('invincible');
                }*/
            }
        })
        $(window).keydown(function(e) {
            var currentPlace = getCurrentPlace(myID);
            if (currentPlace === -1) {
                return;
            }
            if (canBegin === true) {
                if (Hippos.length > 1) {
                    if (e.keyCode === 37) {
                        if (Hippos[currentPlace].isLeft === false) {
                            //if (Hippos[currentPlace].velocityX > -10) {
                            //Hippos[currentPlace].velocityX--;
                            //}
                            Hippos[currentPlace].isLeft = true;
                            socket.emit('left', Hippos[currentPlace].isLeft, myID);
                        }
                    }
                    if (e.keyCode === 38) {
                        if (Hippos[currentPlace].isUp === false) {
                            //if (Hippos[currentPlace].velocityY > -10) {
                            Hippos[currentPlace].isUp = true;
                            // Hippos[currentPlace].velocityY--;
                            //}
                            socket.emit('up', Hippos[currentPlace].isUp, myID);
                        }
                    }
                    if (e.keyCode === 39) {
                        console.log("xxxxxxxxx", Hippos, currentPlace);
                        if (Hippos[currentPlace].isRight === false) {
                            //if (Hippos[currentPlace].velocityX < 10) {
                            Hippos[currentPlace].isRight = true;
                            //Hippos[currentPlace].velocityX++;
                            //}
                            socket.emit('right', Hippos[currentPlace].isRight, myID);
                        }
                    }
                    if (e.keyCode === 40) {
                        if (Hippos[currentPlace].isDown === false) {
                            Hippos[currentPlace].isDown = true;
                            //if (Hippos[currentPlace].velocityY < 10) {
                            //Hippos[currentPlace].velocityY++;
                            //}
                            socket.emit('down', Hippos[currentPlace].isDown, myID);
                        }
                    }
                }
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
            ball1.velocityX = 0;
            ball1.velocityY = 0;
            if (myID === hippo1.id) {
                socket.emit('remove ball', ball1)
                socket.emit('remove hippo', hippo1)
            }
        }

            function isMove(hipper) {
                if (hipper.velocityX !== 0) {
                    if (hipper.isLeft === false && hipper.isRight === false) {
                        hipper.velocityX = hipper.velocityX * .90;
                    }
                    if (hipper.velocityX < .5 && hipper.velocityX > -.5) {
                        hipper.velocityX = 0;
                    }
                }
                if (hipper.velocityY !== 0) {
                    if (hipper.isUp === false && hipper.isDown === false) {
                        hipper.velocityY = hipper.velocityY * .90;
                    }
                    if (hipper.velocityY < .5 && hipper.velocityY > -.5) {
                        hipper.velocityY = 0;
                    }
                }
                if (hipper.isRight === true) {
                    if (hipper.velocityX < 1 && hipper.velocityX >= 0) {
                        hipper.velocityX = 5;
                    }
                    if (hipper.velocityX < 15) {
                        hipper.velocityX++;
                    }
                }
                if (hipper.isLeft === true) {
                    if (hipper.velocityX > -1 && hipper.velocityX <= 0) {
                        hipper.velocityX = -5;
                    }
                    if (hipper.velocityX > -15) {
                        hipper.velocityX--;
                    }
                }
                if (hipper.isUp === true) {
                    if (hipper.velocityY > -1 && hipper.velocityY <= 0) {
                        hipper.velocityY = -5;
                    }
                    if (hipper.velocityY > -15) {
                        hipper.velocityY--;
                    }

                }
                if (hipper.isDown === true) {
                    //console.log(Hippos)
                    if (hipper.velocityY < 1 && hipper.velocityY >= 0) {
                        hipper.velocityY = 5;
                    }
                    if (hipper.velocityY < 15) {
                        hipper.velocityY++;
                    }
                }

            }

            function positionFunction() {
                var temp = -1;
                temp = getCurrentPlace(myID);
                //console.log(Hippos[temp], temp, Hippos.length)
                if (temp != -1) {
                    if (Hippos.length > 0) {
                        if ((Hippos[temp].isRight === true || Hippos[temp].isLeft === true || Hippos[temp].isUp === true || Hippos[temp].isDown === true) || (Hippos[temp].velocityX != 0 || Hippos[temp].velocityY != 0)) {
                            Hippos[temp].nextX = (Hippos[temp].x += Hippos[temp].velocityX);
                            Hippos[temp].nextY = (Hippos[temp].y += Hippos[temp].velocityY);
                            socket.emit('my position', Hippos[temp].nextX, Hippos[temp].nextY, myID)
                        }
                    }
                }
            }

            function update() {
                for (var i = 0; i < balls.length; i += 1) {
                    ball = balls[i];
                    ball.nextX = (ball.x += ball.velocityX);
                    ball.nextY = (ball.y += ball.velocityY);
                }
                for (j = 0; j < Hippos.length; j++) {
                    isMove(Hippos[j])
                }

                var w = window.innerWidth - 300,
                    h = window.innerHeight;

                var scale = Math.min(w / 1280, h / 720);


                $(theCanvas).css("width", Math.floor(1280 * scale) + "px").css("height", Math.floor(720 * scale) + "px");
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
                        if (ball.velocityX < 40 && ball.velocityX > -40) {
                            ball.velocityX = ball.velocityX * (-1.1);
                        } else {
                            ball.velocityX = ball.velocityX * (-1);
                        }
                        ball.nextX = 1280 - ball.radius;

                    } else if (ball.nextX - ball.radius < 0) { // left wall
                        if (ball.velocityX < 40 && ball.velocityX > -40) {
                            ball.velocityX = ball.velocityX * (-1.1);
                        } else {
                            ball.velocityX = ball.velocityX * (-1);
                        }
                        ball.nextX = ball.radius;

                    } else if (ball.nextY + ball.radius > 720) { // bottom wall
                        if (ball.velocityY < 40 && ball.velocityY > -40) {
                            ball.velocityY = ball.velocityY * (-1.1);
                        } else {
                            ball.velocityY = ball.velocityY * (-1);
                        }
                        ball.nextY = 720 - ball.radius;

                    } else if (ball.nextY - ball.radius < 0) { // top wall
                        if (ball.velocityY < 40 && ball.velocityY > -40) {
                            ball.velocityY = ball.velocityY * (-1.1);
                        } else {
                            ball.velocityY = ball.velocityY * (-1);
                        }
                        ball.nextY = ball.radius;
                    }

                }
                for (var i = 0; i < Hippos.length; i += 1) {
                    datHippo = Hippos[i];
                    if (datHippo.nextX + datHippo.radius > 1280) { // right wall
                        datHippo.velocityX = datHippo.velocityX * (-1);
                        datHippo.nextX = 1280 - datHippo.radius;

                    } else if (datHippo.nextX - datHippo.radius < 0) { // left wall
                        datHippo.velocityX = datHippo.velocityX * (-1);
                        datHippo.nextX = datHippo.radius;

                    } else if (datHippo.nextY + datHippo.radius > 720) { // bottom wall
                        datHippo.velocityY = datHippo.velocityY * (-1);
                        datHippo.nextY = 720 - datHippo.radius;

                    } else if (datHippo.nextY - datHippo.radius < 0) { // top wall
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
                for (var i = 0; i < Hippos.length; i += 1) {
                    ball = Hippos[i];
                    for (var j = i + 1; j < Hippos.length; j += 1) {
                        testBall = Hippos[j];
                        if (hitTestCircle(ball, testBall)) {
                            //console.log("Hippos Hit!!!");
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
                Hippo = Hippos[i];
                var image = new Image(Hippo.radius, Hippo.radius);
                image.src = 'myStar.png';
                //image.style = "width: " + Hippo.radius + "px";

                /*if (Hippo.id === myID) {
                    context.arc(Hippo.x, Hippo.y, Hippo.radius + 10, 0, 2 * Math.PI)
                }*/
                context.fillStyle = Hippo.color;
                //console.log(Hippo.color)
                Hippo.x = Hippo.nextX;
                Hippo.y = Hippo.nextY;

                context.beginPath();
                context.arc(Hippo.x * scale, Hippo.y * scale, 20, 0, Math.PI * 2, true);
                //context.globalCompositeOperation = 'source-in';

                //context.globalCompositeOperation = 'source-over';
                context.closePath();

                context.fill();
                if (Hippo.id === myID) {
                    context.drawImage(image, Hippo.x - Hippo.radius, Hippo.y - Hippo.radius, 2 * Hippo.radius, 2 * Hippo.radius)
                }
            }
        }



            function drawScreen() {
                //console.log("rendering")
                // Reset canvas
                context.fillStyle = "#FFFFFF";
                context.fillRect(0, 0, 1280, 720);

                // Outside border
                context.strokeStyle = "#FF0000";
                context.strokeRect(1, 1, 1280 - 2, 720 - 2);
                if (Hippos.length === 1) {
                    if (Hippos[0].id === myID) {
                        socket.emit('game over', Hippos[0].name);
                        //gameOver(Hippos[0].name);
                        canBegin = false;
                    }
                    Hippos = [];
                    balls = [];
                    clearInterval(whatIsThis);
                    numHippos = 0;
                    winner = "";
                }
                if (canBegin === true) {
                    timesRendered++;
                    if (timesRendered % 100 === 0) {
                        var meh = getCurrentPlace(myID);
                        if (meh === 0) {
                            socket.emit('record', Hippos, balls);
                        }
                    }
                    update();
                    testWalls();
                    collide();
                    if (invincible === false) {
                        collideHippo();
                    }
                    renderBall();
                    renderHippo();
                    positionFunction();
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
                $loginPage.off('click');
                var rand = Math.random() * (COLORS.length - 1);
                rand = Math.floor(rand);
                myColor = COLORS[rand];
                // Tell the server your username
                myID = createGuid();
                console.log(rand)
                socket.emit('add user', usernamed, myID, myColor);
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
            //console.log("num lpayers")
            numHippos = numPlays;
        });
        socket.on('frodo', function(usernames) {
            //console.log("frodo")
            //allPlayers = (usernames);
        });
        socket.on('begin', function(balls, Hippos, obj) {
            //console.log("begin")
            begin(balls, Hippos, obj);
        });
        socket.on('end', function(winners) {
            winner = winners
            //console.log("end")
            resets();
        });
        socket.on('moves', function(nextX, nextY, theirID) {
            //console.log("moving")
            var place = getCurrentPlace(theirID);
            if (place != -1) {
                Hippos[place].nextX = nextX;
                Hippos[place].nextY = nextY;
            }
            if (theirID === myID) {
                //console.log("you do not exist", place);
            } else {
                //console.log(theirID, "does not exist", place)
            }
        })
        socket.on('im out', function(outID) {
            //console.log("im out")
            removeHippo(outID);
        });
        socket.on('movingUp', function(isOn, theirID) {
            //console.log("up")
            var place = -1;
            if (theirID != myID) {
                place = getCurrentPlace(theirID)
            } else {
                return;
            }
            Hippos[place].isUp = isOn;
        });
        socket.on('movingDown', function(isOn, theirID) {
            //console.log("down")
            var place = -1;
            if (theirID != myID) {
                place = getCurrentPlace(theirID)
            } else {
                return;
            }
            Hippos[place].isDown = isOn;
        });
        socket.on('movingLeft', function(isOn, theirID) {
            //console.log("left")
            var place = -1;
            if (theirID != myID) {
                place = getCurrentPlace(theirID)
            } else {
                return;
            }
            Hippos[place].isLeft = isOn;
        });
        socket.on('movingRight', function(isOn, theirID) {
            //console.log("right")
            var place = -1;
            if (theirID != myID) {
                place = getCurrentPlace(theirID)
            } else {
                return;
            }
            Hippos[place].isRight = isOn;
        });
        socket.on('new ball', function(newBall, ball1) {
            //console.log("new balls")
            removeBall(newBall, ball1);
        });
        socket.on('invincibles', function(inv) {
            //console.log("invincibles")
            invincible = inv;
        });
        socket.on('counting down', function(bigCount) {
            console.log("Starting game in ", bigCount)
            $('.countDownBox').empty();
            $('.countDownBox').text(bigCount);
        });
        socket.on('notEnoughPlayers', function() {
            $('#myModal').modal('hide');
            $('#myWant').modal('show');
        });
        socket.on('update bar', function(objs) {
            $('.alive').empty();
            $('.dead').empty();
            $('.waits').empty();
            var count = 0;
            console.log(objs)
            for (key in objs) {
                count++;
                if (objs[key].length > 0) {
                    if (key === "alive") {
                        for (i = 0; i < objs[key].length; i++) {
                            var $os = $('<li>').addClass('log').text(objs[key][i].name).css("background-color", objs[key][i].color);
                            $('.alive').append($os);
                        }
                    } else if (key === "dead") {
                        for (i = 0; i < objs[key].length; i++) {
                            var $os = $('<li>').addClass('log').text(objs[key][i].name).css("background-color", objs[key][i].color);
                            $('.dead').append($os);
                        }
                    } else if (key === "wait") {
                        for (i = 0; i < objs[key].length; i++) {
                            var $os = $('<li>').addClass('log').text(objs[key][i].name).css("background-color", objs[key][i].color);
                            $('.waits').append($os);
                        }
                    }
                }
            }
        });
    }
});