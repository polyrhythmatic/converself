 var OAUTHURL = 'https://accounts.google.com/o/oauth2/auth?';
 var VALIDURL = 'https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=';
 var SCOPE = 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email';
 //CLIENTID is saved in API_Keys.js file 
 //
 // this is the URL of the webpage with the chat 
 // redirect URL needs to be correctly entered in the google developer's console
 // https://console.developers.google.com/project
 var REDIRECT = 'http://localhost:3002/index.html'; 
 var LOGOUT = 'http://accounts.google.com/Logout';
 var TYPE = 'token';
 var _url = OAUTHURL + 'scope=' + SCOPE + '&client_id=' + CLIENTID + '&redirect_uri=' + REDIRECT + '&response_type=' + TYPE;
 var acToken;
 var tokenType;
 var expiresIn;
 var user;
 var loggedIn = false;
 var thistext;
 var corpus;

 var messageNums = [];

 function login() {
     var win = window.open(_url, "windowname1", 'width=800, height=600');

     var pollTimer = window.setInterval(function() {
         try {
             console.log(win.document.URL);
             if (win.document.URL.indexOf(REDIRECT) != -1) {
                 window.clearInterval(pollTimer);
                 var url = win.document.URL;
                 acToken = gup(url, 'access_token');
                 tokenType = gup(url, 'token_type');
                 expiresIn = gup(url, 'expires_in');
                 win.close();

                 validateToken(acToken);
             }
         } catch (e) {}
     }, 500);
 }

 function validateToken(token) {
     $.ajax({
         url: VALIDURL + token,
         data: null,
         success: function(responseText) {
             getUserInfo();
             loggedIn = true;
             $('#loginText').hide();
             $('#logoutText').show();
         },
         dataType: "jsonp"
     });
 }

 function getUserInfo() {
     $.ajax({
         url: 'https://www.googleapis.com/oauth2/v1/userinfo?access_token=' + acToken,
         data: null,
         success: function(resp) {
             user = resp;
             //console.log(user);
             $('#uName').text('Welcome ' + user.name);
             $('#imgHolder').attr('src', user.picture);
             getEmails();
         },
         dataType: "jsonp"
     });
 }

 function getEmails() {
     $.ajax({
         url: 'https://www.googleapis.com/gmail/v1/users/' + user.id + '/messages?q="in:sent"&access_token=' + acToken,
         data: null,
         success: function(messageList) {
             for (var i = 0; i < 100; i++) {
                 //console.log(messageList.messages.i.id);
                 messageNums.push(messageList.messages[i].id);
             }
             console.log(messageNums);
             getMoreEmails(messageList.nextPageToken);
         },
         dataType: "jsonp"
     });
 }

 function getMoreEmails(pgToken) {
     $.ajax({
         url: 'https://www.googleapis.com/gmail/v1/users/' + user.id + '/messages?q="in:sent"&pageToken=' + pgToken + '&access_token=' + acToken,
         data: null,
         success: function(messageList) {
             for (var i = 0; i < messageList.messages.length; i++) {
                 //console.log(messageList.messages.i.id);
                 messageNums.push(messageList.messages[i].id);
             }
             //messageList.nextPageToken;
             //console.log(messageNums);
             if (messageList.nextPageToken != null) {
                 getMoreEmails(messageList.nextPageToken);
             }
             if (messageList.nextPageToken == null) {
                 getEmailText();
             }
         },
         dataType: "jsonp"
     });
 }

 function getEmailText() {
     for (var i = 0; i < 200; i++) {
         $.ajax({
             url: 'https://www.googleapis.com/gmail/v1/users/' + user.id + '/messages/' + messageNums[i] + '?format=full&access_token=' + acToken,
             data: null,
             success: function(resp) {
                 //debugger;
                 //console.log(atob(decodeUrl(resp.payload.parts[0].body.data)));
                 if (resp != null) {
                     if (resp.payload.parts[1].body.data != null) {
                         var emailBody = atob(decodeUrl(resp.payload.parts[1].body.data));
                         processEmailText(emailBody);
                     }
                 }
             },
             dataType: "jsonp"
         });
    //add if (i = 100){ ready(); } with a new function for loading sign


     }

     

 }

 function processEmailText(text) {
     var regex = /<div class="gmail_extra">|<div class="gmail_signature">|<div class="gmail_quote">|<span>/;
     var results = regex.exec(text);

     if (results != null) {
         //console.log(results.index);
         var trimmedEmail = text.slice(0, results.index);

        //gets rid of characters that are unwanted
         var trimmedEmail = trimmedEmail.replace(/Â|Â|Â/g, "")
         var trimmedEmail = trimmedEmail.replace(/&#39;/g, "'")


         // console.log($(trimmedEmail).text());
         thistext += $(trimmedEmail).text().trim();
         console.log(thistext);
        
        //this could be logged when we have analyzed all - make a "loading... 3 2 1 Go Chat " thing on website using innerHTML
        console.log("we have reached i 100");


 corpus = thistext;

//emit the temporary corpus to index.html for use in the chat
 socket.emit('corpus data', corpus);

 
  // makeTextFile = function (text) {
  //   var data = new Blob(thistext, {type: 'text/plain'});

  //   // If we are replacing a previously generated file we need to
  //   // manually revoke the object URL to avoid memory leaks.
  //   if (textFile !== null) {
  //     window.URL.revokeObjectURL(corpus);
  //   }

  //   corpus = window.URL.createObjectURL(data);r


  //   return corpus;
  //   console.log(corpus);
  // };



     }

 }





 //credits: http://www.netlobo.com/url_query_string_javascript.html
 function gup(url, name) {
     name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
     var regexS = "[\\#&]" + name + "=([^&#]*)";
     var regex = new RegExp(regexS);
     var results = regex.exec(url);
     if (results == null)
         return "";
     else
         return results[1];
 }

 function startLogoutPolling() {
     $('#loginText').show();
     $('#logoutText').hide();
     loggedIn = false;
     $('#uName').text('Welcome ');
     $('#imgHolder').attr('src', 'none.jpg');
 }

 function decodeUrl(str) {
     str = (str + '===').slice(0, str.length + (str.length % 4));
     return str.replace(/-/g, '+').replace(/_/g, '/');
 }