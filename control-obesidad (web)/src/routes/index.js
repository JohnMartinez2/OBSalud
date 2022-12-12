const express = require('express')
const router = express.Router()
const User=require("../models/user")
const Historial=require("../models/historial")
console.clear()
function Token(size) {
    let t=""
    for (let i = 0; i < size; i++) {
        t+=Math.random().toString(36).substr(2)
    }
    return t
};
async function session(token){
	let user=await User.findOne({token},{pass:0})
	if(user){
		return  user
	}else{
		return {est:404}
	}
	
}
router.get('/', (req, res) => {
    res.render('index.html',{est:200,user:{}})
})
router.get('/login', (req, res) => {
    res.render('login.html')
})
router.get('/register', (req, res) => {
    res.render('register.html')
})
router.get('/home/:token', (req, res) => {
	const token=req.params.token
	session(token).then(async e=>{
		if(e?.rol==1){
			res.render("home.html",{est:200,user:e})
		}else{
			res.render("home.html",{est:e.est,user:{}})
		}
	})
})
router.get('/perfil/:token', (req, res) => {
	const token=req.params.token
	session(token).then(async e=>{
		if(e?.rol==1){
			res.render('perfil.html',{est:200,user:e})
		}else{
			res.render('perfil.html',{est:e.est,user:{}})
		}
	})
})
router.get('/calcImc/:token', (req, res) => {
	const token=req.params.token
	session(token).then(async e=>{
		if(e?.rol==1){
			res.render('calcImc.html',{est:200,user:e})
		}else{
			res.render('calcImc.html',{est:e.est,user:{}})
		}
	})
})
router.get('/consulta-especialista', (req, res) => {
    res.render('consEspec.html')
})
router.get('/consulta-nutricionista', (req, res) => {
    res.render('consNutric.html')
})
router.get('/homeDoc/:token', (req, res) => {
    const token=req.params.token
	session(token).then(async e=>{
		if(e?.rol!=1){
			res.render("homeDoc.html",{est:200,user:e})
		}else{
			res.render("homeDoc.html",{est:e.est,user:{}})
		}
	})
})
router.get('/getInfoPaciente/:token/:idp', (req, res) => {
	const token=req.params.token
	const idp=req.params.idp
	session(token).then(async e=>{
		if(e?.rol!=1){
			User.findOne({_id:idp},{pass:0,token:0},async  (err, u) => {
				if(err){
					res.json({ est: err.code, msg: "Algo salio mal,intentalo de nuevo mas tarde" });
				}else if (!u){
					res.json({ est: 404, msg: "No se encuentra ese usuario " });
				}else{
					res.json({est:200,info:u})
				}
			})
		}else{
			res.json({est:e.est,info:{}})
		}
	})
})
router.get('/vpacientes/:token', (req, res) => {
	const token=req.params.token
	session(token).then(async e=>{
		if(e?.rol){
			res.render("vpacientes.html",{est:200,user:e})
		}else{
			res.render("vpacientes.html",{est:e.est,user:{}})
		}
	})
})
router.get('/dpacientes/:token', (req, res) => {
	const token=req.params.token
	session(token).then(async e=>{
		if(e?.rol!=1){
			let pac=await User.find({rol:1},{pass:0,token:0})
			res.render("dpacientes.html",{est:200,user:e,p:pac})
		}else{
			res.render("dpacientes.html",{est:e.est,user:{},p:[]})
		}
	})
})
router.get('/pacientesChat/:token', (req, res) => {//muestra los pacientes de un doctor
	const token=req.params.token
	session(token).then(async e=>{
		if(e?.rol!=1){
			let setC=async ()=>{
				let temp=req.app.get('doctores')
				try{
					let cliente= {
						id:temp[e.id].id,
						name:temp[e.id].name,
						rol:temp[e.id].rol,
						pac:temp[e.id].pac
					}
					return cliente
				}catch(e){}
			}
			
			console.log(await setC())
			res.json({est:200,u:await setC()})
		}else{
			res.json({est:200,u:{}})
		}
	})
})
router.get('/docChat/:token', (req, res) => {///muestra todos los doctores 
	const token=req.params.token
	session(token).then(async e=>{
		if(e?.rol==1){
			let setC=async ()=>{
				let doctores={}
				let temp=req.app.get('doctores')
				for(let i in temp){
					doctores[i]= {
							id:temp[i].id,
							name:temp[i].name,
							rol:temp[i].rol,
							pac:temp[i].pac
						}
				}
				return doctores
			}
			res.json({est:200,u:await setC()})
		}else{
			res.json({est:200,u:{}})
		}
	})
})
router.post('/signup', (req, res) => {
    console.log(req.body)
    const {name,email,edad,identidad,celular,peso,altura,pass,rol}=req.body.inputs
	const userDB = new User();
	userDB.name = name;
	userDB.email = email;
	userDB.edad = edad;
	userDB.peso = peso;
	userDB.altura = altura;
	userDB.identidad = identidad;
	userDB.celular = celular;
	userDB.pass = pass;
	userDB.rol = rol;
	///////////////////////////
	userDB.save(err => {
		if (err){
			if(err.code==11000){
				res.json({ est: err.code,msg:"Ya existe un usuario con ese correo"});
			}else{
				res.json({ est: err.code,msg:"Algo salio  mal; verifique los campos"});
			}
		}
		else res.json({est:200})
	});
})
router.post('/login', (req, res) => {
    const { email,pass } = req.body;
    User.findOne({email},async  (err, u) => {
		if(err){
			res.json({ est: err.code, msg: "Algo salio mal,intentalo de nuevo mas tarde" });
		}else if (!u){
			res.json({ est: 404, msg: "No se encuentra ese usuario " });
		}else{
			if(pass===u.pass){
				let token=Token(10)
				u.update({token}, () => {
					u.token=token
					res.json({ est: 200,user:u});
				});   
			}  else{
				res.json({ est: 100,msg:"Contraseña Incorepta"});
			}
		}
	})
})
router.post('/updateData', (req, res) => {
    const {id, token, peso, altura, diagnostico,planNutricion} = req.body;
	session(token).then(async e=>{
		if(e?.rol!=1){
			if(id){
				const historial = new Historial();
				historial.idDoc = e._id;
				historial.idPac = id;
				if(diagnostico){
					historial.type = 1;
					historial.cont = diagnostico;
				}
				if(planNutricion){
					historial.type = 2;
					historial.cont = planNutricion;
				}
				///////////////////////////
				historial.save();
				User.findOneAndUpdate({_id:id},{diagnostico,planNutricion}, () => {
					res.json({ est: 200});
				});  
			}
			}else if(e?.rol==1){
				e.updateOne({_id:id},{peso,altura}, () => {
					res.json({ est: 200});
				});  
			}else{
				res.json({ est: 100,msg:"Contraseña Incorepta"});
			}
	})
})

module.exports = router;


