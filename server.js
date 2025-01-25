const app = require('./index')
const dotenv = require('dotenv')
const connection = require('./database')
const { createServer } = require("node:http");
const server = createServer(app);
dotenv.config({ path: "backend/config/config.env" })

const PORT = process.env.PORT;

const initializeApplication = async () => {
    connection.once("open", () => {
        console.log("MongoDB database connection established successfully");
    });

    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

initializeApplication();

process.on("unhandledRejection", (err)=>{
    console.log(`Error: ${err.message}`);
    console.log(`Shutting down the server due to Unhandeled Promis Rejection`);
    server.close(()=>{
        process.exit(1);
    });
});

function errorHandler() {
    process.on('uncaughtException', function (err) {
        console.log('uncaughtException', err);
    });
    // global error handler
    app.use((error, req, res, next) => {
        console.log("> Gobal error handler says: ", error);
        res.status(404).json({ message: error });
    });
}
errorHandler();