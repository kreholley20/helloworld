"use strict";

const express = require("express");
const Joi = require('joi');
const argon2 = require("argon2");
const app = express();
const path = require("path");
const redis = require("redis");
const session = require("express-session");
const ejs = require("ejs");
const calTdee = require ("./public/js/calculate");
const {schemas, VALIDATION_OPTIONS} = require("./validators/allValidators");

require("dotenv").config();


let RedisStore = require("connect-redis")(session);
let redisClient = redis.createClient();

app.set('view engine','ejs');

const sessionConfig = {
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    name: "session", // now it is just a generic name
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 8, // 8 hours
    }
}

redisClient.on("error", function (err) {
    console.log("error" + err);
});

const {mealModel} = require("./Models/mealModel");
const {tdeeModel} = require("./Models/tdeeModel");
const {userModel} = require("./Models/userModel");
const {postModel} = require("./Models/postModel");
const {commentModel} = require("./Models/commentModel");
const { response } = require("express");

app.use(express.static(path.join(__dirname, "public"), {
    extensions: ['html'],
}));
app.use(express.json());
app.use(express.urlencoded ({extended: true}));
app.use(session(sessionConfig));

const PORT = process.env.PORT;

app.use(express.static(path.join(__dirname, "public"),{
    extensions: ['html'],
}));

app.get("/", (req, res) =>{
    res.render("/viewpost");
});

//create a new account
app.post("/register", async (req, res) =>{
	console.log("POST /users");
    const {value, error} = schemas.postUsersSchema.validate(req.body, VALIDATION_OPTIONS);
    if (error){
        const errorMessages = error.details.map( error => error.message );
        return res.status(400).json(errorMessages);
    }
    else {
        try {
            const passwordHash = await argon2.hash(value.password, {hashLength: 5});
            const userAdded = userModel.createUser({
                username: value.username, 
                passwordHash,
                email: value.email
            });
        
            if (userAdded) {
                return res.redirect('/login.html'); // 200 OK
            } else { // something went wrong
                res.sendStatus(500); // 500 Internal Server Error
            }
        } catch (err) {
            console.error(err);
            return res.sendStatus(500);
        }
    }

});

//login into account
app.post("/login", async (req, res) => {
	// const { email, password } = req.body;
    const { value, error } = schemas.postLoginSchema.validate(req.body, VALIDATION_OPTIONS);
    if (error){
        const errorMessages = error.details.map( error => error.message );
        return res.status(400).json(errorMessages);
    }
    else {
        try {
            const email = value.email;
            const row = userModel.getPasswordHash(email); 
            const user = userModel.getUserDataEmail(email);
    
            if (!row) {
                return res.sendStatus(400);
            }
            const {passwordHash} = row;
            
            if ( await argon2.verify(passwordHash, value.password) ) {
                //res.redirect('index.html');
                req.session.regenerate(function(err) {
                    if (err){
                        console.log(err);
                        return res.sendStatus(500);
                    } else {
                        req.session.userID = user.userID;
                        req.session.email = user.email;
                        req.session.username = user.username;
                        req.session.isLoggedIn = 1;
                        return res.redirect('index');
                    }
                });
            } else {
                return res.sendStatus(400);
            }
        } catch (err) {
            console.error(err);
            return res.sendStatus(500);
        }
    }

});


app.post("/logout", async (req, res) => {
	req.session.destroy(function(err) {
        //if user isnt logged in 
        // if (req.session.isLoggedIn !== 'undefined'){
        //     if (req.session.isLoggedIn !== 1){
        //         return res.redirect("/login.html");
        //     }
        // }

        //if it fails to destroy
        if (err){
            return res.sendStatus(500);
        }
        //if destoryed
        else {
            return res.redirect("/login.html");
        }
	});
});


//adding a new meal for calories
app.post("/calories", (req, res) => {
    console.log("POST /calories");
    const {value, error} = schemas.postMealSchema.validate(req.body, VALIDATION_OPTIONS);
    if (error){
        const errorMessages = error.details.map( error => error.message );
        console.log(errorMessages);
        return res.status(400).json(errorMessages);
    } else {
        try {
            const add = mealModel.createMeal({
                mealname: value.mealname,
                maincalorie: value.maincalorie,
                fats: value.fats,
                carbs: value.carbs, 
                proteins: value.proteins,
                userid: req.session.userID
            });

            if (add === true){
                res.redirect('meallog');
            }
                
        } catch (err){
            console.error(err);
            return res.sendStatus(500);
        }
    }
   
});

app.get("/index", (req,res) =>{
    if(req.session.isLoggedIn !==  1){
        res.redirect('login');
    } else {
        res.render('index');
    } 
});

app.get('/meallog', (req, res) => {
    let todaydate = new Date();
    let month = todaydate.getUTCMonth() + 1;
    let day = todaydate.getUTCDate();
    let year = todaydate.getUTCFullYear();
    let todaysdate = `${year}/${month}/${day}`;

    const meal2 = mealModel.getTodaysMeals(req.session.userID, todaysdate);
    const tdeeW = tdeeModel.getTDEE(req.session.userID);
    const loggedIn = req.session.isLoggedIn;
    
    //if user is not logged in, send to the login page
    if (loggedIn !== 1){
        res.redirect('login.html');
    } else {
        res.render('meallog', {meal2, loggedIn, tdeeW, todaysdate});
    }
    //meal and tdee exists
    // if (meal2 && tdeeW){
    
    // }
});

