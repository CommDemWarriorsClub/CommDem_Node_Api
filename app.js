const Express = require("express");
const BodyParser = require("body-parser");
const mongoose = require('mongoose');
const moment= require('moment') 
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;
const CONNECTION_URL = 'mongodb+srv://CommDem:CommDem@cluster0.ot1mr.mongodb.net/test?retryWrites=true&w=majority';
const DATABASE_NAME = "CommDem";
const cron = require('node-cron');
const { request } = require("express");

var app = Express();
app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));
var database, collection;

app.listen(process.env.PORT || 3000, () => {
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
                        as : "DailyCommitments"
                    }
                },
                { 
            $project : {
            "_id" : 1.0,
            "CONTACT NO" : 1.0,
            "NAME" : 1.0,
            "isLeader" : 1.0,
            "DailyCommitments" : 1.0
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

//request - memberId
app.post("/getDetailsOfBuddy", (request, response) => {
    MongoClient.connect(CONNECTION_URL, function(err, db) {
        database.collection("WarriorsBuddies").aggregate(
            [
                {
                    $match : {
                        "memberId" : ObjectId(request.body["memberId"]),
                    }
                },
]
).toArray(function(err, result) {
          if (err) {  
              throw err;
          }
          else if(result.length > 0){
            MongoClient.connect(CONNECTION_URL, function(err, db) {
                database.collection("WarriorsDetails").aggregate(
                    [
                        {
                            $match : {
                                "_id" : ObjectId(result[0]["buddyId"]),
                            }
                        },
                        { 
                            $project : {
                            "_id" : 1.0,
                            "CONTACT NO" : 1.0,
                            "NAME" : 1.0,
                            "isLeader" : 1.0,
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
                          "message" : "Buddy Details Found!",
                          "Data" : result
                      })
                  }
                  else{
                    response.json({
                        "isSuccess" : true,
                        "message" : "No Buddy Found!",
                        "Data" : []
                    }) 
                  }
                  db.close();
                });
              });
          }
          else{
            response.json({
                "isSuccess" : true,
                "message" : "No Buddy Found!",
                "Data" : []
            }) 
          }
          db.close();
        });
      });
});

app.post("/getAllNamesAndMemberIdOfWarriors", (request, response) => {
    MongoClient.connect(CONNECTION_URL, function(err, db) {
        database.collection("WarriorsDetails").aggregate(
            [
                {
                    $lookup : {
                        from : "WarriorsBuddies",
                        localField : "_id",
                        foreignField : "buddyId",
                        as : "buddyDetails"
                    }
                },
                { 
            $project : {
            "_id" : 1.0,
            "NAME" : 1.0,
            "buddyDetails" : 1.0
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

//request - memberId,Commitment,Date of Commitment,isCompleted,currentDate
app.post("/addNewCommitment", (request, response) => {
    MongoClient.connect(CONNECTION_URL, function(err, db) {
        var req = {
            "memberId" : ObjectId(request.body["memberId"]),
            "Commitment" : request.body["Commitment"],
            "fromCommitmentDate" : request.body["fromCommitmentDate"],
            "toCommitmentDate" : request.body["toCommitmentDate"],
            // "isCompleted" : request.body["isCompleted"],
            // "todaysDate" : request.body["todaysDate"],
            // "isLoadingFinished" : true
        };
        database.collection("Commitments").aggregate(
            [
   {
       $match : {
        "memberId" : ObjectId(request.body["memberId"]),
        "Commitment" : request.body["Commitment"],
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
                    console.log("res result");
                    console.log(res["ops"]);
                    response.json({
                        "isSuccess" : true,
                        "message" : "Commitment Added Successfully!",
                        "Data" : "1"
                    })
                    addNextDayCommitment(res["ops"]);
                }
                db.close();
              });
          }
          db.close();
        });
      });
});

app.post("/updateCommitmentOfMember", (request, response) => {
    MongoClient.connect(CONNECTION_URL, function(err, db) {
        var myquery = { 
            "commitmentId": ObjectId(request.body["commitmentId"]),
            "memberId": ObjectId(request.body["memberId"]),
         };
         var myquery1 = { 
            "_id": ObjectId(request.body["commitmentId"]),
            "memberId": ObjectId(request.body["memberId"]),
         };
  var newvalues = { 
      $set: 
      {
          "Commitment": request.body["Commitment"],
          "fromCommitmentDate": request.body["fromCommitmentDate"],
          "toCommitmentDate": request.body["toCommitmentDate"],
        //   "todaysDate" : request.body["todaysDate"]
         }
         };
        database.collection("dailyCommitments").updateMany(myquery, newvalues, function(err, res) {
            if (err) throw err;
            console.log("1 document updated");
            database.collection("Commitments").updateMany(myquery1, newvalues, function(err, res) {
                if (err) throw err;
                console.log("1 document updated");
                response.json({
                    "isSuccess" : true,
                    "message" : "Commitment Updated Successfully!!",
                    "Data" : "1"
                }) 
                db.close();
              });
          });
      });
});

//request - null / memberId
app.post("/getCommitments", (request, response) => {
    MongoClient.connect(CONNECTION_URL, function(err, db) {
        if(request.body["memberId"]!=null){
            database.collection("Commitments").aggregate(
                [
       {
           $match : {
               "memberId" : ObjectId(request.body["memberId"]),
            //    "todaysDate" : date + " " + longMonth.toUpperCase() + " " + year,
           }
       }
    ]
    ).toArray(function(err, result) {
              if (err) {
                  throw err;
              }
              else if(result.length > 0){
                  for(let i=0;i<result.length;i++){
                      console.log('result[i]["_id"]');
                      console.log(result[i]);
                    database.collection("dailyCommitments").aggregate([
                        {
                            $match : {
                                "commitmentId" : ObjectId(result[i]["_id"]),
                            },
                        },
                    ]).toArray(function(err, resul) {
                      if (err) {
                          throw err;
                      }
                      else if(resul.length == 0){
                        database.collection("dailyCommitments").insertMany([{
                            "memberId" : result[i]["memberId"],
                            "commitmentId" : result[i]["_id"],
                            "Commitment" : result[i]["Commitment"],
                            "fromCommitmentDate" : result[i]["fromCommitmentDate"],
                            "toCommitmentDate" : result[i]["toCommitmentDate"],
                            "todaysDate" : date + " " + longMonth.toUpperCase() + " " + year,
                            "isCompleted" : false,
                            "isLoadingFinished" : true
                        }], function(err, res) {
                            if (err) {
                                throw err;
                            }
                            else{
                              // res.json({
                              //       "isSuccess" : true,
                              //       "message" : "New Commitment Completed Successfully!",
                              //       "Data" : 1
                              //   })
                            }
                          });
                      }
                    });
                  }
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

//request - memberId,commitmentId,isCompleted
app.post("/updateCommitmentCompletion", (request, response) => {
    MongoClient.connect(CONNECTION_URL, function(err, db) {
        var myquery = { 
            "commitmentId": ObjectId(request.body["commitmentId"]),
         };
  var newvalues = { 
      $set: 
      {
          "isCompleted": request.body["isCompleted"]
         }
         };
        database.collection("dailyCommitments").updateOne(myquery, newvalues, function(err, res) {
            if (err) throw err;
            response.json({
                "isSuccess" : true,
                "message" : "Commitment Updated Successfully!!",
                "Data" : "1"
            }) 
            db.close();
          });
      });
});

let commitmentIdsOfMember = [];

async function addDailyCommitmentsInSchema(commitmentIdsOfMember,j,request,response){
    await database.collection("dailyCommitments").aggregate([
        {
            $match : {
                "memberId" : ObjectId(commitmentIdsOfMember[j]["memberId"]),
                "todaysDate" : date + " " + longMonth.toUpperCase() + " " + year,
                "commitment" : [
                    {
                        "commitmentId" : ObjectId(commitmentIdsOfMember[j]["commitmentId"]),
                        "isCompleted" : false,
                        "fromCommitmentDate" : commitmentIdsOfMember[j]["fromCommitmentDate"],
                       "toCommitmentDate" : commitmentIdsOfMember[j]["toCommitmentDate"],
                    }
                ]
            }
        },
        {
            $match : {
                "memberId" : ObjectId(commitmentIdsOfMember[j]["memberId"]),
                "todaysDate" : date + " " + longMonth.toUpperCase() + " " + year,
                "commitment" : [
                    {
                        "commitmentId" : ObjectId(commitmentIdsOfMember[j]["commitmentId"]),
                        "isCompleted" : true,
                        "fromCommitmentDate" : commitmentIdsOfMember[j]["fromCommitmentDate"],
                       "toCommitmentDate" : commitmentIdsOfMember[j]["toCommitmentDate"],
                    }
                ]
            }
        }
    ]).toArray(function(err, result) {
      if (err) {
          throw err;
      }
      else if(result.length > 0){
        // response.json({
        //     "isSuccess" : true,
        //     "message" : "Commitment Already Exists!!",
        //     "Data" : []
        // }) 
      }
      else{
        database.collection("dailyCommitments").aggregate([
            {
                $match : {
                    "memberId" : ObjectId(commitmentIdsOfMember[j]["memberId"]),
                    "todaysDate" : date + " " + longMonth.toUpperCase() + " " + year,
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
                  "todaysDate" : date + " " + longMonth.toUpperCase() + " " + year,
                  "memberId" : ObjectId(commitmentIdsOfMember[j]["memberId"]),
                    "commitment" : [
                        {
                            "commitmentId" : ObjectId(commitmentIdsOfMember[j]["commitmentId"]),
                            "isCompleted" : false,
                            "fromCommitmentDate" : commitmentIdsOfMember[j]["fromCommitmentDate"],
                            "toCommitmentDate" : commitmentIdsOfMember[j]["toCommitmentDate"],
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
                            "commitmentId" : ObjectId(commitmentIdsOfMember[j]["commitmentId"]),
                            "isCompleted" : false,
                            "fromCommitmentDate" : commitmentIdsOfMember[j]["fromCommitmentDate"],
                            "toCommitmentDate" : commitmentIdsOfMember[j]["toCommitmentDate"],
                        }
                    
                 } 
                },
                function (err, result) {
                         if (err) {
                    throw err;
                }
                else{
                //   response.json({
                //       "isSuccess" : true,
                //       "message" : "Commitment Updated Successfully!",
                //       "Data" : []
                //   }) 
                }
                }
            );
          }
          else{
            var req = {
                "todaysDate" : date + " " + longMonth.toUpperCase() + " " + year,
                "memberId" : ObjectId(commitmentIdsOfMember[j]["memberId"]),
                "commitment" : [{
                    "commitmentId" : ObjectId(commitmentIdsOfMember[j]["commitmentId"]),
                    "isCompleted" : false,
                      "fromCommitmentDate" : commitmentIdsOfMember[j]["fromCommitmentDate"],
                      "toCommitmentDate" : commitmentIdsOfMember[j]["toCommitmentDate"],
                   }],
            }
          database.collection("dailyCommitments").insertOne(req, function(err, res) {
              if (err) {
                  throw err;
              }
              else{
                // res.json({
                //       "isSuccess" : true,
                //       "message" : "New Commitment Completed Successfully!",
                //       "Data" : 1
                //   })
              }
            });
          }
        });
      }
    });
}

async function getMemberCommitment(request,response){
 await MongoClient.connect(CONNECTION_URL, function(err, db) {
    database.collection("dailyCommitments").aggregate().toArray(function(err, result) {
      if (err) {
          throw err;
      }
      else if(result.length == 0){
        database.collection("Commitments").aggregate().toArray(function(err, result) {
            if (err) {
                throw err;
            }
            else if(result.length > 0){
                for(let i=0;i<result.length;i++){
                  commitmentIdsOfMember.push({
                      "commitmentId" : result[i]["_id"],
                      "memberId" : result[i]["memberId"],
                      "fromCommitmentDate" : result[i]["fromCommitmentDate"],
                      "toCommitmentDate" : result[i]["toCommitmentDate"],
                      "todaysDate" : date + " " + longMonth.toUpperCase() + " " + year,
                      "isCompleted" : false,
                  });
                }
                database.collection("dailyCommitments").insertMany(commitmentIdsOfMember, function(err, res) {
                    if (err) {
                        throw err;
                    }
                    else{
                      // res.json({
                      //       "isSuccess" : true,
                      //       "message" : "New Commitment Completed Successfully!",
                      //       "Data" : 1
                      //   })
                    }
                  });
            }
            db.close();
          });
      }
      else{
        database.collection("dailyCommitments").aggregate([
            {
                $match : {
                    "todaysDate" : date + " " + longMonth.toUpperCase() + " " + year,
                },
            },
        ]).toArray(function(err, result) {
          if (err) {
              throw err;
          }
          else if(result.length == 0){
            database.collection("Commitments").aggregate().toArray(function(err, result) {
                if (err) {
                    throw err;
                }
                else if(result.length > 0){
                    for(let i=0;i<result.length;i++){
                      commitmentIdsOfMember.push({
                          "commitmentId" : result[i]["_id"],
                          "memberId" : result[i]["memberId"],
                          "fromCommitmentDate" : result[i]["fromCommitmentDate"],
                          "toCommitmentDate" : result[i]["toCommitmentDate"],
                          "todaysDate" : date + " " + longMonth.toUpperCase() + " " + year,
                          "isCompleted" : false,
                      });
                    }
                    database.collection("dailyCommitments").insertMany(commitmentIdsOfMember, function(err, res) {
                        if (err) {
                            throw err;
                        }
                        else{
                          // res.json({
                          //       "isSuccess" : true,
                          //       "message" : "New Commitment Completed Successfully!",
                          //       "Data" : 1
                          //   })
                        }
                      });
                }
                db.close();
              });
          }
        });
      }
    });
});
}
 
//request - Today's Date,memberId,commitmentId
app.post("/dailyCommitments", (request, response) => {
    getMemberCommitment(request,response);
});

app.post("/addMyBuddy", (request, response) => {
    MongoClient.connect(CONNECTION_URL, function(err, db) {
            database.collection("WarriorsBuddies").aggregate([
                {
                    $match : {
                        "memberId" : ObjectId(request.body["memberId"]),
                        "buddyId" : ObjectId(request.body["buddyId"]),
                        "buddyFromDate" : request.body["buddyFromDate"],
                        "buddyToDate" : request.body["buddyToDate"],
                    },
                },
            ]).toArray(function(err, result) {
              if (err) {
                  throw err;
              }
              else if(result.length > 0){
                response.json({
                    "isSuccess" : true,
                    "message" : "Buddy Already Exists in given time Interval!!",
                    "Data" : []
                }) 
              }
              else{
                var req = {
                    "memberId" : ObjectId(request.body["memberId"]),
                    "buddyId" : ObjectId(request.body["buddyId"]),
                    "buddyFromDate" : request.body["buddyFromDate"],
                    "buddyToDate" : request.body["buddyToDate"],
                };
                database.collection("WarriorsBuddies").insertOne(req, function(err, res) {
                    if (err) {
                        throw err;
                    }
                    else{
                        response.json({
                            "isSuccess" : true,
                            "message" : "My Buddy Added Successfully!",
                            "Data" : "1"
                        })
                    }
                    db.close();
                  });
              }
              db.close();
            });
          db.close();
      });
});

app.post("/getMyBuddyDailyCommitments", (request, response) => {
    MongoClient.connect(CONNECTION_URL, function(err, db) {
            database.collection("WarriorsDetails").aggregate(
                [
                    {
                        $match : {
                            "_id" : ObjectId(request.body["memberId"]) 
                        }
                    },
                    {
                        $lookup : {
                            from : "dailyCommitments",
                            localField : "_id",
                            foreignField : "memberId",
                            as : "DailyCommitments"
                        }
                    },
                    { 
                $project : {
                "_id" : 1.0,
                "CONTACT NO" : 1.0,
                "NAME" : 1.0,
                "isLeader" : 1.0,
                "DailyCommitments" : 1.0
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
                      "message" : "Buddy's Commitments Found!",
                      "Data" : result
                  })
              }
              else{
                response.json({
                    "isSuccess" : true,
                    "message" : "No Commitment Found!",
                    "Data" : []
                }) 
              }
              db.close();
            });
          db.close();
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

let ts = Date.now();

let date_ob = new Date(ts);
let date = date_ob.getDate();
let month = date_ob.getMonth() + 1;
let year = date_ob.getFullYear();
let longMonth = date_ob.toLocaleString('en-us', { month: 'long' });

async function getCronedData(){
        console.log('Api Called every minute');
        console.log(date + " " + longMonth.toUpperCase() + " " + year);
        await MongoClient.connect(CONNECTION_URL, function(err, db) {
            database.collection("dailyCommitments").aggregate([
                {
                    $match : {
                        "todaysDate" : date + " " + longMonth.toUpperCase() + " " + year,
                    },
                }
            ]).toArray(function(err, result) {
              if (err) {
                  throw err;
              }
              else if(result.length == 0){
                MongoClient.connect(CONNECTION_URL, function(err, db) {
                        database.collection("dailyCommitments").aggregate(
                            [
                   {
                       $match : {
                           "todaysDate" : (date - 1) + " " + longMonth.toUpperCase() + " " + year,
                       }
                   }
                ]
                ).toArray(function(err, result) {
                          if (err) {
                              throw err;
                          }
                          else if(result.length > 0){
                              addNextDayCommitment(result);
                          }
                          else{
                            database.collection("Commitments").aggregate().toArray(function(err, res) {
                                if (err) {          
                                    throw err;
                                }
                                else if(res.length > 0){
                                    addNextDayCommitment(res);
                                }
                                else{
                                 
                                }
                                db.close();
                              });
                          }
                          db.close();
                        });
                  });
              }
            });
            });
}
  
let commitment = [];

async function addNextDayCommitment(result){
    console.log("result");
    console.log(result);
    for(let i=0;i<result.length;i++){
        commitment.push({
            "memberId" : ObjectId(result[i]["memberId"]),
            "commitmentId" : ObjectId(result[i]["_id"]),
            "Commitment" : result[i]["Commitment"],
            "fromCommitmentDate" : result[i]["fromCommitmentDate"],
            "toCommitmentDate" : result[i]["toCommitmentDate"],
            "isCompleted" : false,
            "todaysDate" : date + " " + longMonth.toUpperCase() + " " + year,
            "isLoadingFinished" : true
        }); 
    }
      database.collection("dailyCommitments").insertMany(commitment, function(err, res) {
          if (err) {
              throw err;
          }
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

