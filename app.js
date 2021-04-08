const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const multer = require('multer');
const upload = multer({dest: __dirname + '/public/uploads/images'});
const session = require("express-session"); 
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");


const homeStartingContent = "My name is Tejash Bansal, and I am going to show you how to start blogging. I have been building blogs and websites when i am 18 years old. In that time I have launched several of my own blogs, and helped hundreds of others do the same.I know that starting a blog can seem overwhelming and intimidating. This free guide is all about blogging for beginners, and will teach you how to be a blogger with just the most basic computer skills. So whether you’re 8 or 88, you can create your own blog in less than 20 minutes.I am not ashamed to admit that when I was first learning how to build a blog I made a ton of mistakes. You can benefit from more than a decade of my experience so that you don’t repeat these same mistakes when you make your own blog. I created this free guide so that anyone can learn how to blog quickly and easily. ";
const aboutContent = "We love our work and the independence associated with it, which gives us the freedom to act in following with what we believe.We practice ethical design; it is essential to us. Our obligation as the ones who build products is using best practices for ethical design. Why? The answer is simple. We want to live in a more ethical future, where transparency and honesty come first. We believe that everything we do shapes and changes life for better or for worse.";


const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


app.use(session({
	secret: "this is most.",
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/blogers",{useNewUrlParser: true });
mongoose.set("useCreateIndex", true);


const blogSchema = new mongoose.Schema({
	title: String,
	content: String,
	image: String
	
});
const Blog = mongoose.model("Blog",blogSchema);


const userSchema = new mongoose.Schema({
	Username: String,
	Password: String,
	Email: String
});
userSchema.plugin(passportLocalMongoose);


const User = mongoose.model("User",userSchema);
passport.use(User.createStrategy())
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: 'Author@gxample.com',
		pass: '************',
	}
});


app.get("/",function(req,res){
	res.render("login");
  })
  

  app.get("/register",function(req,res){
	res.render("register");
  })


app.get("/home",function(req,res){
	if(req.isAuthenticated()){
		res.render("home",{homeStartingContent: homeStartingContent});
	}else{
		res.redirect("/");
	}	
})


app.get("/about",function(req,res){
	if(req.isAuthenticated()){
		res.render("about",{aboutContent:aboutContent});
	}else{
		res.redirect("/");
	}
})

app.get("/contact",function(req,res){
	if(req.isAuthenticated()){
		res.render("contact",{contactContent:aboutContent});
	}else{
		res.redirect("/");
	}
  
})

app.get("/blog",function(req,res){
	if(req.isAuthenticated()){
		Blog.find({},function(err,result){
			if(err){
				console.log(err);
	
			}
			else{
				res.render("blog",{posts: result});
			}
		});
		
	}else{
		res.redirect("/");
	}
	
  });
  



app.get("/compose",function(req,res){ 
	if(req.isAuthenticated()){
		res.render("compose");
	}else{
		res.redirect("/");
	}
  
})
app.get("/logout",function(req,res){
	req.logOut();
	res.redirect("/");
})


app.get("/posts/:postId",function(req,res){
	if(req.isAuthenticated()){
		const requestedPostId = req.params.postId;
	Blog.findOne({_id: requestedPostId},function(err,result){
		if(err){
			console.log(err);
		}
		else{
			res.render("post",{
				postName: result.title,
				postContent: result.content,
				postImage: result.image
			});
		}
	});
	
	}else{
		res.redirect("/login");
	}
  
	
});
app.post("/contact",function(req,res){
var Name = 	req.body.name;
var Phone = req.body.phone;
var Email =	req.body.email;
var Text =	req.body.text;

var mailOptions = {
	from: 'Author@gxample.com',
	to: Email,
	subject: 'Need Help',
	text: Name+"\n"+Phone+"\n"+Email+"\n"+Text

};

transporter.sendMail(mailOptions, function(error,info){
	if(error){
		console.log(error);
	}
	else{
		console.log("Email sent: "+info.response);
		res.redirect("/contact");
	}
});

})
app.post("/compose",upload.single('img') ,function(req,res){
	const blog1 = new Blog({
		title: req.body.postTitle,
		content:req.body.postBody,
		image:req.file.filename
	});
	
	blog1.save();
	res.redirect("/blog");
})

app.post("/",function(req,res){
	const user = new User({
		username: req.body.username,
		password:   req.body.password
	});
		req.login(user,function(err){
			if(err){
				res.redirect("/");
				
			}else{
				passport.authenticate("local")(req,res,function(){
					res.redirect("/home");
				});
			}
		});
});

app.post("/register",function(req,res){
	User.register({username: req.body.username,Email: req.body.email},req.body.password,function(err,user){
		if(err){
			console.log(err);
			res.redirect("/register");
		}else{
			passport.authenticate("local")(req,res,function(){
				res.redirect("/home");
			})
		}
	})
	var email = req.body.email;
var mailOptions = {
	from: 'Author@gxample.com',
	to: email,
	subject: 'Thanks for joining us',
	text: "hi, we're glad you're here. We'll keep you in the loop with out latest news and special offers."

};

transporter.sendMail(mailOptions, function(error,info){
	if(error){
		console.log(error);
	}
	else{
		console.log("Email sent: "+info.response);	
	}
});

})

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
