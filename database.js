// create a new review or update the review
const mongoose = require("mongoose")

mongoose.connect(process.env.DB_URI,
    {useUnifiedTopology: true, useNewUrlParser: true});

const connection = mongoose.connection;

module.exports = connection;
