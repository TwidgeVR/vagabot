//Load required classes.
const { WebsocketBot } = require('att-bot-core');
const { BasicWrapper } = require('att-websockets');
const Discord = require('discord.js');

//Load information from credentials and config
const { username, password, botToken } = require("./credentials");
const { targetServers, discordPrefix } = require("./config");

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

        //Subscribe to "PlayerMovedChunk"
        await wrapper.subscribe("PlayerMovedChunk", data =>
        { 
            //Log out the players movement
            console.log(data.player.username + " moved to " + data.newChunk);
            locations[data.player.username] = data.newChunk;
        });
    });
}
