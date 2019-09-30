//Load required classes.
const { WebsocketBot } = require('att-bot-core');
const { BasicWrapper } = require('att-websockets');
const Discord = require('discord.js');

//Load information from credentials and config
const { username, password, botToken } = require("./credentials");
const { targetServers, discordPrefix, discordChannels } = require("./config");

var locations = {};

//Command list
const commands = {
    'ping': (message, username) =>
    {
        message.channel.send("pong");
    },

    'where': (message, username) =>
    {
        if (!!locations[username])
        {
            message.channel.send(username +" is at "+ locations[username]);
        } else {
            message.channel.send("No location known for "+ username);
        }
    }
}

const logMessage = {
    'PlayerJoined' : ( discord, data ) =>
    {
        discord.channels.get( discordChannels["PlayerJoined"] ).send( data.user.username +" joined the server" );
        console.log( data.user.username +" joined the server" );
    },

    'PlayerLeft' : ( discord, data ) =>
    {
        discord.channels.get( discordChannels["PlayerLeft"] ).send( data.user.username +" left the server" );
        console.log( data.user.username +" left the server" );
    },

    'PlayerMovedChunk' : ( discord, data ) =>
    {
        discord.channels.get( discordChannels["PlayerMovedChunk"] ).send( data.player.username +" has moved to "+ data.newChunk ); 
        console.log( data.player.username +" has moved to chunk "+ data.newChunk );
    },

    'PlayerKilled' : ( discord, data ) =>
    {
        discord.channels.get( discordChannels["PlayerKilled"] ).send( data.killerPlayer.username +" has killed "+ data.killedPlayer.username +" in cold blood" );
        discord.channels.get( discordChannels["PublicPlayerKilled"] ).send( data.killerPlayer.username +" has _slaughtered_ "+ data.killedPlayer.username +" in cold blood" );
        console.log( "player kill" );
        console.log( data );
    },

    'TradeDeckUsed' : ( discord, data ) =>
    {
        console.log( "trade deck used" );
        console.log( data );
    },

    'CreatureKilled' : ( discord, data ) =>
    {
        console.log( "creature murdered" );
        console.log( data );
    },

    'CreatureSpawned' : ( discord, data ) =>
    {
        console.log( "creature has spawned" );
        console.log( data );
    }

}   
        

//Run the program
main();

async function main()
{
    //Create a new ATT bot
    const bot = new WebsocketBot();

    //Alta Login
    await bot.login(username, password);

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
            var space = tmessage.indexOf(' ');

            if ( space >= 0 )
            {
                var command = tmessage.substring(0, space);
                var commandFunction = commands[command];

                if (!!commandFunction)
                {
                    commandFunction(message, tmessage.substring(space).trim());
                }
            }
        }
    });
                    

    //Run the bot.
    //When any of the 'targetServers' are available, a connection is automatically created.
    await bot.run(test => targetServers.includes(test.id), async (server, connection) =>
    {
        console.log(connection);
        //By default, connections simply receive commands, and emit messages.
        //To add callback support for events, we'll use the "BasicWrapper" provided by att-websockets.
        var wrapper = new BasicWrapper(connection);

        // Simple subscriptions
        await wrapper.subscribe("PlayerJoined", data => { logMessage["PlayerJoined"]( discord, data ); })
        await wrapper.subscribe("PlayerLeft", data => { logMessage["PlayerLeft"]( discord, data ); })
        await wrapper.subscribe("PlayerKilled", data => { logMessage["PlayerKilled"]( discord, data ); })
        await wrapper.subscribe("TradeDeckUsed", data => { logMessage["TradeDeckUsed"]( discord, data ); })
        await wrapper.subscribe("CreatureKilled", data => { logMessage["CreatureKilled"]( discord, data ); })
        await wrapper.subscribe("CreatureSpawned", data => { logMessage["CreatureSpawned"]( discord, data ); });

        // More complex subscriptions
        await wrapper.subscribe("PlayerMovedChunk", data =>
        { 
            //Log out the players movement
            logMessage["PlayerMovedChunk"]( discord, data );
            locations[data.player.username] = data.newChunk;
        });
    });
    // end bot.run()
}
