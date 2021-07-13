const Express = require("express");
const BodyParser = require("body-parser");
const mongoose = require('mongoose');

const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;
const CONNECTION_URL = 'mongodb+srv://CommDem:CommDem@cluster0.ot1mr.mongodb.net/test?retryWrites=true&w=majority';
const DATABASE_NAME = "CommDem";


var app = Express();
app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));
var database, collection;

app.listen(process.env.PORT || 5000, () => {
    MongoClient.connect(CONNECTION_URL, { useNewUrlParser: true,useUnifiedTopology:true }, (error, client) => {
        if(error) {
            throw error;
        }
        database = client.db(DATABASE_NAME);
        collection = database.collection("WarriorsDetails");
        console.log("Connected to `" + DATABASE_NAME + "`!");
    });
});

app.post("/WarriorsDetails", (request, response) => {
    MongoClient.connect(CONNECTION_URL, function(err, db) {
        database.collection("WarriorsDetails").aggregate().toArray(function(err, result) {
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

