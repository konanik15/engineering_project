module.exports = app => {
    const tutorials = require("../controllers/example.controller.js");
  
    var router = require("express").Router();
  
    router.post("/", tutorials.create);
  
    router.get("/", tutorials.findAll);
  
    router.delete("/", tutorials.deleteAll);
  
    app.use('/api/examples', router);
  };