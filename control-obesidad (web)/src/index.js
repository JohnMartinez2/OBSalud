const express = require('express');
const app = express()
const path = require('path')
const mongoose = require('mongoose');
const morgan = require('morgan')
const http = require("http").Server(app);
const io = require("socket.io")(http);
//DB
mongoose.connect('mongodb+srv://obsalud:john123@cluster0.8mmiymv.mongodb.net/?retryWrites=true&w=majority')
    .then(db=>{console.log('db is connected')})
    .catch(err => console.log(err));

// settings 
app.set('port',process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views')) 
app.engine('html', require('ejs').renderFile)
app.set('view engine', 'ejs')
app.set("json spaces",2)
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}))
// middlewares

// routes
app.use(require('./routes/'))

// static files
app.use(express.static(path.join(__dirname, 'public')))


// listening the server
http.listen(app.get('port'), () => {
    console.log('Server on port', app.get('port'))
})
///socket
app.set('doctores',{});
io.on("connect",(usuario)=>{
    usuario.on("newDocOnline",(e)=>{
        try{
            let doctores=app.get('doctores')
            let doc=e.doc
            if(!doctores[doc.id]){
                doc.pac={}
                doctores[doc.id]=doc
            }
            app.set('doctores',doctores);
            for(let d in doctores)console.log("["+d+"]",doctores[d].name)
            io.sockets.emit("updateuser")
        }catch(e){}
    })
    usuario.on("connectDoc",(e)=>{
        try{
            let doctores=app.get('doctores')
            let sala=doctores[e.id].pac[e.pac.id].sala
            console.log(e.name+" doc  in "+sala)
		    usuario.join(sala)
            io.sockets.in(sala).emit("msg-server",doctores[e.id].pac[e.pac.id].chat) 
            io.sockets.emit("updateuser")
        }catch(e){}
    })
    usuario.on("connectPac",(e)=>{
        try{
            let doctores=app.get('doctores')
            if(!doctores[e.id].pac[e.pac.id]){
                doctores[e.id].pac[e.pac.id]={...e.pac,chat:[],sala:Math.random().toString(36).substr(2)}
            }
            let sala=doctores[e.id].pac[e.pac.id].sala
            console.log(e.pac.name+" in "+sala)
            app.set('doctores',doctores);
		    usuario.join(sala)
            io.sockets.in(sala).emit("msg-server",doctores[e.id].pac[e.pac.id].chat) 
            io.sockets.emit("updateuser")
        }catch(e){}
    })
    usuario.on("msg",(e)=>{
        
            try{
                let doctores=app.get('doctores')
                let sala=doctores[e.id].pac[e.pac.id].sala
                doctores[e.id].pac[e.pac.id].chat.push(e.msg)
                app.set('doctores',doctores);
                io.sockets.in(sala).emit("msg-server",doctores[e.id].pac[e.pac.id].chat)  
            }catch(e){}

        
    })
    usuario.on("getMsg",(e)=>{
        try{
            let doctores=app.get('doctores')
            let sala=doctores[e.id].pac[e.pac.id].sala
            io.sockets.in(sala).emit("msg-server",doctores[e.id].pac[e.pac.id].chat)
        }catch(e){}
    })
})
