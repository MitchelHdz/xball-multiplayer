var socket = io.connect();
function newPlayerData(userName){
	socket.emit('Player Register', {name: userName});
}
$(document).ready(function($) {
	socket.on('New Player', function(teams){
        console.log(teams.teamNames[0]);
        $('.team.one .team-name').html(teams.teamNames[0]);
        $('.team.two .team-name').html(teams.teamNames[1]);
    });
	socket.on('Player Ready', (player)=>{

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
		}
	});
	$('.joystick').on('drag', '.selector', function(event) {
		event.preventDefault();
		/* Act on the event */
		console.log('aaa');
	});
});