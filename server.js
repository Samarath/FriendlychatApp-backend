const express = require("express");
const cors = require("cors");

const mainRoutes = require("./src/routes/mainRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy header for accurate IP retrieval (Crucial for Vercel/proxies)
app.set("trust proxy", true);

//Middlewware
app.use(cors());
app.use(express.json());

// Routes
// All main routes will be handled here ( /register, /users)
app.use("/", mainRoutes);

//Start the server
app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
