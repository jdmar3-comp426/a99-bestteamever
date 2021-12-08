// Define app using express
var express = require("express")
var app = express()
// Require database SCRIPT file
var db = require("./db.js")
// Require md5 MODULE
var md5 = require("md5")
var highestScore = 0
// Make Express use its own built-in body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set server port
var HTTP_PORT = 5000;
// Start server
app.listen(HTTP_PORT, () => {
    console.log("Server running on port %PORT%".replace("%PORT%",HTTP_PORT))
});

// Get all the registered users (HTTP method GET) at endpoint /app/users/all
app.get("/app/users/all", (req, res) => {	
	const stmt = db.prepare("SELECT * FROM userinfo").all();
	res.status(200).json(stmt);
});

// Define other CRUD API endpoints using express.js and better-sqlite3

// CREATE a new user (HTTP method POST) at endpoint /app/new/
app.post("/app/new/", (req, res) => {	
	const stmt = db.prepare("INSERT INTO userinfo (user, pass, highestscore) VALUES (?, ?, ?)")
	const info = stmt.run(req.body.user, md5(req.body.passagain), 0);
	res.status(201).redirect(301, "http://localhost:8080/content/successfully_SignUp.html");
});


// READ a single user (HTTP method GET) at endpoint /app/user/:user/:pass
app.get("/app/user/:user/:pass/", (req, res) => {	
	const stmt = db.prepare("SELECT highestscore FROM userinfo WHERE user = ? AND pass= ?").get(req.params.user, md5(req.params.pass));
	if(stmt==undefined){
		res.status(200).redirect(301, "http://localhost:8080/content/User_not_find.html")
	} else{
		console.log("The user's highest score is" + stmt);
		res.status(200).redirect(301, "http://localhost:8080/content/successfully_log_in.html");
	}
});
