
const {Client, IntentsBitField, ActivityType, EmbedBuilder} = require('discord.js');
require('dotenv').config();
const apiKey=process.env.API_KEY;
const loginKey=process.env.LOGIN_KEY;
const apiKey2=process.env.API_KEY_2;
var movieList=[];
/*Function used to save changes to the movieList. The list is stored in a json.*/
function saveList(saveName){
    if(movieList.length!=0){
  var movieListSave=JSON.stringify(movieList);}
  else {var movieListSave="[]"}

  var fs = require('fs');
  fs.writeFile(saveName,movieListSave,function(error){if (error){console.log(error);}});

  
}

function loadList(saveName){
    var fs= require('fs');
    fs.readFile(saveName, 'utf8',(error,data)=>{
        if(error){console.error(error);
        return;}
        movieList=JSON.parse(data);
    });
    
    
}


async function getMovieInfo(msg,movieName){
    movieName=movieName.replace(' ','+');
   
    let url="http://www.omdbapi.com/?t="+movieName+"&type=movie&plot=short&apikey="+apiKey;
    
    const response = await fetch(url);
    if (response.status==404){msg.reply("This movie does not exist."); return; }
    movieRequestData= await response.json();
    let url2="https://api.themoviedb.org/3/find/"+movieRequestData.imdbID+"?api_key="+apiKey2+"&external_source=imdb_id";
    const response2= await fetch(url2);
    if (response2.status==404){msg.reply("This movie does not exist."); return;}
    console.log(url2);
    console.log(response2);
    posterRequestData= await response2.json();
    console.log(movieRequestData);
    let poster;
    if(posterRequestData.movie_results[0]==null){
        poster="";
    }else{poster=posterRequestData.movie_results[0].poster_path;}
    if(movieRequestData.Response=="True"){console.log('http://image.tmdb.org/t/p/original'+poster);const infoMessageEmbed = new EmbedBuilder()
        .setTitle(movieRequestData.Title+' ('+movieRequestData.Year+')')
    .setDescription(movieRequestData.Plot)
    .setURL('https://www.imdb.com/title/'+movieRequestData.imdbID)
    .setImage('http://image.tmdb.org/t/p/original'+poster)
    ;
    msg.reply({embeds:[infoMessageEmbed]});
    }else{msg.reply("This movie does not exist.")};
}

async function thisMovieExists(movieName){
    movieName=movieName.replace(' ','+');
   
    let url="http://www.omdbapi.com/?t="+movieName+"&type=movie&apikey="+apiKey;
    const response = await fetch(url);
    if(response.status==404){movieRequestData=null;}else
    {movieRequestData= await response.json();}
    
    if(movieRequestData!=null&&movieRequestData.Response=="True"){console.log("the movie is real");return movieRequestData.Title;}else{console.log("not a real movie");return null;};
    
}


const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ]
});

client.on('ready', (msg)=>{loadList("saves/save.json"); client.user.setActivity({
    type: ActivityType.Custom,
    name: '!ml help'
});});


function movieInList(movieTitle){
    console.log("MOVIE TEST"+movieTitle);
    if(movieTitle!=null){
for(let i=0;i<movieList.length;i++){
    if(movieList[i].title==movieTitle){return i;}
}return -1;
}else return -1;}
function addMovie(movieTitle,id,msg){

const movie={
    title: movieTitle,
    votes:0,
    voters:[],
    addedBy:id

    
}

console.log("msgauthoid:"+movie.addedBy);
movieList.push(movie);
msg.reply("Added "+movieTitle +".");

}

function sortList(){
movieList.sort((a,b)=>b.votes-a.votes)
}

function voteForMovie(msg, movieRank){
    console.log(movieRank);
    if(movieRank<1||movieRank>movieList.length){msg.reply("Invalid Rank.");return;}
    let i=movieRank-1;
    console.log(i);
    if(!(movieList[i].voters.includes(msg.author.id))){movieList[i].votes++; movieList[i].voters.push(msg.author.id); msg.reply("You voted for "+movieList[i].title+". Hooray for democracy!"); sortList(); saveList("saves/save.json");}else{msg.reply("You've already voted for this movie.");}
}

function unvoteForMovie(msg,movieRank){
    if(movieRank<1||movieRank>movieList.length){msg.reply("Invalid Rank.");return;}
    let i=movieRank-1;
    if(movieList[i].voters.includes(msg.author.id)){movieList[i].votes--; msg.reply("You changed your mind about "+movieList[i].title+"."); for(let j=0;j<movieList[i].voters.length;j++){if(movieList[i].voters[j]==msg.author.id){movieList[i].voters.splice(j,1);}} sortList(); saveList("saves/save.json");}else{msg.reply("You haven't voted for this movie.")}
}