app.post("/counter", (req, res) =>{
    //set default user for testing
    console.log("POST /intake");
    const {value, error} = schemas.postTDEESchema.validate(req.body, VALIDATION_OPTIONS);
    if (error){
        const errorMessages = error.details.map( error => error.message );
        return res.status(400).json(errorMessages);
    }

    let lean = req.body.select;
    let gender = req.body.genderselect;
    let activity = req.body.activityselect;
    let goal = req.body.goalselect;

    lean = parseFloat(lean);
    let weight = parseFloat(value.weight);
    activity = parseFloat(activity);
   
    try {
        let tdeeW = calTdee.calTdee(weight, gender, lean, activity, goal);

        //if user has account
        if (req.session.isLoggedIn){
            const user = req.session.userID;
            const tdeenow = tdeeModel.getTDEE(user);

            //if user is defaulted, create tdee
            if (typeof tdeenow === 'undefined'){
                const cal = tdeeModel.createTDEE({
                    weight, 
                    gender, 
                    lean: lean, 
                    activity, 
                    userid: user,
                    tdee: tdeeW,
                    goal: goal
                });
                if (cal){
                    res.redirect('tdee');
                } else {
                    res.sendStatus(400);
                }
            } else {
                const update = tdeeModel.updateTDEE( tdeeW, user );
                if (update){
                    res.redirect('tdee');

                } else {
                    res.sendStatus(400);
                }
            }
        }
        
    } catch (err) {
        console.log(error);
        res.sendStatus(500);
    }
    
});

app.get('/tdee', (req,res) => {
    const userid = req.session.userID;
    let t, gen;
    try{
        //if user is not logged in, send to the login page
        if (req.session.isLoggedIn !== 1){
            res.redirect('login.html');
        } else if ( req.session.isLoggedIn === 1 ){
            t = tdeeModel.getTDEE(userid);
            gen = tdeeModel.getGender(userid);

            res.render('tdee', {t, loggedIn: req.session.isLoggedIn, gen});
        }
    } catch (err) {
        console.error(err);
        return res.sendStatus(500);
    }
});

app.post('/newpost', (req,res) => {
    const {value, error} = schemas.postContentSchema.validate(req.body, VALIDATION_OPTIONS);
    if (error){
        const errorMessages = error.details.map( error => error.message );
        //change to where it logs to screen
        return res.status(400).json(errorMessages);
    }
    else{
        try{
            const posting = postModel.createPost({
                userid: req.session.userID,
                username: req.session.username,
                postText: value.postText
            });

            if (posting){
                res.redirect('viewpost');
            } else {
                res.sendStatus(400);
            }

        } catch (err) {
            console.error(err);
            res.sendStatus(500);
        }
        
    }

});

app.post("/posts/new", (req,res) => {
    const {value, error} = schemas.postPostSchema.validate(req.body, VALIDATION_OPTIONS);
    if (error){
        const errorMessages = error.details.map( error => error.message );
        return res.status(400).json(errorMessages);
    } else {
        try {
            const newPost = postModel.createPost({
                userid: req.session.userID,
                postText: value.postText,
                title: value.title
            });
    
            if (newPost === true){
                res.redirect('/viewpost');
            } else {
                return res.sendStatus(400);
            }
        } catch (err) {
            console.error(err);
            return res.sendStatus(500);
        }
    }
});

app.get("/newpost", (req, res) => {
    if (req.session.isLoggedIn){
        res.render('newpost');
    } else {
        return res.sendStatus(500);
    }
    
});

app.get("/viewpost", (req,res) => {
    try{
        const allPosts = postModel.getAllPostData();
        const loggedIn = req.session.isLoggedIn;
        res.render('viewpost', {allPosts, loggedIn});
    } catch (err) {
        console.error(err);
        return res.sendStatus(500);
    }
});

app.get("/posts/:postid", (req, res) =>{
    try{
        const getPost = postModel.getPostByID(req.params.postid);
        const getComments = commentModel.getCommentsByID(req.params.postid);
        const loggedIn = req.session.isLoggedIn;
        let username;
        if (getPost){
            username = userModel.getUserUsernameByID(getPost.userid);
        } else{
            username = "n/a";
        }
       
        const currUsername = req.session.username;
        if (getPost){
            res.render('showpost', {getPost, getComments, loggedIn, username, currUsername});
        } else {
            return res.sendStatus(500);
        }
      
    } catch (err) {
        console.error(err);
        return res.sendStatus(500);
    }
    
});

app.post("/posts/:postid/comments" , (req, res) => {
    // const {commentText} = req.body;
    const {value, error} = schemas.postCommentSchema.validate(req.body, VALIDATION_OPTIONS);
    if (error){
        const errorMessages = error.details.map( error => error.message );
        return res.status(400).json(errorMessages);
    } else {
        try {
            const newComment = commentModel.createComment({
                userid: req.session.userid,
                postid: req.params.postid,
                commentText: value.commentText,
                username: req.session.username
            });
    
            if (newComment){
                // return res.sendStatus(200);
                console.log("new comment");
                res.redirect("/posts/" + req.params.postid);
            } else {
                return res.sendStatus(400);
            }
        } catch (err) {
            console.error(err);
            return res.sendStatus(500);
        }
    }

});

app.post("/posts/:postid/delete", (req, res) => {
    const deletepost = postModel.deletePost(req.params.postid);
    if (deletepost){
        res.redirect('/viewpost');
    } else {
        res.sendStatus(400);
    }
});
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
