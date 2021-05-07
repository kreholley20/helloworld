CREATE TABLE IF NOT EXISTS Meals (
	mealname	TEXT NOT NULL,
	maincalorie	INTEGER NOT NULL CHECK("maincalorie" >= 0),
	fats	INTEGER CHECK("fats" >= 0),
	carbs	INTEGER CHECK("carbs" >= 0),
	proteins	INTEGER CHECK("proteins" >= 0),
	userid	TEXT,
	dateadded	TEXT NOT NULL,
	FOREIGN KEY("userid") REFERENCES "Users"("userID")
);

CREATE TABLE IF NOT EXISTS Composition (
	weight REAL NOT NULL,
	gender TEXT NOT NULL,
	height INTEGER NOT NULL,
	activity REAL NOT NULL,
	tdee INTEGER NOT NULL DEFAULT 2000,
	goal INTEGER NOT NULL DEFAULT 1,
	userid TEXT NOT NULL,
	age INTEGER NOT NULL,
	FOREIGN KEY("userid") REFERENCES "Users"("userID")
);


CREATE TABLE IF NOT EXISTS Comments(
	postid TEXT,
	userid TEXT,
	commentText TEXT NOT NULL,
	createdOn TEXT NOT NULL,
	username TEXT,
	commentID TEXT,
	PRIMARY KEY("commentID"),
	FOREIGN KEY("username") REFERENCES "Users"("username"),
	FOREIGN KEY("postid") REFERENCES "Posts"("postid") ON DELETE CASCADE,
	FOREIGN KEY("userid") REFERENCES "Users"("userID")
);

CREATE TABLE IF NOT EXISTS Posts(
	postid	TEXT NOT NULL,
	userid	TEXT,
	postText	TEXT NOT NULL,
	createdOn	TEXT NOT NULL,
	title	TEXT NOT NULL,
	PRIMARY KEY("postid"),
	FOREIGN KEY("userid") REFERENCES "Users"("userID")
);

CREATE TABLE IF NOT EXISTS Users (
	userID	TEXT,
	username	TEXT NOT NULL UNIQUE,
	email	TEXT NOT NULL UNIQUE,
	passwordHash	TEXT NOT NULL,
	role	INTEGER NOT NULL DEFAULT 0,
	PRIMARY KEY("userID")
);