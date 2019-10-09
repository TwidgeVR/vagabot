module.exports = class Player {

    constructor( id, username ) 
    {  
        this.id = id;
        this.username = username;
    }

    set id( id ) { this._id = id; }
    get id() { return _id; }
    
    set username(username) { this._username = username; }
    get username() { return this._username; }

    set bio(bio) { this._bio = bio; }
    get bio() { return _bio; }

    set lastLogin(lastLogin) { this._lastLogin = lastLogin; }
    get lastLogin() { return _lastLogin; }

}
