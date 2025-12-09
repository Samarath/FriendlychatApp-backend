const express = require("express");
const router = express.Router();

//Importing the routes that has logic
const mainController = require("../controllers/mainControllers");

router.get("/", mainController.registerUser);

//Chat Notification Management
router.patch("/chat/mark-read", mainController.markChatAsRead);

module.exports = router;
