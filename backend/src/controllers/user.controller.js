import { getUserTasks } from "../services/task.service.js";
import {
    setRoleService,
    updateHelperProfileService,
    getHelper,
    getHelpersListService,
  } from "../services/user.service.js";
  
  export const setRole = async (req, res) => {
    const user = await setRoleService(req.user.id, req.body.role);
    res.json(user);
  };
  
  export const updateHelperProfile = async (req, res) => {
    const user = await updateHelperProfileService(req.user.id, req.body);
    res.json(user);
  };
  export const getHelperById = async (req, res) => {
    const helper = await getHelper(req.params.id);
    if (!helper) {
      return res.status(404).json({ message: "Helper not found" });
    }
    res.json(helper);
  };

  export const getHelpersList = async (req, res) => {
    try {
      const helper = await getHelpersListService(req, res);
    if (!helper) {
      return res.status(404).json({ message: "Helper not found" });
    }
    res.json(helper);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch helpers",
      });
    }
  };
  // export const getAssignedHelpers = async (req, res) => {
  //   try {
  //     const helpers = await getHelpersAssignedToUserTasks(
  //       req.user.id
  //     );
  //     res.json(helpers);
  //   } catch (error) {
  //     console.error("Get assigned helpers error:", error);
  //     res.status(500).json({ message: "Failed to fetch helpers" });
  //   }
  // };


  export const getAssignedHelpersFromMyTasks = async (req, res) => {
    try {
      const userId = req.user.id; // from JWT middleware
  
      const tasks = await getUserTasks(userId);
  
      const helperMap = {};
  
      tasks.forEach((task) => {
        if (!task.assignedTo) return; // skip unassigned tasks
  
        const helper = task.assignedTo;
  
        if (!helperMap[helper.id]) {
          helperMap[helper.id] = {
            id: helper.id,
            name: helper.name,
            taskCount: 1,
          };
        } else {
          helperMap[helper.id].taskCount += 1;
        }
      });
  
      res.json(Object.values(helperMap));
    } catch (error) {
      console.error("Get assigned helpers error:", error);
      res.status(500).json({ message: "Failed to fetch assigned helpers" });
    }
  };
  
