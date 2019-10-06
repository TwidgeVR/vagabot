# vagabot
A Township Tale NodeJS bot

This is a simple bot building on the att-discord-tracker example by Joel VDV, aka Narmdo, aka King of ATT Meta:

https://github.com/Narmdo/att-discord-tracker

Using libraries provided by Alta VR:

- ATT Websocket bot: https://github.com/alta-vr/ATT-Bot-JS

- ATT websocket connection library: https://github.com/alta-vr/att-websockets

- Alta VR jsapi: https://github.com/alta-vr/alta-jsapi


### Usage

To start, install node/npm by following the excellent guide prepared by Joel here:

https://paper.dropbox.com/doc/An-Introduction-to-ATT-Bots-sN2e61qvfnQ3yb7uoGbL5

In short,
1. Install node/npm using the many methods available online.
2. Install dependencies with `npm i`

The bot uses some JSON configuration files.  You may copy the *.example files provided in the checkout, or create your own.

- **credentials.json** - this file contains the authentication information to connect to Alta API and to Discord
```
{
    "username" : "<your ATT username>",
    "password" : "<your ATT password>",
    "botToken" : "<your bot's discord token>"
}
```

- **config.json** - contains the list of A Township Tale servers to join, and the channel destinations for various notifications
```
{
    "targetServers" :
    [
        <list of server IDs to join>
    ],

    "discordPrefix" : "!",

    "discordChannels" :
    {
        "PlayerJoined" : <discord channel ID>,
        "PlayerLeft" : <channel ID>,
        "PlayerKilled" : <channel ID>,
        "PublicPlayerKilled" : <channel ID>,
        "PlayerMovedChunk" : <channel ID>,
        "TradeDeckUsed" : <channel ID>,
        "CreatureKilled" : <channel ID>,
        "CreatureSpawned" : <channel ID>,
    }
}
```

- **files.json** - contains the filenames for saving player and statistics
```
{
    "playerFile" : "data/players.json"
}
```


Once configured, start the bot going with:

`npm start`


The bot spits a lot of data into the console currently.  If you wish to capture this for later perusal, and you're using linux (why wouldn't you be?!), for now you can pipe the poutput to a logfile:

`npm start 2>&1 >> vagabot.log`


### Features
- Notifies when players have enterered or left a server.
```
Twidge has joined the server
Twidge has left the server
```

- Tracks player movements through the Chunks system
```
!where is Twidge
Twidge is at Chunk 18-33
```

- Tracks players who have visited a particular zone
```
!zone history Chunk 18-33
// returns a list of players who have recently visited the zone
```

- Alerts when a player is killed, by other players, PVE mobs, or self-inflicted harm
```
Rubk has _slaughtered_ Twidge
Twidge was murdered by <eg. a spriggull>
Darklingbird8 has suddenly died from mysterious self-inflicted circimstances
```

- Gives status of A Township Tale servers and player lists
```
!servers
// returns a list of servers and current player count

!players [server]
// returns a list of players on the specified server, or all players on all servers
```

This bot uses some (very) rudimentary filters for "natural language", and some simple pattern matching for filtering results.
For example, the following are equivalent:
```
!where Twidge
!where is Twidge

!players
!players online

!players The Vatican
!players online on the vat
```

### Known issues

- On ATT private servers, when no players are active the server may go into a 'paused' state. When a player joins and awakens the server, the bot generally is only able to join after the player, which causes their initial join event to be missed.  For this reason, it is not wise to initialize variables or trigger events based on join messages.

- The bot sometimes does not reconnect after a 'paused' period, requiring a restart.

- Some event subscriptions are particularly chatty, such as PlayerMovedChunk and CreatureSpawned, so by default are left disabled.

## Enjoy!

