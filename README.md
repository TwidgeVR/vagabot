# vagabot
A Township Tale NodeJS bot

This is a simple bot building on the att-discord-tracker bot example by Joel VDV, aka Narmdo:

https://github.com/Narmdo/att-discord-tracker

Using libraries provided by Alta VR:

// ATT Websocket bot
https://github.com/alta-vr/ATT-Bot-JS

// ATT websocket connection library
https://github.com/alta-vr/att-websockets

// Alta VR jsapi
https://github.com/alta-vr/alta-jsapi

#Features
- Notifies when players have enterered or left a server.
    // Twidge has joined the server
    // Twidge has left the server

- Tracks player movements through the Chunks system
    !where is Twidge
    // Twidge is at Chunk 18-33

- Tracks players who have visited a particular zone
    !zone history Chunk 18-33
    // returns a list of players who have recently visited the zone

- Alerts when a player is killed, by other players, PVE mobs, or self-inflicted harm
    // Rubk has _slaughtered_ Twidge
    // Twidge was murdered by <eg. a spriggull>
    // Darklingbird8 has suddenly died from mysterious self-inflicted circimstances

- Gives status of A Township Tale public servers, and player lists
    !servers
    // returns a list of servers and current player count

    !players [server]
    // returns a list of players on the specified server, or all players on all servers

This bot uses some (very) rudimentary filters for "natural language", and some simple pattern matching for filtering results.
For example, the following are equivalent:

    !where Twidge
    !where is Twidge

    !players
    !players online

    !players The Vatican
    !players online on the vat
    

#Known issues
- On ATT private servers, when no players are active the server may go into a 'paused' state. When a player joins and awakens the server, the bot generally is only able to join after the player, which causes their initial join event to be missed.  For this reason, it is not wise to initialize variables or trigger events based on join messages.

- The bot sometimes does not reconnect after a 'paused' period, requiring a restart.


Enjoy!

