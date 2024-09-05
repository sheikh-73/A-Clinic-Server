const mongoose = require("mongoose");

const appointmentScheduleSchema = new mongoose.Schema({
    doctorId: {type: mongoose.Schema.Types.ObjectId, ref: "specialities", required: true},
    day: {type: String, required: true},
    time: [
        {type: String, required: true}
    ]
});

const AppointmentSchedule = mongoose.model("appointment_schedules", appointmentScheduleSchema);
module.exports = AppointmentSchedule;