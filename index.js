// const dotenv = require('dotenv')
// const express = require('express')
// const app = express()
// const cookieParser = require("cookie-parser")
// const bodyParser = require("body-parser");
// const cors = require('cors')
// const apiRoutes = require("./routes/index");

// const errorMiddleware = require("./errors/error")

// dotenv.config({ path: "config/config.env" })

// app.use(express.static('public'));
// app.set("view engine", "ejs");
// const corsOptions = {
//   // origin: 'https://anneca-backend.onrender.com',
//   origin: 'https://www.annecafashion.com/',
//   credentials: true, 
// };
// app.use(cors(corsOptions))
// app.use(express.json())
// app.use(cookieParser())
// app.use(bodyParser.urlencoded({ extended: true }))

// app.use("/api/v1", apiRoutes)

// app.get('/', (req, res) => {
//   res.send('<h1>Working Fine</h1>')
// })

// // Error
// app.use(errorMiddleware)

// module.exports = app

// // only work frontend 
// const dotenv = require('dotenv');
// const express = require('express');
// const app = express();
// const cookieParser = require("cookie-parser");
// const bodyParser = require("body-parser");
// const cors = require('cors');
// const apiRoutes = require("./routes/index");

// const errorMiddleware = require("./errors/error");

// dotenv.config({ path: "config/config.env" });

// app.use(express.static('public'));
// app.set("view engine", "ejs");

// // Define allowed origins
// const allowedOrigins = ['https://www.annecafashion.com'];

// const corsOptions = {
//   origin: function (origin, callback) {
//     if (allowedOrigins.includes(origin) || !origin) { 
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true, 
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],  
//   allowedHeaders: ['Content-Type', 'Authorization']  
// };

// app.use(cors(corsOptions)); 

// app.use(express.json());
// app.use(cookieParser());
// app.use(bodyParser.urlencoded({ extended: true }));

// app.use("/api/v1", apiRoutes);

// app.get('/', (req, res) => {
//   res.send('<h1>Working Fine</h1>');
// });

// app.use(errorMiddleware);

// module.exports = app
const dotenv = require('dotenv');
const express = require('express');
const app = express();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require('cors');
const apiRoutes = require("./routes/index");

const errorMiddleware = require("./errors/error");

dotenv.config({ path: "config/config.env" });

app.use(express.static('public'));
app.set("view engine", "ejs");

// Define allowed origins for both website and admin panel
const allowedOrigins = [
  'https://www.annecafashion.com',
  'https://anneca-frontend.vercel.app',
  'https://anneca-admin.vercel.app', 
  'https://anneca-frontend-nine.vercel.app/',
  'http://localhost:3000',
  'http://localhost:3001'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.includes(origin) || !origin) {  // Allow if origin is in the allowed list
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,  // Allow sending credentials (cookies, auth headers, etc.)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],  // Specify allowed methods
  allowedHeaders: ['Content-Type', 'Authorization']  // Specify allowed headers
};

app.use(cors(corsOptions));  // Use CORS with the specified options

app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api/v1", apiRoutes);

app.get('/', (req, res) => {
  res.send('<h1>Working Fine</h1>');
});

// Error handling middleware
app.use(errorMiddleware);

module.exports = app
