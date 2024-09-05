const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const multer = require("multer");
const nodemailer = require("nodemailer");
const moment = require("moment");
const twilio = require("twilio");
const Doctor = require("./Models/doctor");
const Speciality = require("./Models/speciality");
const AppointmentSchedule = require("./Models/appointmentSchedule");
const Patient = require("./Models/patient");
const Appointment = require("./Models/appointment");

require("dotenv").config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.static("/Uploads"));

mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}/${process.env.DB_NAME}`)
.then(() => { console.log("database connect...")})
.catch((error) => { console.log("Database Error: "+error)});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "Uploads");
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname+"_"+Date.now()+path.extname(file.originalname));
    }
});

const upload = multer({storage: storage});

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASS
    }
});

const client = new twilio(process.env.T_ACCOUNT_SID, process.env.T_AUTH_TOKEN);

// API for add new Doctor:
app.post("/add-doctor", upload.single("image"), async(req, res) => {
    try
    {
        const newDoctor = new Doctor({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            aboutDoctor: req.body.about,
            image: req.file.filename
        });
    
        await newDoctor.save();
        res.status(201).json({message: "new doctor appoint successful."});
    }
    catch(error)
    {
        console.log("Error: "+error);
        res.status(404).json(error);
    }
});

// API for doctor speciality:
app.post("/add-doctor-speciality/:id", async(req, res) => {
    try
    {
        const newSpeciality = new Speciality({
            doctorId: req.params.id,
            department: req.body.department,
            charge: req.body.charge
        });

        await newSpeciality.save();
        res.status(201).json({message: "speciality added."});
    }
    catch(error)
    {
        console.log("Error: "+error);
        res.status(404).json(error);
    }
});

// API for add doctor appointment schedule:
app.post("/add-doctor-appoinement-schedule/:id", async(req, res) => {
    try
    {
        const newDoctorAppointmentSchedule = new AppointmentSchedule({
            doctorId: req.params.id,
            day: req.body.day,
            time: req.body.time
        });

        await newDoctorAppointmentSchedule.save();
        res.status(201).json({message: "add successful."});
    }
    catch(error)
    {
        console.log("Error: "+error);
        res.status(404).json(error);
    }
});

// API for add patient info:
app.post("/add-patient-info", async(req, res) => {
    try
    {
        const newPatient = new Patient({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            address: req.body.address,
            gender: req.body.gender,
            age: req.body.age,
            problem: req.body.problem
        });

        await newPatient.save();
        res.status(201).json({data: newPatient, message: `Hello ${newPatient.name}.`});
    }
    catch(error)
    {
        console.log("Error: "+error);
        res.status(404).json(error);
    }
});

// API for doctor appointment:
app.post("/appointment/:patientId", async(req, res) => {
    try
    {
        const dt = `Date: ${req.body.date}, Time: ${req.body.time}`;
        const newAppointment = new Appointment({
            doctorId: req.body.doctorId,
            patientId: req.params.patientId,
            appointmentSchedule: dt
        });

        await newAppointment.save();
        res.status(201).json({data: newAppointment, message: "waiting for verification. You will get message and email for verification."});
    }
    catch(error)
    {
        console.log("Error: "+error);
        res.status(404).json(error);
    }
});

// API for get doctor appointment time:
app.get("/appointment-time/:doctorId", async(req, res) => {
    try
    {
        const appointmentSchedules = await AppointmentSchedule.find({doctorId: req.params.doctorId});
        const day = moment(req.query.date).format("dddd");
        //console.log(day);
        let flag = false;
        let dt;
        appointmentSchedules.map((schedule) => {
            if(schedule.day === day)
            {
                flag = true;
                dt = schedule.time
            }
        });
        if(flag==false)
        {
            return res.status(400).json({message: "no schedule in this date."});
        }
        res.status(201).json({data: dt});
    }
    catch(error)
    {
        console.log("Error: "+error);
        res.status(404).json(error);
    }
});

// API for get Speciality:
app.get("/speciality", async(req, res) => {
    try
    {
        const doctorSpeciality = await Speciality.find({doctorId: req.query.id}).select("department charge");
        if(doctorSpeciality.length == 0) 
        {
            return res.status(400).json({message: "No result found."});
        }
        res.status(201).json({data: doctorSpeciality, message: "found"});
    }
    catch(error)
    {
        console.log("Error: "+error);
        res.status(404).json(error);
    }
});

// API for get all doctor's speciality departments:
app.get("/all-departments", async(req, res) => {
    const departments = await Speciality.distinct("department");
    if(departments.length == 0)
    {
        return res.status(400).json({message: "No result found."});
    }
    res.status(201).json({data: departments, message: "found"});
});

// API for get Doctor info:
app.get("/doctor-info", async(req, res) => {
    try
    {
        const doctor = await Doctor.findById(req.query.id);
        if(!doctor)
        {
            return res.status(404).json({message: "doctor not found."});
        }
        res.status(201).json({data: doctor, message: "found"});
    }
    catch(error)
    {
        console.log("Error: "+error);
        res.status(404).json(error);
    }
});

// API for get Patient info:
app.get("/patient-info", async(req, res) => {
    try
    {
        const patient = await Patient.findById(req.query.id);
        if(!patient)
        {
            return res.status(404).json({message: "patient not found."});
        }
        res.status(201).json({data: patient, message: "found"});
    }
    catch(error)
    {
        console.log("Error: "+error);
        res.status(404).json(error);
    }
});

// API for admin login:
app.get("/admin-login", async(req, res) => {
    if(req.query.pass == process.env.ADMIN_LOGIN_KEY)
    {
        return res.status(201).json({message: "Login successful."});
    }
    res.status(404).json({message: "Login failed."});
});

// API for count total number of doctor's:
app.get("/total-doctors", async(req, res) => {
    const countDoctors = await Doctor.find();
    res.status(201).json({data: countDoctors.length});
});

// API for count total number of patient's:
app.get("/total-patients", async(req, res) => {
    const countPatient = await Patient.find();
    res.status(201).json({data: countPatient.length});
});

// API for get all appointments:
app.get("/all-appointments", async(req, res) => {
    const appointments = await Appointment.find();
    if(appointments.length == 0)
    {
        return res.status(404).json({message: "No appointments"});
    }
    res.status(201).json({data: appointments});
});

// API for get all pending Appointment:
app.get("/pending-appointments", async(req, res) => {
    try
    {
        const pendingAppointments = await Appointment.find({status: "pending"});
        if(pendingAppointments.length == 0)
        {
            return res.status(201).json({message: "No pending appointments yet"});
        }
        res.status(201).json({data: pendingAppointments});
    }
    catch(error)
    {
        console.log("Error: "+error);
        res.status(404).json(error);
    }
});

// API for get all booked Appointments:
app.get("/booked-appointments", async(req, res) => {
    try
    {
        const bookedAppointments = await Appointment.find({status: "booked"});
        if(bookedAppointments.length == 0)
        {
            return res.status(201).json({message: "No booked appointments yet"});
        }
        res.status(201).json({data: bookedAppointments});
    }
    catch(error)
    {
        console.log("Error: "+error);
        res.status(404).json(error);
    }
});

// API for get all cancel Appointments:
app.get("/cancel-appointments", async(req, res) => {
    try
    {
        const cancelAppointments = await Appointment.find({status: "cancel"});
        if(cancelAppointments.length == 0)
        {
            return res.status(201).json({message: "No cancel appointments yet"});
        }
        res.status(201).json({data: cancelAppointments});
    }
    catch(error)
    {
        console.log("Error: "+error);
        res.status(404).json(error);
    }
});

// API for count of pending appointments:
app.get("/count-pending-appointments", async(req, res) => {
    const count = await Appointment.find({status: "pending"});
    res.status(201).json({data: count.length});
});

// API for count of booked appointments:
app.get("/count-booked-appointments", async(req, res) => {
    const count = await Appointment.find({status: "booked"});
    res.status(201).json({data: count.length});
});

// API for count of cancel appointments:
app.get("/count-cancel-appointments", async(req, res) => {
    const count = await Appointment.find({status: "cancel"});
    res.status(201).json({data: count.length});
});

// API for delete doctor info:
app.delete("/delete-doctor-info", async(req, res) => {
    try
    {
        await Doctor.findByIdAndDelete(req.query.id);
        res.status(201).json({message: "delete successful."});
    }
    catch(error)
    {
        console.log("Error: "+error);
        res.status(404).json(error);
    }
});

// API for update status:
app.put("/update-status", async(req, res) => {
    try
    {
        const data = await Appointment.findById(req.query.id);
        data.status = req.body.status;
        await Appointment.findByIdAndUpdate({_id: req.query.id}, {status: data.status});
        const patient = await Patient.findById(data.patientId);

        const message = `Your appointment has been ${data.status} at ${data.appointmentSchedule}.`;
        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            subject: "Appointment status.",
            text: message
        };

        mailOptions.to = patient.email;
        transporter.sendMail(mailOptions, (error, info) => {
            if(error)
            {
                console.log("Error: "+error);
            }
            else
            {
                console.log("email sent: "+info.response);
            }
        });

        client.messages
        .create({
            body: message,
            from: process.env.T_NUMBER,
            to: patient.phone
        })
        .then((result) => { console.log("message sent: "+result)})
        .catch((error) => console.log("Error: "+error));

        res.status(201).json({message: "status update successful."});
    }
    catch(error)
    {
        console.log("Error: "+error);
        res.status(404).json(error);
    }
});

// API for update payment-status:
app.put("/update-payment-status", async(req, res) => {
    try
    {
        const data = await Appointment.findById(req.query.id);
        data.paymentStatus = req.body.status;
        await Appointment.findByIdAndUpdate({_id: req.query.id}, {paymentStatus: data.paymentStatus});
        res.status(201).json({message: "payment status update successful."});
    }
    catch(error)
    {
        console.log("Error: "+error);
        res.status(404).json(error);
    }
});

// API for get today's appointments:
app.get("/today-appointments", async(req, res) => {
    try
    {
        const appointments = await Appointment.find({status: "booked"});
        let result = {};
        let j=0;
        
        for(let i=0; i<appointments.length; i++)
        {
            const date = appointments[i].appointmentSchedule.split(" ");
            if(`${req.query.date},` === date[1])
            {
                result[j] = appointments[i];
                j++;
            }
        }
        if(j==0)
        {
            return res.status(404).json({message: "No appointments in this day."});
        }
        res.status(201).json({data: result});

    }
    catch(error)
    {
        console.log("Error: "+error);
        res.status(404).json(error);
    }
});

// API for get a specific doctor today all appointments:
app.get("/today-appointments/:id", async(req, res) => {
    try
    {
        const appointments = await Appointment.find({status: "booked", doctorId: req.params.id});
        let result = {};
        let j=0;
        
        for(let i=0; i<appointments.length; i++)
        {
            const date = appointments[i].appointmentSchedule.split(" ");
            if(`${req.query.date},` === date[1])
            {
                result[j] = appointments[i];
                j++;
            }
        }
        if(j==0)
        {
            return res.status(404).json({message: "No appointments in this day."});
        }
        res.status(201).json({data: result});

    }
    catch(error)
    {
        console.log("Error: "+error);
        res.status(404).json(error);
    }
});



// for date message: 
app.get("/msg", (req, res) => {
    console.log(Date.now);
    const dateInput = "2024-09-16";
    const dayName = moment(dateInput).format("dddd");
    console.log(`${dateInput} the day is: ${dayName}`);
    const time = moment().format("HH:mm:ss");
    console.log(time);

    const sentence = "My Name is Rafi.";
    const words = sentence.split(" ");
    console.log(words[1]);
    res.json({message: "printed"});
});



app.listen(process.env.PORT, "0.0.0.0", () => { console.log("server running...")});