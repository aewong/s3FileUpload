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

app.get("/", function(req, res) {
    res.redirect("/index.html");
});

app.post("/uploadFile", function(req, res) {
    var fileInput = req.body.fileInput;
    var fileName = req.files.input.name;
    var fileType = req.files.input.type;
    var tmpPath = req.files.input.path;
    var s3Path = "/" + fileInput;

    fs.readFile(tmpPath, function(err, data) {
        var params = {
            Bucket: "alldone",
            ACL: "public-read",
            Key: fileInput,
            Body: data,
            ServerSideEncryption: "AES256"
        };

        s3.putObject(params, function(err, data) {
            console.log(err);
            res.end("Success");
        });
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

app.use(methodOverride());
app.use(bodyParser());
app.use(express.static(__dirname + "/public"));
app.use(errorHandler());

console.log("Simple static server listening at http://" + hostname + ":" + port);
app.listen(port);
