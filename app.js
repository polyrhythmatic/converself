//Created by David Cihelna and Seth Kranzler 
// at ITP, NYU 2015 Conversation and Computation
//to use this, run the node app.js server and go to the site - login - wait - chat
//Updates: add chronological feature


// Modules included with nodejs, just need to link them in
var util = require('util');
var fs = require('fs');

// Install markov module: npm install markov
// Markov module docs https://github.com/substack/node-markov
var markov = require('markov');


// Install express: $ npm install express
// Install socket.io: $ npm install socket.io
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

//create markov variable with length
var m = markov(3);

var ccontent;


//serve the html files
app.get('/', function(req, res){
  res.sendfile('index.html');
});
//serve the html files
app.get('/chat.html', function(req, res){
  res.sendfile('chat.html');
});
//serve the API Keys
app.get('/API_keys.js', function(req, res){
  res.sendfile('API_keys.js');
});
//serve the html files
app.get('/sketch.js', function(req, res){
  res.sendfile('sketch.js');
});

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });


//receive the corpus data from the Gmail API sketch 
socket.on('corpus data', function(msg){
  //create a new variable to be used as a seed below
  var corps = msg;

//the read text
// var s = fs.createReadStream(__dirname + '/corpus');
//seed the text to the markov chain
m.seed(corps, function () {
  console.log('seeded');
});
});



// socket.on('corpus data', function(socket){
//   console.log('corpus text received');
  // socket.on('corpus data', function(msg){
  //   ccontent = msg;
  
  // });

        // //write the corpus file based on the message input - needs to be longer than markov variabel!!
        // //replaces the file if already existing - http://nodejs.org/docs/latest/api/fs.html#fs_fs_writefile_filename_data_options_callback
        // fs.writeFile('corpus.txt', ccontent, function (err) {
        //   if (err) throw err;
        //   console.log('The corpus has been saved at this point in time.');
        // });


  socket.on('user message', function(msg){
    console.log('msg: '+msg);
    var res = m.respond(msg.toString(), 2).join(' ');
    socket.emit('bot message', res);              
  });
});


                    
// //serve the html file
// app.get('/corpus.txt', function(req, res){
//   res.sendfile('corpus.txt');
// });


http.listen(3002, function(){
  console.log('listening on *:3002');
});





