script.on_event(defines.events.on_player_joined_game, function(evt)
	local player = game.get_player(evt.player_index)
	game.write_file("ext/awflogging.out", game.table_to_json({
		type='join',
		playerName=player.name
	}))
end)