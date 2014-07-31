var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;
app.get('/', function(req, res) {
    res.sendfile('Game.html');
});
app.get('/m', function(req, res) {
    res.sendfile('Game-Mobile.html');
});
app.get('/HHH.js', function(req, res) {
    res.sendfile('HHH.js');
});
app.get('/HHH.css', function(req, res) {
    res.sendfile('HHH.css');
});
app.get('/1.7.2jquery.min.js', function(req, res) {
    res.sendfile('1.7.2jquery.min.js');
});
app.get('/Modernizr.js', function(req, res) {
    res.sendfile('Modernizr.js');
});
app.get('/myStar.png', function(req, res) {
    res.sendfile('myStar.png');
});
server.listen(port, function() {
    console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

var usernames = [];
var numUsers = 0;
var aliveHippos = 0;

var numBalls = 20; // number of balls 200
//    var maxSize = 15;
//    var minSize = 5;
//    var maxSpeed = 20;
//maxSize + 5;

var mapx = 1280,
    mapy = 720;
var obj = {
    "wait": [],
    "alive": [],
    "dead": []
}
var allPlayers = [];

var balls = new Array();
var Hippos = new Array();
var invincible = false;
var numWants = [];
var gameON = false;
var beginCountDown = true;
var countingDown = 5;
var tempBall;
var tempX;
var tempY;
var placeOK;
var tempSpeed;
var tempAngle;
var tempRadius;
var tempRadians;
var tempVelocityX;
var tempVelocityY;

var tempHippo;
var tempXHippo;
var tempYHippo;
var tempSpeedHippo;
var tempAngleHippo;
var tempRadiusHippo;
var tempRadiansHippo;
var tempVelocityXHippo;
var tempVelocityYHippo;
var tempHippoCounter;

var generateBall = function() {
    tempRadius = 5;
    tempX = tempRadius * 3 + (Math.floor(Math.random() * ((mapx - 300) / 8) + (mapx - 300) * 7 / 16) - tempRadius * 3);
    tempY = tempRadius * 3 + (Math.floor(Math.random() * ((mapy) / 8) + (mapy) * 7 / 16) - tempRadius * 3);
    tempSpeed = 4;
    tempAngle = Math.floor(Math.random() * 360);
    tempRadians = tempAngle * Math.PI / 180;
    tempVelocityX = Math.cos(tempRadians) * tempSpeed;
    tempVelocityY = Math.sin(tempRadians) * tempSpeed;

    tempBall = {
        x: tempX,
        y: tempY,
        nextX: tempX,
        nextY: tempY,
        radius: tempRadius,
        speed: tempSpeed,
        angle: tempAngle,
        velocityX: tempVelocityX,
        velocityY: tempVelocityY,
        mass: tempRadius,
        id: createGuid()
    };
    placeOK = canStartHere(tempBall);
    return placeOK;
}

    function createGuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0,
                v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
var removeBall = function(ball1) {
    var removeThisBall = balls.indexOf(ball1);
    balls.splice(removeThisBall, 1)
}
var ballCount = function() {
    if (balls.length < balls.length) {
        addBall();
    }
}
var addBall = function() {
    generateBall();
    balls.push(tempBall);
}




// Find spots to place each ball so none start on top of each other

    function sortBar(all) {
        obj["wait"] = [];
        obj["alive"] = [];
        obj["dead"] = [];

        for (name in all) {
            var state = all[name].state;
            var id = all[name].id;
            obj[state].push(all[name])
        }
        //Here i need to display to bar

    }

    function canPlaceHippoHere(h) {
        var retVal = true;
        for (var i = 0; i < Hippos.length; i += 1) {
            if (hitTestCircle(h, Hippos[i])) {
                retVal = false;
            }
        }
        return retVal;
    }
    // Functions
    // Returns true if a ball can start at given location, otherwise returns false
    function canStartHere(ball) {
        var retVal = true;
        for (var i = 0; i < balls.length; i += 1) {
            if (hitTestCircle(ball, balls[i])) {
                retVal = false;
            }
        }
        return retVal;
    }

    // Circle collision test to see if two balls are touching
    // Uses nextX and nextY to test for collision before it occurs
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

    function updateUsernames() {
        for (name in usernames) {
            var usernamesID = usernames[name].id;
            for (al = 0; al < obj["alive"].length; al++) {
                if (obj.alive[al].id === usernamesID) {
                    usernames[name].state = "alive";
                };
            }
            for (ded = 0; ded < obj["dead"].length; ded++) {
                if (obj.dead[ded].id === usernamesID) {
                    usernames[name].state = "dead";
                };
            }
            for (w = 0; w < obj["wait"].length; w++) {
                if (obj.wait[w].id === usernamesID) {
                    usernames[name].state = "wait";
                };
            }
        }
    }

    function notEnoughPlayers() {
        io.sockets.emit('notEnoughPlayers');
    }

    function newGame() {
        gameON = true;
        beginCountDown = false;
        balls = [];
        for (var i = 0; i < numBalls; i += 1) {
            tempRadius = 5;
            placeOK = false;
            while (!placeOK) {
                placeOK = generateBall();
            }
            balls.push(tempBall);
        }
        numWants = [];
        for (pl = 0; pl < usernames.length; pl++) {
            if (usernames[pl].wants === true) {
                numWants.push(usernames[pl]);
            }
        }
        if (numWants.length > 1) {
            for (var i = 0; i < numWants.length; i += 1) {
                tempRadiusHippo = 20;
                placeOK = false;
                while (!placeOK) {
                    tempXHippo = tempRadiusHippo * 3 + (Math.floor(Math.random() * 1280) - tempRadiusHippo * 3);
                    tempYHippo = tempRadiusHippo * 3 + (Math.floor(Math.random() * 720) - tempRadiusHippo * 3);
                    tempSpeedHippo = 0;
                    tempAngleHippo = 0;
                    tempRadiansHippo = 0;
                    tempVelocityXHippo = 0;
                    tempVelocityYHippo = 0;
                    tempHippoCounter = 0;

                    var HippoPositionZeroX = 50
                    var HippoPositionHalfX = 1280 / 2
                    var HippoPositionFullX = 1280 - 50
                    var HippoPositionZeroY = 50
                    var HippoPositionHalfY = 720 / 2
                    var HippoPositionFullY = 720 - 50
                    var HippoPositionQuarterX = 1280 / 4;
                    var HippoPositionThreeQX = (1280 / 2) + (1280 / 4);
                    var HippoPositionQuarterY = 720 / 4;
                    var HippoPositionThreeQY = (720 / 2) + (720 / 4);

                    var HippoHeadX = [HippoPositionZeroX, HippoPositionZeroX, HippoPositionZeroX, HippoPositionHalfX, HippoPositionHalfX,
                        HippoPositionFullX, HippoPositionFullX, HippoPositionFullX, HippoPositionQuarterX, HippoPositionQuarterX, HippoPositionThreeQX, HippoPositionThreeQX
                    ]
                    var HippoHeadY = [HippoPositionZeroY, HippoPositionHalfY, HippoPositionFullY, HippoPositionZeroY, HippoPositionFullY,
                        HippoPositionZeroY, HippoPositionHalfY, HippoPositionFullY, HippoPositionZeroY, HippoPositionFullY, HippoPositionZeroY, HippoPositionFullY
                    ]
                    tempXHippo = HippoHeadX[i];
                    tempYHippo = HippoHeadY[i];
                    tempHippo = {
                        x: tempXHippo,
                        y: tempYHippo,
                        nextX: tempXHippo,
                        nextY: tempYHippo,
                        radius: tempRadiusHippo,
                        speed: tempSpeedHippo,
                        angle: tempAngleHippo,
                        velocityX: tempVelocityXHippo,
                        velocityY: tempVelocityYHippo,
                        mass: tempRadiusHippo,
                        counter: tempHippoCounter,
                        color: usernames[i].color,
                        status: "alive",
                        name: usernames[i].name,
                        id: usernames[i].id,
                        isUp: false,
                        isDown: false,
                        isRight: false,
                        isLeft: false
                    };
                    placeOK = canPlaceHippoHere(tempHippo);
                }
                Hippos.push(tempHippo);
            }
        } else {
            return false;
        }
        var tempWaitArray = [];
        for (i = 0; i < obj["wait"].length; i++) {
            var truth = false;
            for (k = 0; k < numWants.length; k++) {
                if (obj.wait[i].id === numWants[k].id) {
                    truth = true;
                }
            }
            if (truth) {
                obj.alive.push(obj.wait[i]);
            } else {
                tempWaitArray.push(obj.wait[i]);
            }
        }
        obj["wait"] = tempWaitArray;
        return true;
    }

setInterval(function() {
    if (!gameON && beginCountDown && numUsers > 1) {
        if (countingDown > 0) {
            io.sockets.emit('counting down', countingDown);
            countingDown--;
        } else if (countingDown === 0) {
            var x = newGame();
            if (x) {
                io.sockets.emit('begin', balls, Hippos, obj);
                updateUsernames()
                io.sockets.emit('update bar', obj);
            } else {
                gameON = false;
                beginCountDown = true;
                countingDown = 5;
                notEnoughPlayers();
            }
        } else if (numUsers <= 1) {}
    }
}, 1000);







io.on('connection', function(socket) {
    var addedUser = false;
    // adds a user with id and name

    socket.on('add user', function(username, id, color) {
        console.log(username, " has joined");
        socket.username = username;
        socket.myid = id;
        // add the client's username to the global list
        //usernames[username]
        var xas = {
            name: username,
            state: "wait",
            id: id,
            wants: true,
            color: color
        };
        usernames.push(xas);

        ++numUsers;
        addedUser = true;
        io.sockets.emit('numPlayers', numUsers);

        allPlayers = (usernames);
        for (name in allPlayers) {
            sortBar(allPlayers);
        }

        updateUsernames();
        io.sockets.emit('update bar', obj);
    });
    //ends the game, clears everything, starts countdown clock
    socket.on('wants', function(want, wantId) {
        for (i = 0; i < usernames.length; i++) {
            if (usernames[i].id === wantId) {
                usernames[i].wants = want;
            }
        }
    });
    socket.on('game over', function(winner) {
        beginCountDown = true;
        countingDown = 5;
        balls = [];
        Hippos = [];
        io.sockets.emit('end', winner);
        for (a = 0; a < obj["alive"].length; a++) {
            obj.wait[obj["wait"].length] = obj.alive[a]
        }
        for (d = 0; d < obj["dead"].length; d++) {
            obj.wait[obj["wait"].length] = obj.dead[d]
        }
        obj["dead"] = [];
        obj["alive"] = [];
        Hippos = [];
        balls = [];
        updateUsernames()
        io.sockets.emit('update bar', obj);
        gameON = false;
    });
    // updates the sidebar with names and places
    socket.on('sidebar', function() {
        updateUsernames()
        io.sockets.emit('update bar', obj);
    });
    // decrements number of Hippos and makes that player dead. Takes the removed hippo, emits its removal
    socket.on('remove hippo', function(hippo1) {
        for (o = 0; o < obj["alive"].length; o++) {
            if (hippo1.id === obj.alive[o].id) {
                obj.dead[obj.dead.length] = obj.alive[o];
                obj["alive"].splice(o, 1);
            }
        }
        updateUsernames()
        io.sockets.emit('im out', hippo1.id)
        io.sockets.emit('update bar', obj);
    });
    // takes in the current position of the player
    socket.on('my position', function(posX, posY, nextX, nextY, theirID) {
        io.sockets.emit('moves', posX, posY, nextX, nextY, theirID)

    });
    // removes and redraws the ball that ate the Hippo. 
    socket.on('remove ball', function(ball1) {
        removeBall(ball1);
        var tBall = generateBall();
        balls.push(tempBall);
        io.sockets.emit('new ball', tempBall, ball1);
    });
    socket.on('up', function(isOn, theirID) {

        io.sockets.emit('movingUp', isOn, theirID);
    });
    socket.on('down', function(isOn, theirID) {

        io.sockets.emit('movingDown', isOn, theirID);
    });
    socket.on('left', function(isOn, theirID) {

        io.sockets.emit('movingLeft', isOn, theirID);
    });
    socket.on('right', function(isOn, theirID) {

        io.sockets.emit('movingRight', isOn, theirID);
    });
    socket.on('invincible', function() {
        if (invincible === true) {
            invincible = false;
        } else {
            invincible = true;
        }
        io.sockets.emit('invincibles', invincible);
    });

    //Starts the game. inserts up to 8 hippos(for now all Hippos) and 
    socket.on('start', function() {
        var x = newGame();
        if (x) {
            io.sockets.emit('begin', balls, Hippos, obj);
            updateUsernames()
            io.sockets.emit('update bar', obj);
        } else {
            gameON = false;
            beginCountDown = true;
            countingDown = 5;
        }
    });
    //removes that player from all of the players
    socket.on('disconnect', function(reason) {
        if (usernames.length > 0 && socket.username != undefined && numUsers > 0) {
            console.log("A user has disconnected", socket.username, reason);
            io.sockets.emit('numPlayers', numUsers);
            var stillHere = true;
            if (stillHere) {
                for (al = 0; al < obj["alive"].length; al++) {
                    if (obj["alive"][al].id === socket.myid) {
                        obj["alive"].splice(al, 1);
                        stillHere = false;
                        continue;
                    }
                }
                for (ded = 0; ded < obj["dead"].length; ded++) {
                    if (obj["dead"][ded].id === socket.myid) {
                        obj["dead"].splice(ded, 1);
                        stillHere = false;
                        continue;
                    }
                }
                for (wt = 0; wt < obj["wait"].length; wt++) {
                    if (obj["wait"][wt].id === socket.myid) {
                        obj["wait"].splice(wt, 1);
                        stillHere = false;
                        continue;
                    }
                }
            }
            updateUsernames()
            var isPlayer = false;
            for (un = 0; un < usernames.length; un++) {
                if (usernames[un].id === socket.myid) {
                    usernames.splice(un, 1);
                    isPlayer = true;
                    continue;
                }
            }

            socket.broadcast.emit('update bar', obj)
            // remove the username from global usernames list
            if (addedUser && isPlayer) {
                delete usernames[socket.username];
                --numUsers;

                // echo globally that this client has left
                io.sockets.emit('user left', {
                    username: socket.username,
                    numUsers: numUsers
                });
            }
        }
    });
});
process.on("uncaughtException", function(e) {
    console.log("the error is ", e);
})