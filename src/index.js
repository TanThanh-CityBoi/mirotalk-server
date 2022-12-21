const cors = require("cors");
const express = require("express");
const route = require("./routers/index");
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 5000;
const app = express();
var morgan = require("morgan");
require("dotenv").config();

app.use(morgan("combined"));
//some middleware
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use(cors());

route(app);

const af = 'ssddsksk'

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
