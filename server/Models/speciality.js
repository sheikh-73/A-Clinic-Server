const mongoose = require("mongoose");

const specialitySchema = new mongoose.Schema({
    doctorId: {type: mongoose.Schema.Types.ObjectId, ref: "doctors", required: true},
    department: {type: String, required: true},
    charge: {type: Number, required: true}
});

const Speciality = mongoose.model("specialities", specialitySchema);
module.exports = Speciality;