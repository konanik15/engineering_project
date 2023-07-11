function errorHandler(err, req, res, next) {
    console.error(err);
    return res.status(500).send("Oops, seems like the server got itself in trouble");
}

module.exports = errorHandler;
