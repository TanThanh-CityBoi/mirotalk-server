const authRouter = require("./auth");

function route(app) {
  app.use("/api/auth", authRouter);
}
const x = 'llll'
module.exports = route;