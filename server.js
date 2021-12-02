// Define app using express
var express = require("express")
var app = express()
// Require database SCRIPT file
var db = require("./db.js")
// Require md5 MODULE
var md5 = require("md5")
// Make Express use its own built-in body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set server port
var HTTP_PORT = 5000;
// Start server
app.listen(HTTP_PORT, () => {
    console.log("Server running on port %PORT%".replace("%PORT%",HTTP_PORT))
});
// READ (HTTP method GET) at root endpoint /app/
app.get("/app/", (req, res, next) => {
    res.json({"message":"Your API works! (200)"});
	res.status(200);
});

// Define other CRUD API endpoints using express.js and better-sqlite3

// CREATE a new user (HTTP method POST) at endpoint /app/new/
app.post("/app/new/", (req, res) => {	
	const stmt = db.prepare("INSERT INTO userinfo (user, pass) VALUES (?, ?)")
	const info = stmt.run(req.body.user, md5(req.body.passagain));
	res.status(201).json({"message":`${info.changes} record created: User ${req.body.user} has been created!`});
});

// READ a list of all users (HTTP method GET) at endpoint /app/users/
app.get("/app/users/all", (req, res) => {	
	const stmt = db.prepare("SELECT * FROM userinfo").all();
	res.status(200).json(stmt);
});

// READ a single user (HTTP method GET) at endpoint /app/user/:id
app.get("/app/user/:user/:pass/", (req, res) => {	
	const stmt = db.prepare("SELECT * FROM userinfo WHERE user = ? AND pass= ?").get(req.params.user, md5(req.params.pass));
	res.status(200).json({"message":`1 record has been found: User ${req.params.user} welcome back!`});
});

// Default response for any other request
app.use(function(req, res){
	res.json({"message":"Something Went Wrong!"});
    res.status(404);
});