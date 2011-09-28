var mongo = require("mongodb");

// Use environment to get MongoDB info, and fall back to local instance
var mongoServer = '127.0.0.1';
var mongoPort =  27017;
var mongoUsername = 'admin';
var mongoPassword = null;  // Null is fine for local instance

var db = new mongo.Db('urlshortener', new mongo.Server(mongoServer, mongoPort, { auto_reconnect: true }));

db.open(function(err, p_client) {
  db.authenticate(mongoUsername, mongoPassword, function(err) {
   //Change error handler when going into production 
   if (err) console.log(err);    
  });
});

// Converts a numeric value to a relatively short, URL-safe string representation. 
// For example, numberToShortString(623432233) == "LkniP"
function numberToShortString(num) {
    var charsToUse = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-';
    var base = charsToUse.length;
    var result = "";
    do {
        var remainder = num % base;
        num = Math.floor(num / base);
        result = charsToUse.charAt(remainder) + result;
    } while (num > 0);
    return result;    
}

function getNextSequentialId(sequenceName, callback) {
    db.collection("sequences", function(err, collection) {
        collection.findAndModify(
            { name: sequenceName }, // Query
            [],                     // Sort
            { $inc : { "id" : 1 }}, // Update
            {},                     // Options
            function(err, entryBeforeUpdate) {
                if (!entryBeforeUpdate) {
                    // Sequence entry needs to be initialized
                    collection.save({ name: sequenceName, id: 1 });
                    entryBeforeUpdate = { id: 0 };
                }
                callback(entryBeforeUpdate.id);
            }
        )
    });
}

var fns = module.exports = {
    count: function(callback) {
        db.collection("urls", function(err, collection) {
            collection.count(function(err, count) { callback(count) });
        });
    },
    
    shorten: function(url, callback) {
        getNextSequentialId("urls", function(newId) {
            db.collection("urls", function(err, collection) {
                // We can return the shortened URL result
                var uniqueShortId = numberToShortString(newId);
                callback({ id: uniqueShortId });
                
                // ... *before* asynchronously saving it to the DB
                collection.save({
                    id: uniqueShortId,
                    url: url
                });
            });
            
        });
    },
    
    findById: function(id, callback) {
        db.collection("urls", function(err, collection) {
            collection.findOne({ id: id }, function(err, result) {
                callback(result);
            });
        });
    }
}