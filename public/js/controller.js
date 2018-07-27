var socket = io.connect();
var _user;
var isKicking;
var direction;
function newPlayerData(userName){
	socket.emit('Player Register', {name: userName});
}
$(document).ready(function($) {
	socket.on('New Player', function(teams){
      console.log(teams.teamNames[0]);
			console.log(socket.id);
			_user = socket.id;
      $('.team.one .team-name').html(teams.teamNames[0]);
      $('.team.two .team-name').html(teams.teamNames[1]);
  });
	$('.player-info-box').on('click', function(event) {
		event.preventDefault();
		/* Act on the event */
		$(this).addClass('selected').siblings().removeClass('selected');
		$('.player-image').removeClass('rotating')
		$(this).find('.player-image').addClass('rotating');
		let name = $('.player-info-box.selected').attr('player-name');
		socket.emit('Selected Player', {name: name, id: socket.id});
	});
	$('.team').on('click', function(event) {
		event.preventDefault();
		/* Act on the event */
		$(this).addClass('selected').siblings().removeClass('selected');
	});
	$('.player-button').on('click', function(event) {
		event.preventDefault();
		/* Act on the event */
		if($('.player-info-box.selected').length != 0){
			let name = $('.player-info-box.selected').attr('player-name');
			let image = $('.player-info-box.selected').attr('player-image');
			let team = $('.team.selected').attr('team-number');
			socket.emit('Player Register', {name: name, image: image, team: team});
			$('.background-container').hide();
			$('.control-container').show();
			startGame();
		}
	});
	var options = {
      zone: document.getElementById('zone_joystick'),
			size: 200
  };
  var manager = nipplejs.create(options);
	manager.on('added', function (evt, nipple) {
	    nipple.on('end', function (evt) {
	        direction = 'stop';
	    });
			nipple.on('dir:left', function (evt) {
	        // DO EVERYTHING
					direction = 'left';
	    });
			nipple.on('dir:right', function (evt) {
	        // DO EVERYTHING
					direction = 'right';
	    });
			nipple.on('dir:up', function (evt) {
	        // DO EVERYTHING
					direction = 'up';
	    });
			nipple.on('dir:down', function (evt) {
	        // DO EVERYTHING
					direction = 'down';
	    });
	}).on('removed', function (evt, nipple) {
	    nipple.off('start move end dir plain');
	});
	$('.joystick').on('drag', '.selector', function(event) {
		event.preventDefault();
		/* Act on the event */
		console.log('aaa');
	});
	$('.kick-button').on('touchstart', function(event) {
		event.preventDefault();
		isKicking = true;
	});
	$('.kick-button').on('touchend', function(event) {
		event.preventDefault();
		isKicking = false;
	});
	function startGame(){
			setInterval(updateUser, 33);
	}
	function updateUser(){
		console.log(isKicking);
		console.log('direction', direction)
		socket.emit('Update User',{ isKicking: isKicking, direction: direction, playerId: _user});
	}
});
