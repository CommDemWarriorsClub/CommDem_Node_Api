const Express = require("express");
const BodyParser = require("body-parser");
const mongoose = require('mongoose');
const moment= require('moment') 
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;
const CONNECTION_URL = 'mongodb+srv://CommDem:CommDem@cluster0.ot1mr.mongodb.net/test?retryWrites=true&w=majority';
const DATABASE_NAME = "CommDem";
const cron = require('node-cron');

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
                        from : "dailyCommitments",
                        localField : "_id",
                        foreignField : "memberId",
                        as : "Daily_Commitments"
                    }
                },
                { 
            $project : {
            "_id" : 1.0,
            "CONTACT NO" : 1.0,
            "NAME" : 1.0,
            "isLeader" : 1.0,
            "Daily_Commitments" : 1.0
     }
   },
]
).toArray(function(err, result) {
          if (err) {  
              throw err;
          }
          else if(result.length > 0){
           console.log("result");
           console.log(result);
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
app.post("/dailyCommitments", (request, response) => {
    MongoClient.connect(CONNECTION_URL, function(err, db) {
            database.collection("dailyCommitments").aggregate([
                {
                    $match : {
                        "memberId" : ObjectId(request.body["memberId"]),
                        "todaysDate" : request.body["todaysDate"],
                        "commitment" : [{
                            "commitmentId" : ObjectId(request.body["commitment"][0]["commitmentId"]),
                            "isCompleted" : request.body["commitment"][0]["isCompleted"],
                        }]
                    }
                }
            ]).toArray(function(err, result) {
              if (err) {
                  throw err;
              }
              else if(result.length > 0){
                response.json({
                    "isSuccess" : true,
                    "message" : "Commitment Already Exists!!",
                    "Data" : []
                }) 
              }
              else{
                database.collection("dailyCommitments").aggregate([
                    {
                        $match : {
                            "memberId" : ObjectId(request.body["memberId"]),
                            "todaysDate" : request.body["todaysDate"],
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
                          "todaysDate" : request.body["todaysDate"],
                          "memberId" : ObjectId(request.body["memberId"]),
                            "commitment" : [
                                {
                                    "commitmentId" : ObjectId(request.body["commitment"][0]["commitmentId"]),
                                    "isCompleted" : false
                                }
                            ]
                      }
                    database.collection("dailyCommitments").updateOne(
                      {
                          "_id" : ObjectId(result[0]._id)
                      },  
                {  
                    $push:
                     { 
                         "commitment" : 
                                {
                                    "commitmentId" : ObjectId(request.body["commitment"][0]["commitmentId"]),
                                    "isCompleted" : false
                                }
                            
                         } 
                        },
                        function (err, result) {
                                 if (err) {
                            throw err;
                        }
                        else{
                          response.json({
                              "isSuccess" : true,
                              "message" : "Commitment Updated Successfully!",
                              "Data" : []
                          }) 
                        }
                            db.close();
                        }
                    );
                  }
                  else{
                    var req = {
                        "todaysDate" : request.body["todaysDate"],
                        "memberId" : ObjectId(request.body["memberId"]),
                          "commitment" : [{
                              "commitmentId" : ObjectId(request.body["commitment"][0]["commitmentId"]),
                              "isCompleted" : false
                           }],
                    }
                  database.collection("dailyCommitments").insertOne(req, function(err, res) {
                      if (err) {
                          throw err;
                      }
                      else{
                          response.json({
                              "isSuccess" : true,
                              "message" : "New Commitment Completed Successfully!",
                              "Data" : 1
                          })
                      }
                      db.close();
                    });
                  }
                  db.close();
                });
              }
              db.close();
            });
        //   }
        //   else{
        //     response.json({
        //         "isSuccess" : true,
        //         "message" : "Commitment Already Completed For Today!",
        //         "Data" : []
        //     })
        //   }
          db.close();
        // });
      });
});


function getCurrentDate() {
    let date = moment()
        .tz("Asia/Calcutta")
        .format("DD/MM/YYYY,h:mm:ss a")
        .split(",")[0];

    return date;
}

// cron.schedule('* * * * *', async function() {
//     await getCronedData()
// })

async function getCronedData(){
        console.log('Api Called every minute');
        await MongoClient.connect(CONNECTION_URL, function(err, db) {
            database.collection("Commitments").find({}).toArray(async function(err, resbody) {
                if (err) throw err;
                for (let i = 0; i < resbody.length; i++) {
                    await updateCommitments(i,resbody[i],db);
                  }
                db.close();
              });
            });
}
   
async function updateCommitments(i,resbody,db){
    MongoClient.connect(CONNECTION_URL, function(err, db) {
        database.collection("dailyCommitments").aggregate([
            {
                $match : {
                    "memberId" : ObjectId(resbody["memberId"]),
                    "currentDate" : resbody["currentDate"],
                    "commitment" : [{
                        "commitmentId" : ObjectId(resbody["commitmentId"]),
                        "isCompleted" : false
                    }
                    ]
                },
                $match : {
                    "memberId" : ObjectId(resbody["memberId"]),
                    "currentDate" : resbody["currentDate"],
                    "commitment" : [{
                        "commitmentId" : ObjectId(resbody["commitmentId"]),
                        "isCompleted" : true
                    }
                    ]
                }
            }
        ]).toArray(function(err, result) {
          if (err) {
              throw err;
          }
          else if(result.length > 0){
            response.json({
                "isSuccess" : true,
                "message" : "Commitment Already Exists!!",
                "Data" : []
            }) 
          }
          else{
            database.collection("dailyCommitments").aggregate([
                {
                    $match : {
                        "memberId" : ObjectId(resbody["memberId"]),
                        "currentDate" : resbody["commitmentDate"],
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
                      "currentDate" : resbody["commitmentDate"],
                      "memberId" : ObjectId(resbody["memberId"]),
                        "commitment" : [
                            {
                                "commitmentId" : ObjectId(resbody["commitmentId"]),
                                "isCompleted" : false
                            }
                        ]
                  }
                database.collection("dailyCommitments").updateOne(
                  {
                      "_id" : ObjectId(result[0]._id)
                  },  
            {  
                $push:
                 { 
                     "commitment" : 
                            {
                                "commitmentId" : ObjectId(resbody["commitmentId"]),
                                "isCompleted" : false
                            }
                        
                     } 
                    },
                    function (err, result) {
                             if (err) {
                        throw err;
                    }
                    else{
                      response.json({
                          "isSuccess" : true,
                          "message" : "Commitment Updated Successfully!",
                          "Data" : []
                      }) 
                    }
                        db.close();
                    }
                );
              }
              else{
                var req = {
                    "currentDate" : resbody["currentDate"],
                    "memberId" : ObjectId(resbody["memberId"]),
                      "commitment" : [{
                          "commitmentId" : ObjectId(resbody["commitmentId"]),
                          "isCompleted" : false
                       }],
                }
              database.collection("dailyCommitments").insertOne(req, function(err, res) {
                  if (err) {
                      throw err;
                  }
                  else{
                    //   response.json({
                    //       "isSuccess" : true,
                    //       "message" : "New Commitment Completed Successfully!",
                    //       "Data" : 1
                    //   })
                  }
                  db.close();
                });
              }
              db.close();
            });
          }
          db.close();
        });
    //   }
    //   else{
    //     response.json({
    //         "isSuccess" : true,
    //         "message" : "Commitment Already Completed For Today!",
    //         "Data" : []
    //     })
    //   }
      db.close();
    // });
  });
}

