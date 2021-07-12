const Express = require("express");
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;
const CONNECTION_URL = 'mongodb+srv://CommDem:CommDem@cluster0.ot1mr.mongodb.net/test?retryWrites=true&w=majority';
const DATABASE_NAME = "CommDem";


var app = Express();
app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));
var database, collection;


app.post("/WarriorsDetails", (request, response) => {
    MongoClient.connect(CONNECTION_URL, function(err, db) {
        if (err) throw err;
        database.collection("WarriorsDetails").find({}).toArray(function(err, result) {
          if (err) {
              throw err;
          }
          else{
              response.json({
                  "isSuccess" : true,
                  "message" : result.message,
                  "Data" : result
              })
          }
          db.close();
        });
      });
});