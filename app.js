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
        console.log("Welcome to `" + DATABASE_NAME + " Warriors !");
    });
});

//request - mobileNo
app.post("/warriorExistOrNot", (request, response) => {
    MongoClient.connect(CONNECTION_URL, function(err, db) {
        database.collection("WarriorsDetails").aggregate(
            [
                { 
            $project : {
            "_id" : 1.0,
            "CONTACT NO" : 1.0,
            "NAME" : 1.0,
            "isLeader" : 1.0
     }
   },
   {
       $match : {
           "CONTACT NO" : request.body["mobileNo"]
       }
   }
]
).toArray(function(err, result) {
          if (err) {
              throw err;
          }
          else if(result.length > 0){
              response.json({
                  "isSuccess" : true,
                  "message" : "Warrior Exists!",
                  "Data" : result
              })
          }
          else{
            response.json({
                "isSuccess" : true,
                "message" : "Warrior Does Not Exists!",
                "Data" : []
            }) 
          }
          db.close();
        });
      });
});

app.post("/allWarriors", (request, response) => {
    MongoClient.connect(CONNECTION_URL, function(err, db) {
        database.collection("WarriorsDetails").aggregate(
            [
                {
                    $lookup : {
                        from : "Commitments",
                        localField : "_id",
                        foreignField : "memberId",
                        as : "Commitments"
                    }
                },
                {
                    $lookup : {
                        from : "dailyCompletedCommitments",
                        localField : "_id",
                        foreignField : "memberId",
                        as : "Completed_Commitments"
                    }
                },
                { 
            $project : {
            "_id" : 1.0,
            "CONTACT NO" : 1.0,
            "NAME" : 1.0,
            "isLeader" : 1.0,
            "Commitments" : 1.0,
            "Completed_Commitments" : 1.0
     }
   },
]
).toArray(function(err, result) {
          if (err) {  
              throw err;
          }
          else if(result.length > 0){
              response.json({
                  "isSuccess" : true,
                  "message" : "Warriors Found!",
                  "Data" : result
              })
          }
          else{
            response.json({
                "isSuccess" : true,
                "message" : "No Warrior Found!",
                "Data" : []
            }) 
          }
          db.close();
        });
      });
});

//request - all details
app.post("/addNewWarrior", (request, response) => {
    MongoClient.connect(CONNECTION_URL, function(err, db) {
        database.collection("WarriorsDetails").insertOne(request.body, function(err, res) {
          if (err) {
              throw err;
          }
          else{
              response.json({
                  "isSuccess" : true,
                  "message" : "Data Added Successfully!",
                  "Data" : 1
              })
          }
          db.close();
        });
      });
});

//request - memberId,Commitment,Date of Commitment
app.post("/addNewCommitment", (request, response) => {
    MongoClient.connect(CONNECTION_URL, function(err, db) {
        var req = {
            "memberId" : ObjectId(request.body["memberId"]),
            "Commitment" : request.body["Commitment"],
            "commitmentDate" : request.body["commitmentDate"],
            "isCompleted" : false
        };
        database.collection("Commitments").aggregate(
            [
   {
       $match : {
           "memberId" : ObjectId(request.body["memberId"]),
           "Commitment" : request.body["Commitment"]
       }
   }
]
).toArray(function(err, result) {
          if (err) {
              throw err;
          }
          else if(result.length > 0){
              response.json({
                  "isSuccess" : true,
                  "message" : "Commitment already Exists",
                  "Data" : []
              })
              db.close();
          }
          else{
            database.collection("Commitments").insertOne(req, function(err, res) {
                if (err) {
                    throw err;
                }
                else{
                    response.json({
                        "isSuccess" : true,
                        "message" : "Commitment Added Successfully!",
                        "Data" : 1
                    })
                }
                db.close();
              });
          }
          db.close();
        });
      });
});

//request - null / memberId
app.post("/getCommitments", (request, response) => {
    MongoClient.connect(CONNECTION_URL, function(err, db) {
        console.log(request.body);
        if(request.body["memberId"]!=null){
            database.collection("Commitments").aggregate(
                [
       {
           $match : {
               "memberId" : ObjectId(request.body["memberId"])
           }
       }
    ]
    ).toArray(function(err, result) {
              if (err) {
                  throw err;
              }
              else if(result.length > 0){
                  response.json({
                      "isSuccess" : true,
                      "message" : "Commitments Found!",
                      "Data" : result
                  })
              }
              else{
                response.json({
                    "isSuccess" : true,
                    "message" : "No Commitments Found!",
                    "Data" : []
                }) 
              }
              db.close();
            });
    }
    else{
        database.collection("Commitments").aggregate().toArray(function(err, result) {
          if (err) {
              throw err;
          }
          else if(result.length > 0){
              response.json({
                  "isSuccess" : true,
                  "message" : "Commitments Found!",
                  "Data" : result
              })
          }
          else{
            response.json({
                "isSuccess" : true,
                "message" : "No Commitments Found!",
                "Data" : []
            }) 
          }
          db.close();
        });
    }
      });
});

//request - Today's Date,memberId,commitmentId
app.post("/addDailyCompletedCommitments", (request, response) => {
    MongoClient.connect(CONNECTION_URL, function(err, db) {
        database.collection("dailyCompletedCommitments").aggregate([
            {
                $match : {
                    "currentDate" : request.body["currentDate"],
                    "memberId" : ObjectId(request.body["memberId"]),
                    "commitmentId" : ObjectId(request.body["commitmentId"])
                }
            }
        ]).toArray(function(err, result) {
          if (err) {
              throw err;
          }
          else if(result.length == 0){
            database.collection("dailyCompletedCommitments").aggregate([
                {
                    $match : {
                        "memberId" : ObjectId(request.body["memberId"]),
                        "currentDate" : request.body["currentDate"],
                    }
                }
            ]).toArray(function(err, result) {
              if (err) {
                  throw err;
              }
              else if(result.length > 0){
                  console.log("result");
                  console.log(result);
                var req = {
                      "currentDate" : request.body["currentDate"],
                      "memberId" : ObjectId(request.body["memberId"]),
                        "commitmentId" : [ObjectId(request.body["commitmentId"])]
                  }
                database.collection("dailyCompletedCommitments").updateOne(
                  {
                      "_id" : ObjectId(result[0]._id)
                  },  
            {  
                $push:
                 { 
                     "commitmentId" : ObjectId(request.body["commitmentId"])
                     } 
                    },
                    function (err, result) {
                             if (err) {
                        throw err;
                    }
                    else{
                      response.json({
                          "isSuccess" : true,
                          "message" : "Commitment Completed Successfully!",
                          "Data" : []
                      }) 
                    }
                        db.close();
                    }
                );
              }
              else{
                var req = {
                    "currentDate" : request.body["currentDate"],
                    "memberId" : ObjectId(request.body["memberId"]),
                      "commitmentId" : [ObjectId(request.body["commitmentId"])],
                      "isCompleted" : true
                }
              database.collection("dailyCompletedCommitments").insertOne(req, function(err, res) {
                  if (err) {
                      throw err;
                  }
                  else{
                      response.json({
                          "isSuccess" : true,
                          "message" : "Commitment Completed Successfully!",
                          "Data" : 1
                      })
                  }
                  db.close();
                });
              }
              db.close();
            });
          }
          else{
            response.json({
                "isSuccess" : true,
                "message" : "Commitment Already Completed For Today!",
                "Data" : []
            })
          }
          db.close();
        });
      });
});
