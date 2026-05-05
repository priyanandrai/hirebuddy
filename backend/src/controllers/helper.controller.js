import * as helperService from "../services/helper.service.js";

export const getAssignedUsers = async (req, res) => {
    console.log("req.user.role",req.user);
    
  try {
    if (req.user.role !== "HELPER") {
      return res.status(403).json({ message: "Only helpers allowed" });
    }

    const users = await helperService.getUsersWithTasksAssigned(req.user.id);
    res.json(users);
  } catch (error) {
    console.error("Get assigned users error:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};
