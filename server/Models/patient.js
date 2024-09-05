const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    phone: {type: String, required: true},
    address: {type: String},
    gender: {type: String, enum:["male", "female", "other"]},
    age: {type: Number},
    problem: {type: String, required: true}
});

const Patient = mongoose.model("patients", patientSchema);
module.exports = Patient;