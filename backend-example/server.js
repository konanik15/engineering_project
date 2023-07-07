const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors(corsOptions));


app.use(express.json());


app.use(express.urlencoded({ extended: true }));

const db = require("./app/models");
db.mongoose
  .connect(db.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("Connected to the database!");
  })
  .catch(err => {
    console.log("Cannot connect to the database!", err);
    process.exit();
  });

var corsOptions = {
  origin: "http://localhost:8081"
};


app.get("/", (req, res) => {
  res.json({ message: "ELO ELO 320" });
});

require("./app/routes/example.routes")(app);
require("dotenv").config();

const PORT = 8888;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});