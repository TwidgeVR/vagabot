//Load required classes.
const { WebsocketBot } = require('att-bot-core');
const { BasicWrapper } = require('att-websockets');
const Discord = require('discord.js');
const moment = require('moment');

//Import modules
const { Servers } = require('alta-jsapi');

//Load information from credentials and config
const { username, password, botToken } = require("./credentials");
const { targetServers, discordPrefix, discordChannels } = require("./config");

var playerLocations = {};
var chunkHistory = {};
var botConnection;
var activePlayers = {};

//Some utility helper functions and prototypes
function ts()
{ 
    return "["+ moment().format("h:mm:ss A") +"] " 
}

function strrep( str, n )
{
    if ( n < 1 ) return '';
    var result = str;
    while( n-- > 0 )
    {
        result += str;
    }
    return result;
}

//Command list
const commands = {
    'ping': (message, args) =>
    {
        message.channel.send("pong");
    },

    'where': (message, args) =>
    {
        while ( args.length && args[0].toLowerCase() === "is" )
        {
            argv = args.shift();
        }

        
        var username = args.join(' ');

        if ( username && !!playerLocations[username] )
        {
            message.channel.send(username +" is at "+ playerLocations[username]);
        } else if ( username ){
            message.channel.send("No location known for "+ username);
        }
    },

    'servers': async function (message, args)
    {
        var servers = await Servers.getOnline();

        if ( !!servers )
        {
            var longest = 0;
            for( var i in servers )
            {
                if ( servers[i].name.length > longest )
                {
                    longest = servers[i].name.length;
                }
            }

            var serverNameLen = longest + 1;
            var listTable =  "| Servers"+ strrep(' ', (serverNameLen - 7)) +"| Players\n";
                listTable += "|"+ strrep('-', (serverNameLen + 1) ) +"|---------\n";
            for ( var i in servers )
            {
                listTable += "| "+ servers[i].name + strrep(' ', ( serverNameLen - servers[i].name.length )) +"| "+ servers[i].online_players.length +"\n";
            }
        
            message.channel.send( '```'+ listTable +'```' );
                   
        } else {
            message.channel.send("No servers appear to be online, perhaps it's patch day?");
        }
    },

    'players': async function (message, args)
    {
        var servers = await Servers.getOnline();
        var listTable = '';

        while ( args.length && ( args[0].toLowerCase() === "online" || args[0].toLowerCase() === "in" || args[0].toLowerCase() === "on" ) )
        {
            args.shift();
        }

        var mustMatch = args.join(' ');

        for( var i in servers )
        {
            if ( mustMatch )
            {
                var re = new RegExp( mustMatch, 'ig' );
                if ( !servers[i].name.match( re ) )
                {
                    continue;
                }
            }
            listTable += "| "+ servers[i].name +"\n";
            listTable += "|"+ strrep('-', (servers[i].name.length + 1)) +"\n";
                    
            var pOnline = servers[i].online_players;
            for( var n in pOnline )
            {
                listTable += "| "+ pOnline[n].username +"\n";
            }
            listTable += "\n";
        }

        if ( listTable === '' )
        {
            if ( mustMatch )
            {
                message.channel.send('```No server found matching "'+ mustMatch +'"```');
            } else {
                message.channel.send('```No servers were found online, is it patch day?```');
            }
        } else {
            message.channel.send('```'+ listTable +'```');
        }
    },

    // this pulls data from a WebsocketBot using the active connections
    // deprecated in favor of the players command using Server.getOnline
    'playerlist': async function (message, args)
    {
        if (botConnection != undefined)
        {
            var playerList = await botConnection.wrapper.send("player list");
            var result = playerList.Result;
            console.log( playerList );

            var fplist = "| The Vatican \n";
               fplist += "|--------------\n";
            for( var ind in result )
            {
                fplist += "|\t"+ result[ind].username +"\n";
            }

            message.channel.send( fplist );
        }
    },

    'zone': async function (message, args)
    {
        switch( args.shift() )
        {
            case 'history':
                var chunk = args.join(' ');
                if ( !!chunkHistory[ chunk ] )
                {
                    var response  = "| Players who have visited zone '"+ chunk +"'\n";
                        response += "|---------------------------"+ strrep( '-', chunk.length ) +"-\n";
        
                    var chunkList = chunkHistory[ chunk ];
                    for ( var i in chunkList )
                    {
                        var timestamp = moment( chunkList[i].ts );
                        response += "| ["+ moment(timestamp).format( "YYYY/MM/DD HH:mm:ss" ) +"] - "+ chunkList[i].username +"\n";
                    }

                    message.channel.send('```'+ response +'```');
                } else {
                    message.channel.send('```'+ "No history for zone '"+ chunk +"'"+ '```');
                }
            break;

        }
    },       

    'player' : async function ( message, args )
    {
        switch( args.shift() )
        {
            case 'path':
                // Return known history of player movements

                var username = args.join(' ');
                if ( activePlayers[ username ] )
                {
                    var playerData = activePlayers[ username ]

                    var response  = '| Path History for '+ username +"\n";
                        response += '|------------------'+ strrep('-', username.length+1) +"\n";
                    for( var i in playerData.pathHistory )
                    {
                        var elem = playerData.pathHistory[i];
                        response += "|["+ moment( elem.ts ).format( "YYYY/MM/DD HH:mm:ss") +"] "+ elem.zone +"\n";
                    }
                    message.channel.send('```'+ response +"```");
                } else {
                    message.channel.send('```'+ "No player data found for "+ username +'```');
                }
            break;
            
        }
    }
}

