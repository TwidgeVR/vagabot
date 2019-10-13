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
    },

    "discordRoles" :
    {
        "admin" : [ <comma sep list of role IDs who can admin the bot> ],
        "spawn" : [ <comma sep list of role IDs who can spawn items> ]
    }
}
```
``` IMPORTANT NOTE: the IDs used in config.json should be quoted (eg. "12345" not 12345 ), they are strings not integers. ```

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

### Commands

`ping` - bot returns 'pong' if it is alive

`where [is] <player>` - return the last known chunk for the player

`who [is] <player>` - return a short bio for the player

`bio [<player>] <message>` - sets a bio message for yourself or the specified user

`servers` - list the servers and player count the bot user has access to, get invited to more servers to see them

`players [<server name>]` - list players on known servers, or just the specified server name.  regex supported.

`zone`
- `zone history <chunk name>` - list the players who have visited the specified chunk

`player`
- `player path <player>` - list the last known chunks the player has visited

`load`
- `load assets` - req role: admin - load the list of spawnable assets, server must be alive

`find`
- `find asset <name>` - find any spawnable assets matching the name, regex supported

`spawn <player> <prefab> [<count>]` - req role: spawn - spawn something for the specified player

`trade`
- `trade post <player> <prefab> [<count>]` - req role: spawn - send something to the player's mailbox


### Known issues

- The bot occasionally does not reconnect after a 'paused' period, requiring a restart.

- Some event subscription messages are particularly chatty, such as PlayerMovedChunk and CreatureSpawned, so by default are left disabled.

## Enjoy!

