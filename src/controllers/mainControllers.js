const { db, admin } = require("../config/firebaseConfig");
const { getCountryFromIP } = require("../utils/geolocation");

const usersCollection = db.collection("users");
const chatsCollection = db.collection("chats");

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

  try {
    // checking for the same name
    const activeUsersSnapshot = await usersCollection
      .where("name", "==", name)
      .where("status", "==", "Active") // Only for the check against currently active users
      .limit(1)
      .get();

    if (!activeUsersSnapshot.empty) {
      return res.status(409).json({
        message: `The name "${name}" is already active. Please choose another one.`,
      });
    }

    const clientIp = req.ip;
    const geoData = await getCountryFromIP("24.48.0.1");

    // to generate a simple unique ID for this guest session
    const authId = usersCollection.doc().id;

    // to create a user
    const newUserData = {
      authId: authId,
      name: name,
      age: parseInt(age),
      gender: gender,
      country: geoData?.country,
      userGeoData: geoData,
      isGuest: true,
      status: "Active",
      lastActive: admin.firestore.Timestamp.now(),
      createdAt: admin.firestore.Timestamp.now(),
    };

    // Adding the new user to the Firestore 'users' collection
    await usersCollection.doc(authId).set(newUserData);

    console.log(`New Guest Registered: ${name} (ID: ${authId})`);

    res.status(200).json({
      message: "Guest registration successful.",
      user: {
        authId: newUserData.authId,
        name: newUserData.name,
        country: newUserData.country,
      },
    });
  } catch (error) {
    console.error("Registration Error:", error);
    res
      .status(500)
      .json({ message: "Internal server error during registration." });
  }
};

exports.markChatAsRead = async (req, res) => {
  const { chatId, userId } = req.body;

  if (!chatId || !userId) {
    return res.status(400).json({ message: "Missing chatId or userId." });
  }

  const chatRef = chatsCollection.doc("chats");
  const unreadCountField = `unreadCount_${userId}`;

  try {
    // Using a transaction to ensure we only proceed if the chat exists
    await db.runTransaction(async (transaction) => {
      const chatDoc = await transaction.get(chatRef);

      if (!chatDoc.exists) {
        throw new Error("Chat not found.");
      }
      // Resetting the specific user's unread counter to 0
      transaction.update(chatRef, {
        [unreadCountField]: 0,
      });
    });
    console.log(`Unread count reset for user ${userId} in chat ${chatId}`);
    res.status(200).json({ message: "Chat marked as read." });
  } catch (error) {
    console.error("Error marking chat as read:", error.message);
    res.status(error.message === "Chat not found." ? 404 : 500).json({
      message: "Failed to mark chat as read.",
      error: error.message,
    });
  }
};
