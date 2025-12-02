exports.serverStatus = (req, res) => {
  res.status(200).json({
    message: "Welcome to the app",
    service: "Node js/ express",
  });
};

//to register the user
exports.registerUser = async (req, res) => {
  const { name, age, gender } = req.body;

  if (!name || !age || !gender) {
    return res
      .status(400)
      .json({ message: "Missing required user information." });
  }

  //capturing the user IP
  const clientIP = req.ip;

  //For country pouplation, current it's not there
  let country = "Unkown";

  const userData = {
    name,
    age,
    gender,
    ip: clientIP,
    country: country,
  };

  console.log("Received Guest User Registration:", userData);

  res.status(200).json({
    message: "Registration data received successfully (No DB storage yet).",
    user: userData,
  });
};
