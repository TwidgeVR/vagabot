const moment = require('moment');

function now()
{
    return moment().valueOf();
}

function ts_f()
{
    return "["+ moment().format("h:mm:ss A") +"] " 
}

function insertHandler( err, doc )
{
    if ( err ) { console.log( err ); }
}

function updateHandler( err, rows )
{
    if ( err ) { console.log( err ); }
}

module.exports = class Subscriptions {
    constructor( discordChannels, playersDb, killsDb, chunksDb ) {
        this.discordChannels = discordChannels;
        this.playersDb = playersDb;
        this.killsDb = killsDb;
        this.chunksDb = chunksDb;
    }


    PlayerJoined( discord, data )
    {
        //console.log( data );
        this.playersDb.update(
            { id: data.user.id }, 
            { $set: { username: data.user.username, lastLogin: now() } }, 
            { upsert: true },
            updateHandler
        );
        discord.channels.get( this.discordChannels["PlayerJoined"] ).send( ts_f() + data.user.username +" joined the server" );
        console.log( ts_f() + data.user.username +" joined the server" );
    }

    PlayerLeft( discord, data )
    {
        //console.log( data );
        discord.channels.get( this.discordChannels["PlayerLeft"] ).send( ts_f() + data.user.username +" left the server" );
        console.log( ts_f() + data.user.username +" left the server" );
    }

    PlayerMovedChunk( discord, data )
    {
        //console.log( data );
        this.playersDb.update({ id: data.player.id }, { $set: { lastChunk: data.newChunk } }, {}, updateHandler );
        this.chunksDb.insert({ ts: now(), player: data.player.id, chunk: data.newChunk }, insertHandler );
        // also update the zone history for the new chunk
        // TODO
        console.log( ts_f() + data.player.username +" has moved to chunk "+ data.newChunk );
    }

    PlayerKilled( discord, data )
    {
        //console.log( data );
        console.log( ts_f() + "player kill" );
        if ( data.killerPlayer != undefined ) 
        {
            this.killsDb.insert({ 
                ts: now(), 
                killed : data.killedPlayer.id, 
                killer: data.killerPlayer.id, 
                usedTool: data.usedTool, 
                toolWielder: data.toolWielder
            }, insertHandler );
            discord.channels.get( this.discordChannels["PlayerKilled"] ).send( ts_f() + data.killerPlayer.username +" has killed "+ data.killedPlayer.username );
            discord.channels.get( this.discordChannels["PublicPlayerKilled"] ).send( '```'+ data.killerPlayer.username +" has murdered "+ data.killedPlayer.username +'```' );
        } else {
            if ( data.toolWielder )
            {
                this.killsDb.insert({ 
                    ts: now(), 
                    killed : data.killedPlayer.id, 
                    usedTool: data.usedTool, 
                    toolWielder: data.toolWielder
                }, insertHandler );
                discord.channels.get( this.discordChannels["PlayerKilled"] ).send( ts_f() + data.killedPlayer.username +" was killed by: "+ data.toolWielder );
                discord.channels.get( this.discordChannels["PublicPlayerKilled"] ).send( '```'+ data.killedPlayer.username +" was killed by: "+ data.toolWielder );
            } else {
                this.killsDb.insert({ 
                    ts: now(), 
                    killed : data.killedPlayer.id, 
                }, insertHandler );
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