const logMessage = {
    'PlayerJoined' : ( discord, data ) =>
    {
        discord.channels.get( discordChannels["PlayerJoined"] ).send( ts() + data.user.username +" joined the server" );
        console.log( ts() + data.user.username +" joined the server" );
    },

    'PlayerLeft' : ( discord, data ) =>
    {
        discord.channels.get( discordChannels["PlayerLeft"] ).send( ts() + data.user.username +" left the server" );
        console.log( ts() + data.user.username +" left the server" );
    },

    'PlayerMovedChunk' : ( discord, data ) =>
    {
        //discord.channels.get( discordChannels["PlayerMovedChunk"] ).send( ts() + data.player.username +" has moved to "+ data.newChunk ); 
        console.log( data );
        console.log( ts() + data.player.username +" has moved to chunk "+ data.newChunk );
    },

    'PlayerKilled' : ( discord, data ) =>
    {
        console.log( ts() + "player kill" );
        console.log( data );
        if ( data.killerPlayer != undefined ) 
        {
            discord.channels.get( discordChannels["PlayerKilled"] ).send( ts() + data.killerPlayer.username +" has killed "+ data.killedPlayer.username +" in cold blood" );
            discord.channels.get( discordChannels["PublicPlayerKilled"] ).send( '```'+ data.killerPlayer.username +" has murdered "+ data.killedPlayer.username +'```' );
        } else {
            if ( data.toolWielder )
            {
                discord.channels.get( discordChannels["PlayerKilled"] ).send( ts() + data.killedPlayer.username +" was killed by: "+ data.toolWielder );
            } else {
                discord.channels.get( discordChannels["PlayerKilled"] ).send( ts() + data.killedPlayer.username +" has suddenly offed themselves" );
            }
        }
    },

    'TradeDeckUsed' : ( discord, data ) =>
    {
        console.log( ts() + "trade deck used" );
        console.log( data );
    },

    'CreatureKilled' : ( discord, data ) =>
    {
        console.log( ts() + "creature murdered" );
        console.log( data );
    },

    'CreatureSpawned' : ( discord, data ) =>
    {
        console.log( ts() + "creature has spawned" );
        console.log( data );
    }

}   
        

//Run the program
main();

async function main()
{
    console.log( ts() + "bot is starting" );

    //Connect to discord
    const discord = new Discord.Client();
    await new Promise( resolve =>
    {
        discord.on('ready', resolve);
        discord.login(botToken);
    });
    
    //Discord command and message management (todo: move to own lib)
    discord.on('message', message =>
    {
        if ( message.content.length > 0 && message.content.startsWith( discordPrefix ) )
        {
            var tmessage = message.content.substring(discordPrefix.length).trim();
            var args = tmessage.split(' ');

            if ( args && args.length >= 1 )
            {
                var command = args.shift();
                var commandFunction = commands[command];
                if (!!commandFunction)
                {
                    commandFunction(message, args, tmessage);
                }
            }
        }
    });
                    

    //Create a new ATT bot for administration
    const bot = new WebsocketBot();
    //Alta Login
    await bot.login(username, password);

    //When any of the 'targetServers' are available, a connection is automatically created.
    await bot.run(test => targetServers.includes(test.id), async (server, connection) =>
    {
        console.log( server );
        console.log( connection );

        //By default, connections simply receive commands, and emit messages.
        //To add callback support for events, we'll use the "BasicWrapper" provided by att-websockets.
        var wrapper = new BasicWrapper(connection);
        
        botConnection = 
        {
            "connection" : connection,
            "wrapper" : wrapper
        }

        // Simple subscriptions
        await wrapper.subscribe("PlayerJoined", data => { logMessage["PlayerJoined"]( discord, data ); })
        await wrapper.subscribe("PlayerLeft", data => { logMessage["PlayerLeft"]( discord, data ); })
        await wrapper.subscribe("PlayerKilled", data => { logMessage["PlayerKilled"]( discord, data ); })
        await wrapper.subscribe("TradeDeckUsed", data => { logMessage["TradeDeckUsed"]( discord, data ); })
        await wrapper.subscribe("CreatureKilled", data => { logMessage["CreatureKilled"]( discord, data ); })

        // this one is kinda spammy as it covers all automatic spawns, including inanimate objects
        //await wrapper.subscribe("CreatureSpawned", data => { logMessage["CreatureSpawned"]( discord, data ); });

        // More complex subscriptions
        await wrapper.subscribe("PlayerMovedChunk", data =>
        { 
            //Add the player to the players object if they haven't been seen yet
            if ( !activePlayers[ data.player.username ] )
            {
                activePlayers[ data.player.username ] = 
                {
                    "id": data.player.id,
                    "pathHistory" : [ { "ts" : moment(), "zone": data.newChunk } ]
                }
            } else {
                activePlayers[ data.player.username ].pathHistory.push( { "ts": moment(), "zone": data.newChunk } );
            }
                            
                
            //Log out the players movement
            logMessage["PlayerMovedChunk"]( discord, data );
            playerLocations[data.player.username] = data.newChunk;
            if ( !chunkHistory[ data.newChunk ] )
            {
                chunkHistory[ data.newChunk ] = [];
            }
            chunkHistory[ data.newChunk ].unshift( { "ts": moment(), "username": data.player.username } );
        });
    });
    // end bot.run()

}
