var fs = require("fs");
var AWS = require("aws-sdk");
AWS.config.loadFromPath("./credentials.json");
var s3 = new AWS.S3();

var express = require("express");
var session = require("express-session");
var userLib = require("./user.js");
var app = express();
var bodyParser = require("body-parser");
var errorHandler = require("errorhandler");
var methodOverride = require("method-override");
var hostname = process.env.HOSTNAME || "localhost";
var port = 8080;
var db = require("./node_modules/mongoskin").db("mongodb://user:password@127.0.0.1:27017/s3FileUpload");

app.use(session({secret: "This is a secret"}));
app.use(methodOverride());
app.use(require("connect").bodyParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())
app.use(express.static(__dirname + "/public"));
app.use(errorHandler());

app.get("/", function(req, res) {
    res.redirect("/index.html");
});

app.post("/uploadFile", function(req, res) {
    var fileInput = req.body.fileInput;
    var tmpPath = req.files.input.path;

    fs.readFile(tmpPath, function(err, data) {
        var params = {
            Bucket: "ame570",
            ACL: "public-read",
            Key: fileInput,
            Body: data,
            ServerSideEncryption: "AES256"
        };

        s3.upload(params, function(err, data) {
            if (err) {
                console.log(err);
            }
            else {
                res.send(data["Location"]); // Send public link to file
                res.end("Success");
            }
        });
    });
});

app.post("/deleteFile", function(req, res) {
    var fileInput = req.body.fileInput;

    var params = {
        Bucket: "ame570",
        Key: fileInput,
    };

    s3.deleteObject(params, function(err, data) {
        if (err) {
            console.log(err);
        }
        else {
            res.end("Success");
        }
    });
});

app.get("/listFiles", function(req, res) {
    var info = req.query;

    db.collection("files").find({user: info.user}).toArray(function(err, result) {
        if (err) {
            res.send("[]")
        }
        else {
            res.send(JSON.stringify(result));
        }
    });
});

app.get("/addFile", function(req, res){
    var info = req.query;

    db.collection("files").findOne({link: info.link}, function(err, result) {
        if (result) {
            var temp = Object.keys(info);
            var key;

            for (var t = 0; t < temp.length; t++) {
                key = temp[t];
                result[key] = info[key];
            }

            db.collection("files").save(result, function(err2) {
                if (err2) {
                    res.send("0");
                }
                else {
                    res.send("1");
                }   
            });
        }
        else {
            db.collection("files").insert(info, function(err3, r3) {
                if (err3) {
                    res.send("0");
                }
                else {
                    res.send("1");
                }   
            });
        }
    });
});

app.get("/deleteFile", function(req, res){
    var info = req.query;

    db.collection("files").remove({user: info.user, link: info.link}, function(err, result) {
         if (err) {
             res.send("0")
         }
         else {
             res.send("1");
         }
     });
});

app.get("/createUser", function(req, res) {
        userLib.add(req, res, db);
        });

app.get("/editUser", function(req, res) {
        userLib.edit(req, res, db);
        });

app.get("/changePassword", function(req, res) {
        userLib.changePassword(req, res, db);
        });

app.get("/login", function(req, res) {
        userLib.login(req, res, db);
        });

app.get("/getUser", function(req, res) {
        userLib.get(req, res, db);
        });

console.log("Simple static server listening at http://" + hostname + ":" + port);
app.listen(port);
