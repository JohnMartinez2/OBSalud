const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const TaskSchema = new Schema({
    idDoc: {type: String,required: true},
    idPac: {type: String,required: true},
    type: {type: Number,required: true},
    cont:{type:String,default:""}
    });
module.exports = mongoose.model('historial', TaskSchema)