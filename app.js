const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require("connect-flash");
const { body, validationResult, check } = require("express-validator");
const methodOverride = require("method-override");
// koneksi ke db
require("./utils/db");
const Contact = require("./model/contact");

const app = express();
const port = 3000;

// konfigurasi cookie flash dan session
app.use(cookieParser("secret"));
app.use(
  session({
    cookie: { maxAge: 6000 },
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  }),
);
app.use(flash());
// view engine
app.set("view engine", "ejs");
// menggunakan layouts
app.use(expressLayouts);
// izin folder public
app.use(express.static("public"));
// penerjemah dari html & browser (form & querry) menjadi objek yang dapat di baca dan di ubah
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// setup method override
app.use(methodOverride("_method"));

// Halaman Home
app.get("/", (req, res) => {
  res.render("index", { layout: "layouts/main-layout", title: "Contact App" });
});

// halaman about
app.get("/about", (req, res) => {
  res.render("about", { layout: "layouts/main-layout", title: "About Me" });
});

// halaman Contact
app.get("/contact", async (req, res) => {
  // sync dengan database
  const contacts = await Contact.find();

  res.render("contact", {
    layout: "layouts/main-layout",
    title: "Halaman Contacts",
    contacts,
  });
});

// delete contact

app.delete("/contact", async (req, res) => {
  await Contact.deleteOne({ _id: req.body._id });
  res.redirect("contact");
});

//  ubah data (route)
app.get("/contact/edit/:id", async (req, res) => {
  const contact = await Contact.findOne({ _id: req.params.id });

  res.render("edit-contact", {
    layout: "layouts/main-layout",
    title: "Ubah Contact",
    contact,
  });
});

//* fase ubah nama
app.put(
  "/contact",
  [
    body("email").isEmail().escape().withMessage("Email Tidak Valid"),
    body("nohp")
      .isMobilePhone("id-ID")
      .escape()
      .withMessage("Nomor Tidak Valid (Contoh Yang Benar: 08xxxxxxx)"),
    body("nama").custom(async (value, { req }) => {
      const duplikat = await Contact.findOne({ nama: value });
      if (value !== req.body.namaLama && duplikat) {
        throw new Error("nama sudah digunakan oleh orang lain");
      }
      return true;
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      //* jika errors nya kosong = tidak ada error
      await Contact.updateOne(
        { _id: req.body._id },
        {
          $set: {
            nama: req.body.nama,
            nohp: req.body.nohp,
            email: req.body.email,
          },
        },
      );
      return res.redirect("/contact");
    }
    res.render("edit-contact", {
      layout: "layouts/main-layout",
      title: "Ubah Contact",
      errors: errors.array(),
      contact: req.body,
    });
  },
);

// halaman tambah contact
app.get("/contact/add", (req, res) => {
  res.render("add-contact", {
    layout: "layouts/main-layout",
    title: "Halaman Contacts",
  });
});

//* proses tambah data contact
//! di dalam body('harus sesuai nama yang ada di form input')
app.post(
  "/contact",
  [
    body("email").isEmail().escape().withMessage("Email Tidak Valid"),
    body("nohp")
      .isMobilePhone("id-ID")
      .escape()
      .withMessage("Nomor Tidak Valid ( Contoh Yang Benar: 081-234-567 )"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      //* jika errors nya kosong = tidak ada error
      Contact.insertMany(req.body);
      req.flash("msg", "Data Contact Telah Di Tambahkan");
      return res.redirect("/contact");
    }
    res.render("add-contact", {
      layout: "layouts/main-layout",
      title: "Tambahkan Kontak Anda",
      errors: errors.array(),
    });
  },
);

app.use("/", (req, res) => {
  res.status(404);
  res.render("errorPage", {
    layout: "layouts/main-layout",
    title: "Error | Nothing Found",
  });
});

app.listen(port, () => {
  console.log(`contact berjalan di http://localhost:${port}`);
});