function whoVoted(msg,movieName){
    thisMovieExists(movieName).then((response)=>{if(response==null){msg.reply("This movie does not exist.");return;}else{let index=movieInList(response); if(index!=-1){let string="Voters:";for(let i=0;i<movieList[index].voters.length;i++){string=string+"<@"+movieList[index].voters[i]+"> "}msg.reply({content:string, flags: [4096]})}else{msg.reply("Movie is not on the list.")}}});

}

function removeMovie(msg,movieName){let counter=0;for(let i=0;i<movieList.length;i++){if(movieList[i].addedBy==msg.author.id&&movieList[i].title.toUpperCase()===movieName.toUpperCase()){movieList.splice(i,1);counter++;break;}}if(counter==1){msg.reply("Movie removed." );}else{msg.reply("Movie not found. (Wrong name or no permission.)");}saveList("saves/save.json");}

client.on('messageCreate',(msg)=>{
   if(msg.content.startsWith('!ml',0)) {
    console.log(msg.content); let userCommand = msg.content.split(' ');
    console.log(userCommand); 
    let movieEntry= msg.content.split("!ml "+userCommand[1]+" " )[1];
    console.log("MOVIE ENTRY IS "+movieEntry);
if(userCommand[1]=="add"&&userCommand.length>2){
    thisMovieExists(movieEntry).then((result)=>{let movieTitle=result;if(movieTitle!=null){
        if(movieInList(movieTitle)==-1){console.log("1 "+msg);var id=msg.author.id;console.log("2 "+msg);
        addMovie(movieTitle,id,msg);console.log("3 "+msg);console.log("4 "+msg);saveList("saves/save.json");}else{msg.reply("This movie is already on the list.")}
    }else{msg.reply("This movie does not exist.");}});
    
 


}else if(userCommand[1]=="page"&&userCommand.length>2&&!isNaN(userCommand[2])){let movieListString=""; let pageNumber=parseInt(userCommand[2]); let pageLast=parseInt((movieList.length/10)+1);
    if(pageNumber>0&&pageNumber<=pageLast){for(let i=0+(10*(pageNumber-1));i<movieList.length;i++){if(i>=(10*(pageNumber))){break;}movieListString=movieListString+(i+1)+". "+movieList[i].title.substring(0,59)+" (votes: "+movieList[i].votes+")\n";}
    msg.reply("\`\`\`"+movieListString+"\n"+"This is page "+pageNumber+" out of "+pageLast+"\`\`\`");
}else{msg.reply("Invalid page number. Available pages: "+pageLast);}}
else if(userCommand[1]=="page"&&userCommand.length==2){let movieListString=""; let pageNumber=1; let pageLast=parseInt((movieList.length/10)+1);
if(pageNumber>0&&pageNumber<=pageLast){for(let i=0+(10*(pageNumber-1));i<movieList.length;i++){if(i>=(10*(pageNumber))){break;}movieListString=movieListString+(i+1)+". "+movieList[i].title.substring(0,59)+" (votes: "+movieList[i].votes+")\n";}
msg.reply("\`\`\`"+movieListString+"\n"+"This is page "+pageNumber+" out of "+pageLast+"\`\`\`");}}
else if(userCommand[1]=="remove"&&userCommand.length>2){removeMovie(msg,movieEntry);}
else if(userCommand[1]=="vote"&&userCommand.length>2){
if(!isNaN(movieEntry)){
voteForMovie(msg,userCommand[2]);}else{var votetemp=-1; thisMovieExists(movieEntry).then((result)=>{votetemp = movieInList(result);if(votetemp!=-1){voteForMovie(msg,votetemp+1);}else{msg.reply("Movie not found.");}}); console.log("debug "+votetemp); }
}else if(userCommand[1]=="help"){msg.reply("**!ml add [Movie Name]**\n*Adds a movie to the list.*\n\n**!ml page [Page Number]**\n*Displays a page of the movie list.*\n\n**!ml remove [Full Movie Name]**\n*Removes a movie from the list. You can only remove movies you've added.*\n\n**!ml vote [Movie Rank Number/Movie Name]**\n*Vote for a movie.*\n\n**!ml unvote [Movie Rank Number/Movie Name]**\n*Revoke a vote for a movie.*");}
else if(userCommand[1]=="unvote"&&userCommand.length>2){
    if(!isNaN(movieEntry)){
    unvoteForMovie(msg,userCommand[2]);}else{var unvotetemp=-1; thisMovieExists(movieEntry).then((result)=>{unvotetemp = movieInList(result);if(unvotetemp!=-1){unvoteForMovie(msg,unvotetemp+1);}else{msg.reply("Movie not found.");}}); console.log("debug "+unvotetemp); }}
else if(userCommand[1]=="info"&&userCommand.length>2){getMovieInfo(msg,movieEntry);}
else if(userCommand[1]=="whovoted"&&userCommand.length>2){whoVoted(msg,movieEntry);}
else{msg.reply("Invalid command. For the list of commands do: !ml help"); }
}
    
})
client.login(loginKey);
