const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
    doctorId: {type: mongoose.Schema.Types.ObjectId, ref: "doctors", required: true},
    patientId: {type: mongoose.Schema.Types.ObjectId, ref: "patients", required: true},
    appointmentSchedule: {type: String, required: true},
    status: {type: String, enum: ["pending", "booked", "cancel", "complete"], default: "pending"},
    paymentStatus: {type: String, enum: ["pending", "complete"], default: "pending"}
});

const Appointment = mongoose.model("appointments", appointmentSchema);
module.exports = Appointment;