
import { NotificationModel } from '../modules/notification/notification.model.js';
import { UserModel } from '../modules/user/user.model.js';


let io;      

// Initialize Socket.IO
export const initSocketIO = async (server) => {
  console.log('Initializing Socket.IO server...');
  
  const { Server } = await import("socket.io");
  
  io = new Server(server, {  // Assign the initialized io instance to the io variable
    cors: {
      origin: "*", // Replace with your client's origin
      methods: ["GET", "POST"],
      allowedHeaders: ["my-custom-header"], // Add any custom headers if needed
      credentials: true, // If your client requires credentials
    },
  });
  
  console.log('Socket.IO server initialized!');
  
  io.on("connection", (socket) => {
    console.log("Socket just connected:", socket.id);

    // Listen for messages from the client
    socket.on("clientMessage", (message) => {
      console.log("Message received from client:", message);
      
      // Optionally, send a response back to the client
      socket.emit("serverMessage", `Server received: ${message}`);
    });

    socket.on("disconnect", () => {
      console.log(socket.id, "just disconnected");
    });
  });
};



export const emitNotification = async ({ userId, userMsg, adminMsg }) => {
  if (!io) {
    throw new Error("Socket.IO is not initialized");
  }

  // Get admin IDs
  const admins = await UserModel.find({ role: "admin" }).select("_id");
  const adminIds = admins.map((admin) => admin._id);

  // Notify the specific user
  console.log(userId, "userID");
  if (userMsg) {
    io.emit(`notification::${userId}`, {
      userId,
      message: userMsg,
    });
  }

  // Notify all admins
  if (adminMsg) {
    adminIds.forEach((adminId) => {
    //  console.log(adminId, "under foreach");
      io.emit(`notification::${adminId}`, {
        adminId,
        message: adminMsg,
      });
    });
  }

  // Save notification to the database
  await NotificationModel.create({
    userId,
    adminId: adminIds,
    adminMsg: adminMsg,
    userMsg: userMsg ,
  });
};



// Emit Notification Function for All Users
export const emitNotificationForCreateStickers = async ({ userMsg }) => {
    if (!io) {
      throw new Error("Socket.IO is not initialized");
    }
  
    // Get all users with role "user" (exclude admins)
    const users = await UserModel.find({ role: "user" }).select("_id");
    const userIds = users.map((user) => user._id);
  
    // Notify all users
    if (userMsg) {
      userIds.forEach((userId) => {
        io.emit(`notification::${userId}`, {
          userId,
          message: userMsg,
        });
      });
    }
  
    // Save notification to the database for each user
    const notifications = userIds.map((userId) => ({
      userId,
     userMsg , 
    }));
  
    await NotificationModel.insertMany(notifications); // Save all notifications
  };
  
  export const emitNotificationForChangeUserRole = async ({ userId, userMsg }) => {
    if (!io) {
      throw new Error("Socket.IO is not initialized");
    }
  
    // Notify the specific user
    if (userMsg) {
      io.emit(`notification::${userId}`, {
        userId,
        message: userMsg,
      });
    }
  
    // Save the notification to the database
    await NotificationModel.create({
      userId,
      userMsg: userMsg || '',  // Store the user message
    });
  };
  