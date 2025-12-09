const { db, admin } = require("./config/firebaseConfig");
const userCollection = db.collection("users");
const chatsCollection = db.collection("chats");

/**
 * Creating a deterministic chatId by sorting two user IDs.
 * @param {string} id1
 * @param {string} id2
 * @returns {string}
 */
const getPersonalChatId = (id1, id2) => {
  return [id1, id2].sort().join("_");
};

// Handles the persistence of a new personal chat message.
const savePersonalMessage = async (senderId, recipientId, content) => {
  const chatId = getPersonalChatId(senderId, recipientId);
  const now = admin.firestore.Timestamp.now();

  const chatRef = chatsCollection.doc(chatId);
  // using set() with merge:true to create it if it doesn't exist, and update metadata if it does.
  const messageData = {
    senderId: senderId,
    type: "text",
    content: content,
    timestamp: now,
  };

  // using transaction to e nsures atomicity and handles concurrent updates
  await db.runTransaction(async (transaction) => {
    const chatDoc = await transaction.get(chatRef);

    if (!chatDoc.exists) {
      //  Chat does NOT exist - Create the parent document
      const newChatData = {
        participants: [senderId, recipientId],
        type: "personal",
        lastMessage: content.substring(0, 100),
        updatedAt: now,
        // Initialize the recipient's unread count
        [`unreadCount_${recipientId}`]: 1,
      };

      transaction.set(chatRef, newChatData);
    } else {
      // Chat EXISTS - Update the metadata and increment count safely
      const updateData = {
        lastMessage: content.substring(0, 100),
        updatedAt: now,
        [`unreadCount_${recipientId}`]: admin.firestore.FieldValue.increment(1),
      };

      transaction.update(chatRef, updateData);
    }
  });

  // Saving the message
  await chatRef.collection("messages").add(messageData);

  return { chatId, timestamp: now };
};

module.exports = (io) => {
  //connects when a new user connects via websocket
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket?.id}`);

    let userAuthId = null;

    socket.on("USER_IDENTIFY", async (authId) => {
      if (!authId) return;

      userAuthId = authId;
      // Associating the authId with the socket for easy lookup
      socket.join(userAuthId);
      console.log(
        `User identified: ${userAuthId}. Joining room: ${userAuthId}`
      );

      // Updating user status to ACTIVE in Firestore
      await userCollection.doc(userAuthId).update({
        status: "Active",
        lastActive: admin.firestore.Timestamp.now(),
      });

      //chat message handler
      socket.on("SEND_MESSAGE", async (data) => {
        const { recipientId, content } = data;

        if (!userAuthId || !recipientId || !content) return;

        //Persistence: Save message to Firestore

        const { chatId, timestamp } = await savePersonalMessage(
          userAuthId,
          recipientId,
          content
        );
        const messagePayload = {
          chatId,
          senderId: userAuthId,
          content,
          type: "text",
          timestamp: timestamp.toDate().toISOString(),
        };

        //Real-Time Delivery: Emit message to the recipient
        io.to(recipientId).emit("RECEIVE_MESSAGE", messagePayload);
        io.to(userAuthId).emit("RECEIVE_MESSAGE", messagePayload);
        console.log(`Message sent: ${userAuthId} -> ${recipientId}`);
      });
    });

    socket.on("TYPING_START", (data) => {
      const { chatId, recipientId } = data;
      io.to(recipientId).emit("TYPING_START", {
        chatId,
        senderId: userAuthId,
      });
      console.log(`Typing START: ${userAuthId} in chat ${chatId}`);
    });

    socket.on("TYPING_STOP", (data) => {
      const { chatId, recipientId } = data;
      io.to(recipientId).emit("TYPING_STOP", {
        chatId,
        senderId: userAuthId,
      });
      console.log(`Typing START: ${userAuthId} in chat ${chatId}`);
    });

    //handling disconnected user
    socket.on("disconnect", async () => {
      console.log(`user disconnected: ${socket.id}`);

      //if user is disconnect then mark them inactive
      if (userAuthId) {
        await userCollection.doc(userAuthId).update({
          status: "Inactive",
          lastActive: admin.firestore.Timestamp.now(),
        });
        console.log(`User ${userAuthId} marked Inactive.`);
      }
    });
  });
};
