const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    phone: {type: String, required: true},
    aboutDoctor: {type: String, required: true},
    image: {type: String}
});

const Doctor = mongoose.model("doctors", doctorSchema);
module.exports = Doctor;