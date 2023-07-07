const db = require("../models");
const Example = db.examples;

exports.create = (req, res) => {
    if (!req.body.title) {
      res.status(400).send({ message: "Content can not be empty!" });
      return;
    }
  
    const example = new Example({
      title: req.body.title,
      description: req.body.description,
      booleanExample: req.body.booleanExample ? req.body.booleanExample : false
    });
  
    example
      .save(example)
      .then(data => {
        res.send(data);
      })
      .catch(err => {
        res.status(500).send({
          message:
            err.message || "Some error occurred while creating the example."
        });
      });
  };

exports.findAll = (req, res) => {
    const title = req.query.title;
    var condition = title ? { title: { $regex: new RegExp(title), $options: "i" } } : {};
  
    Example.find(condition)
      .then(data => {
        res.send(data);
      })
      .catch(err => {
        res.status(500).send({
          message:
            err.message || "Some error occurred while retrieving examples."
        });
      });
  };

exports.deleteAll = (req, res) => {
    Example.deleteMany({})
      .then(data => {
        res.send({
          message: `${data.deletedCount} examples were deleted successfully!`
        });
      })
      .catch(err => {
        res.status(500).send({
          message:
            err.message || "Some error occurred while removing all examples."
        });
      });
  };

