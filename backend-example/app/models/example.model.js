module.exports = mongoose => {
    var schema = mongoose.Schema(
      {
        title: String,
        description: String,
        booleanExample: Boolean
      },
      { timestamps: true }
    );
  
    schema.method("toJSON", function() {
      const { __v, _id, ...object } = this.toObject();
      object.id = _id;
      return object;
    });
  
    const Example = mongoose.model("examples", schema);
    return Example;
  };