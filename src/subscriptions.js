const moment = require('moment');

function ts_f()
{
    return "["+ moment().format("h:mm:ss A") +"] " 
}

module.exports = class Subscriptions {
    constructor( discordChannels, playersDb, killsDb ) {
        this.discordChannels = discordChannels;
        this.playersDb = playersDb;
        this.killsDb = killsDb;
    }


    PlayerJoined( discord, data )
    {
        console.log( data );
        var now = moment();
        this.playersDb.update({ id: data.user.id }, { username: data.user.username, lastLogin: now }, { upsert: true });
        discord.channels.get( this.discordChannels["PlayerJoined"] ).send( ts_f() + data.user.username +" joined the server" );
        console.log( ts_f() + data.user.username +" joined the server" );
    }

    PlayerLeft( discord, data )
    {
        console.log( data );
        discord.channels.get( this.discordChannels["PlayerLeft"] ).send( ts_f() + data.user.username +" left the server" );
        console.log( ts_f() + data.user.username +" left the server" );
    }

    PlayerMovedChunk( discord, data )
    {
        console.log( data );
        //discord.channels.get( discordChannels["PlayerMovedChunk"] ).send( ts_f() + data.player.username +" has moved to "+ data.newChunk ); 
        console.log( data );
        console.log( ts_f() + data.player.username +" has moved to chunk "+ data.newChunk );
    }

    PlayerKilled( discord, data )
    {
        console.log( ts_f() + "player kill" );
        console.log( data );
        let now = moment();
        if ( data.killerPlayer != undefined ) 
        {
            this.killsDb.insert({ 
                ts: now, 
                killed : data.killedPlayer.id, 
                killer: data.killerPlayer, 
                usedTool: data.usedTool, 
                toolWielder: data.toolWielder
            });
            discord.channels.get( this.discordChannels["PlayerKilled"] ).send( ts_f() + data.killerPlayer.username +" has killed "+ data.killedPlayer.username );
            discord.channels.get( this.discordChannels["PublicPlayerKilled"] ).send( '```'+ data.killerPlayer.username +" has murdered "+ data.killedPlayer.username +'```' );
        } else {
            if ( data.toolWielder )
            {
                this.killsDb.insert({ 
                    ts: now, 
                    killed : data.killedPlayer.id, 
                    usedTool: data.usedTool, 
                    toolWielder: data.toolWielder
                });
                discord.channels.get( this.discordChannels["PlayerKilled"] ).send( ts_f() + data.killedPlayer.username +" was killed by: "+ data.toolWielder );
                discord.channels.get( this.discordChannels["PublicPlayerKilled"] ).send( '```'+ data.killedPlayer.username +" was killed by: "+ data.toolWielder );
            } else {
                this.killsDb.insert({ 
                    ts: now, 
                    killed : data.killedPlayer.id, 
                });
                discord.channels.get( this.discordChannels["PlayerKilled"] ).send( ts_f() + data.killedPlayer.username +" has suddenly offed themselves" );
                discord.channels.get( this.discordChannels["PublicPlayerKilled"] ).send( '```'+ data.killedPlayer.username +" has suddenly offed themselves" +'```');
            }
        }
    }

    TradeDeckUsed( discord, data )
    {
        console.log( ts_f() + "trade deck used" );
        console.log( data );
    }

    CreatureKilled( discord, data )
    {
        console.log( ts_f() + "creature murdered" );
        console.log( data );
    }

    CreatureSpawned( discord, data )
    {
        console.log( ts_f() + "creature has spawned" );
        console.log( data );
    }

}
