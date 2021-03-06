var fieldOffset = 30;
var goalSize = {
    x: fieldOffset,
    y: 150
};
var score = '0 - 0';
var socket = io.connect();
var users = [];
var user;
var ballLoc;
var name = 'Unnamed';
var speed = 8;
var userR = 50;
var ballR = 12;
var goalOne = 0;
var goalTwo = 0;
var pink = '#C80064'; //200, 0, 100;
var teal = '#74C2E1'; //116, 194, 225;
if (screen.width <= 699) {
    document.location = "controller";
}
function gameScreen(teams, size){
    socket.emit('Screen Ready', {teams: teams, size: size});
}
function configurations(teams){
    $('.team-box.left .team-name').html(teams[0]);
    $('.team-box.right .team-name').html(teams[1]);
    $('.popup-container').hide();
}
function drawFooter(player){
    let playerBox = $('.empty[team="' + player.team + '"]');
    let playerImage = '/imgs/' + player.image;
    $(playerBox[0]).find('.player-name').html(player.name);
    $(playerBox[0]).find('.player-image').attr('src', playerImage);
    $(playerBox[0]).removeClass('empty');
}
$(document).ready(function($) {
    $('.popup-send-button').on('click', function(event) {
        event.preventDefault();
        /* Act on the event */
        let teams = [$('#team-1').val(), $('#team-2').val()];
        let size = {width: windowWidth, height: Math.round((windowHeight * 0.8) - 30)}
        gameScreen(teams, size);
        configurations(teams);
        setInterval(time, 33);
    });
    $('.start-button').on('click', function(e){
      $(this).hide();
      let minutes = 3;
      let seconds = 0;
      let timer = setInterval(function(){
        if(seconds == 0 && minutes > 0){
        	minutes--;
          seconds = 59;
        }
        else if(seconds > 0){
        	seconds--;
        }
        else if(seconds == 0 && minutes == 0){
        	clearIntereval(timer);
        }
        $('.minutes').html(minutes);
        $('.seconds').html(seconds);
      }, 1000);
    });
    socket.on('Goal', (team)=>{
        if(team == 'one'){
            goalOne ++;
            $('.score-team.one').html(goalOne);
        }
        else if(team == 'two'){
            goalTwo ++;
            $('.score-team.two').html(goalTwo);
        }
    })
});

function time(){
    drawField();

    if(user){ // To avoid errors on first drawing
        moveUser(user.direction);
        userBoundaries();
        //drawUser(user);
    }

    drawAllUsersExceptThis();

    if(ballLoc)
        drawTheBall(ballLoc);
}
function preload() {
    socket.on('Player Ready', (player) => {
        let _player = player;
        drawFooter(_player);
        user = player;
    });
    socket.on('tick', function(data) {
        users = data.users;
        ballLoc = data.ballLoc;
    });
}

function setup() {
    createCanvas(windowWidth, (windowHeight-200));
    // Only start looping when you have the initial data from the server
    noLoop();
}

function draw() {
    background('#2980b9');
    drawField();

    if(user){ // To avoid errors on first drawing
        moveUser(user.direction);
        userBoundaries();
        drawUser();
    }

    drawAllUsersExceptThis();

    if(ballLoc)
        drawTheBall(ballLoc);
}

function drawTheBall(_ballLoc) {
    fill(255);
    stroke(0);
    ellipse(_ballLoc.x, _ballLoc.y, ballR * 2);
}

function drawUser(_user){
    // let img = new Image();
    // img.onload = function () {
    //   let context = document.getElementById('defaultCanvas0').getContext("2d");
    //   context.drawImage(img, _user.x, _user.y, 100, 100);
    // }
    // img.src = "../imgs/"+ _user.image.toLowerCase();

    let context = document.getElementById('defaultCanvas0').getContext("2d");
    let playerImg = document.getElementById(_user.image.replace('.png', '').toLowerCase());
    context.drawImage(playerImg, _user.x, _user.y, 100, 100);

    // if(_user.team === 'Pink'){
    //     fill(pink)
    // } else {
    //     fill(teal);
    // }
    //
    // if(_user.isKicking){
    //     stroke(255);
    // } else {
    //     stroke(0);
    // }.

    // strokeWeight(3);
    // ellipse(_user.x, _user.y, userR*2);

}

function userBoundaries() {
    // Right
    if(user.x + userR > width - fieldOffset){
        user.x = width - userR - fieldOffset;

    // Left
    } else if (user.x - userR < fieldOffset) {
        user.x = userR + fieldOffset;
    }

    // Bottom
    if(user.y + userR > height - 3){
        user.y = height - userR - 3;

    // Top
    } else if (user.y - userR < 3) {
        user.y = userR + 3;
    }
}

function drawAllUsersExceptThis() {
    users.forEach(user => {
        if(user.id !== socket.id){
            drawUser(user);
        }
    });
}

function moveUser(direction) {
    if (direction == 'left')
        user.x -= speed;

    if (direction == 'right')
        user.x += speed;

    if (direction == 'up')
        user.y -= speed;

    if (direction == 'down')
        user.y += speed;
}


function drawField() {
    // Draw field margins
    fill('#00680A');
    strokeWeight(6);
    stroke(255);
    rect(fieldOffset, 3, width - fieldOffset * 2, height - 6);

    // Draw middle line
    strokeWeight(6);
    line(width/2, 0, width/2, height);

    // Draw middle cercle
    ellipse(width/2, height/2, 100, 100);

    // Draw middle point
    fill(255);
    ellipse(width/2, height/2, 10, 10);

    // Drawing the 2 goals
    stroke(255);

    // Left goal
    fill(pink);
    rect(3, height/2 - goalSize.y/2, goalSize.x - 3, goalSize.y);

    // Right goal
    fill(teal);
    rect(width - goalSize.x, height/2 - goalSize.y/2, goalSize.x - 3, goalSize.y);
}
