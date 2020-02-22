var NodeCache = require("node-cache"),
	connection = require('./database'),
  async = require("async");

const ttl = 60 * 60 * 1; // cache for 1 Hour
const myCache = new NodeCache(); // Create a new cache service instance

var UserCacheModel = {
 getUser(user_id){
  return new Promise(function(resolve, reject){
    const selectQuery = `SELECT nickname FROM users WHERE user_id =` + user_id;
    const key = `UserNickname_` + user_id;
    console.log("key" + key);
    var userInfo, success;

    async.waterfall([
    function(callback){
      userInfo = myCache.get(key)
      console.log("test1")
      callback(null, userInfo)
    },
    function(userInfo, callback){
      if (typeof userInfo === "undefined"){
        console.log("hi");
        lookup(selectQuery).then(function(userInfo){
        callback(null, userInfo);
      });
    } else {
        console.log("didn't have to lookup!")
        callback(null, userInfo);
      }
    },
    function(userInfo, callback){
        success = myCache.set(key, userInfo, 1000);
        if (!success){
          console.log("err");
        }
        else { 
          console.log("success! Userinfo is", userInfo);
          callback(null, userInfo)
        }
      console.log("test2");
    }], function(err, userInfo){
    resolve(userInfo);
    })
  })
  }
}

isSuccessful= function(success, userInfo){
  if (!success){
          console.log("err");
        }
        else{
          console.log("success!");
          return userInfo;
        }
}

lookup = function(selectQuery){
  return new Promise(function(resolve, reject){
    connection.query(selectQuery, function(err, rows){
      if (err){
        console.log(err);
        return reject(err);
      }
      console.log("info", rows[0]);
      tmp = rows[0].nickname;
      console.log(tmp);
      resolve(tmp)
    })
  })
}


module.exports = UserCacheModel;
