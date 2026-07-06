const mongoose = require("mongoose");

const Contact = mongoose.model("contact", {
  nama: {
    type: String,
    required: [true, "Nama Wajib Di Isi !"],
  },
  nohp: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: [true, "Masukan Email "],
    unique: true,
  },
});

module.exports = Contact;
