script.on_event(defines.events.on_player_banned, function (e)
	local text = "ban;\"" .. e.player_name .. "\";\"" .. (e.by_player or "") .. "\";\"" .. (e.reason or "") .. "\""
	game.write_file("fagc-actions.txt", text, true, 0)
end)

script.on_event(defines.events.on_player_unbanned, function (e)
	local text = "unban;\"" .. e.player_name .. "\";\"" .. (e.by_player or "") .. "\";\"" .. (e.reason or "") .. "\""
	game.write_file("fagc-actions.txt", text, true, 0)
end)
