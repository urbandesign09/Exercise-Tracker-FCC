//imports
const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

//basic configuration
app.use(cors())
app.use(express.static('public')) //bring in static assets in public folder
app.get('/', (req, res) => { //retrieves the html file
  res.sendFile(__dirname + '/views/index.html')
});

//parse body elements from forms
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

//connect to a mongoose database with POST command of node
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
},{collection: 'completed'});
mongoose.Promise = global.Promise;

//building a new schema
//what should be included in the Schema???
const Schema = mongoose.Schema;
const userSchema = new Schema({
  username: {type:String, required: true},
  count: {type: Number, default: 0},
  log: 
    [
        {description: String,
        duration: Number,
        date: String}
    ],
})
//building a new model from schema
const User = mongoose.model('User', userSchema);


//create a "find by id" function that also adds in new details under exercise

//app.post creating new user with associated object id (natural)
app.post('/api/exercise/new-user', (req, res)=>{
  const newUsername = req.body.username;
  const newUser = new User({username: newUsername});

  User.findOne({username:newUsername}, function(err, data){
    if (err) return (err);
    else if (data != null){
      res.json("Username already taken")
    }
    else {
      newUser.save(function(error,data){
      if (error) return (error);
      res.json({username: data.username, _id: data._id});
      })
    }
  })
})

//app.get request to get array of all users 
app.get('/api/exercise/users', (req, res)=> {
  User.find({}).sort('username').select('_id username').exec(function(err, data){
    if (err) return (err);
    res.json(data);
  })
})

//app.post create new exercise under same id as user 
app.post('/api/exercise/add', (req, res)=> {
  const userId = req.body.userId;
  const description = req.body.description;
  const duration = parseInt(req.body.duration);
  const date = () => {
    if (req.body.date===""){
      return new Date().toDateString();
    } else {
      return new Date(req.body.date).toDateString();
    }
  }
  //I'm constantly updating the single entry
  //I need to save an ADDITIONAL log 
  const exerciseToAdd = {description:description, date:date(), duration:duration};
  User.findByIdAndUpdate(userId, {$push:{log:exerciseToAdd}, $inc:{count: 1}},{new:true},function(err,data){
      if (err) return (err);
      res.json({_id:data._id, username:data.username, date:date(), duration:duration, description: description});
    })
})
  
//app.get that retrieves a user's exercise log based on userId
app.get('/api/exercise/log', (req, res)=> {
    const requestId = req.query.userId;
    const dateFrom = Date.parse(new Date(req.query.from));
    const dateTo = Date.parse(new Date(req.query.to));
    const limit = parseInt(req.query.limit);
    User.findById(requestId).exec(function(err,data){
      if (err) return (err);
      if (data === null){
        res.json({error:"no userId of this type"})
      }
      else {
        let log = data.log;
        if (dateFrom && dateTo){
        //this is the log array
        log = log.filter(item => (Date.parse(new Date(item.date))) > dateFrom && (Date.parse(new Date(item.date))) < dateTo);
        }
        if (limit){
        log = log.slice(0, limit);
        }
        const logCount = log.length;
        res.json({_id:data._id, username:data.username, count:logCount, log:log})
      }

    })
})

//build a systemt that retrieves and displays the retrieved database
//probably make a API call 


//node app listener for CRUD methods
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

