const express = require('express');
const path = require('path');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);
const bodyParser = require('body-parser');
const Ball = require('./libs/ball');
const User = require('./libs/user');

const PORT = process.env.PORT || 3000;

let canvasWidth = 100; // Make sure to be same as on client's
let canvasHeight = 715; // Make sure to be same as on client's
let fieldOffset = 30; // Make sure to be same as on client's
let userR = 50; // Make sure to be same as on client's
let goal = {
    x: fieldOffset,
    y: 150 // Make sure to be same as on client's goalSize
}
let speed = 8;
let screen;
let connections = [];
let users = [];
let ball = new Ball(canvasWidth, canvasHeight);
let teams = [{
    name: 'Pink',
    count: 0,
    score: 0
},{
    name: 'Teal',
    count: 0,
    score: 0
}];
let teamNames;
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/settings', (req, res) => {
    console.log(req.params);
});
app.get('/', (req, res) => {
    res.send('index.html');
});
app.get('/controller', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/', 'controller.html'));
});
setInterval(tick, 33); // 1000 / x = frames / second
//setInterval(()=>{console.log(users); console.log();}, 2000);
function tick() {
//    console.log(users);
//    console.log('------------------------------');
    io.sockets.emit('tick', {users: users, ballLoc: ball.location});

    checkBallCollision(users, ball);
    ballEdges(ball);
    ball.update();
//    console.log(ball);
}

server.listen(PORT, () => {
    console.log("Server listening on port", PORT);
});
let onSelectPlayers = [];
io.sockets.on('connection', (socket) => {
    connections.push(socket);
    console.log('Connected: %s sockets connected.', connections.length);
    socket.on('Update User', (updatedUser) => {
        users.forEach(user => {
            console.log(updatedUser)
            if(user.id === updatedUser.id){
                if (updatedUser.direction == 'left')
                    user.x -= speed;

                if (updatedUser.direction == 'right')
                    user.x += speed;

                if (updatedUser.direction == 'up')
                    user.y -= speed;

                if (updatedUser.direction == 'down')
                    user.y += speed;
                user.isKicking = updatedUser.isKicking;
                user.direction = updatedUser.direction;
                user.playerId = updatedUser.id;
                console.log(user);
            }
        })
    });
    socket.on('Screen Ready', (config) => {
        console.log('Equipos ', teams);
        screen = socket.id;
        teamNames = config.teams;
        io.emit('Teams', {teams: config.teams});
        canvasWidth = config.size.width;
        canvasHeighth = config.size.height;
        ball = new Ball(config.size.width, config.size.height);

    });
    socket.emit('New Player', {teamNames})
    socket.on('Player Register', (player) => {
        console.log('player--->', player);
        console.log('new player: ', player.name);
        io.to(screen).emit('Player Ready', createNewUser(player.id, player.name, player.image, player.team));
    });
    socket.on('setName', newName => {
        users.forEach(user => {
            if(user.id === socket.id){
                user.name = newName;
            }
        });
    });
    //Disconnect
    socket.on('disconnect', (data) => {
        connections.splice(connections.indexOf(socket), 1);
        users = users.filter(user => user.id !== socket.id);
        console.log('Disconnected: %s sockets connected.', connections.length);
    });
});

function createNewUser(_id, name, image, team) {
    console.log('data-------->', _id, name, image, team);
    let newUser = {};

    newUser.id = _id;
    newUser.team = team;
    newUser.name = name;
    newUser.image = image;
    if(team == 'left'){
        newUser.x = (Math.random() * (canvasWidth / 2 - userR)) + fieldOffset + userR;
    }
    else{
        newUser.x = (Math.random() * (canvasWidth / 2 - fieldOffset - userR)) + (canvasWidth / 2) + userR;
    }

    newUser.y = (Math.random() * (canvasHeight - userR / 2)) + userR;

    users.push(newUser);
    io.to(_id).emit('You', newUser);
    return newUser;
}


function scored(team) {
    if(team === teams[0].name)      // purple scorred
        teams[0].score++;
    else if(team === teams[1].name) // teal scorred
        teams[1].score++;

    let scores = {
        pink: teams[0].score,
        teal: teams[1].score
    }
    io.sockets.emit('scored', scores)

    ball.stopBall();
    ball.location.x = canvasWidth / 2 ;
    ball.location.y = canvasHeight / 2;
}

function mag(vector) {
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
}

function normalize(vector) {
    var m = mag(vector);
    if(m > 0){
        vector.x /= m;
        vector.y /= m;
    }
    return vector;
}

function setMag(vector, val) {
    vector = normalize(vector);
    vector.x *= val;
    vector.y *= val;

    return vector;
}

function dist(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function checkBallCollision(users, ball) {

    users.forEach(user => {
        let d = dist(user.x, user.y, ball.location.x, ball.location.y);
        let pushForce;

        if(d <= userR + ball.r){
            pushForce = {
                x: ball.location.x - user.x,
                y: ball.location.y - user.y
            };
            if(user.isKicking) {
                pushForce = setMag(pushForce, 20);
            } else {
                pushForce = setMag(pushForce, 1.5);
                user.isKicking = false;
            }
            ball.applyForce(pushForce);
        }
    });
}

function ballEdges(ball) {

    // Check if outside the goal (y check) right-side
    if(ball.location.x + ball.r > canvasWidth - fieldOffset && ball.location.y < canvasHeight/2 - goal.y/2 || ball.location.x + ball.r > canvasWidth - fieldOffset && ball.location.y > canvasHeight/2 + goal.y/2){
            ball.location.x = canvasWidth - ball.r - fieldOffset;
            ball.velocity.x *= -1;

    // Check if inside the goal right-side && score team 1 (pink)
    } else if (ball.location.x + ball.r > canvasWidth && ball.location.y > canvasHeight/2 - goal.y/2 || ball.location.x + ball.r > canvasWidth && ball.location.y < canvasHeight/2 + goal.y/2){
            ball.location.x = canvasWidth - ball.r;
            scored('Pink');
            io.to(screen).emit('Goal', 'one');

    // Check if outside the goal (y check) left-side
    } else if (ball.location.x - ball.r < fieldOffset && ball.location.y < canvasHeight/2 - goal.y/2 || ball.location.x - ball.r < fieldOffset && ball.location.y > canvasHeight/2 + goal.y/2){
            ball.location.x = fieldOffset + ball.r;
            ball.velocity.x *= -1;

    // Check if inside the goal left-side && score team 1 (pink)
    } else if (ball.location.x - ball.r < 0 && ball.location.y > canvasHeight/2 - goal.y/2 || ball.location.x - ball.r < 0 && ball.location.y < canvasHeight/2 + goal.y/2){
            ball.location.x = ball.r;
            scored('Teal');
            io.to(screen).emit('Goal', 'two');
    }

    if(ball.location.y + ball.r > canvasHeight){
        ball.velocity.y *= -1;canvasHeight
        ball.location.y = canvasHeight - ball.r;
    } else if (ball.location.y - ball.r < 0) {
        ball.velocity.y *= -1;
        ball.location.y = ball.r;
    }
}
