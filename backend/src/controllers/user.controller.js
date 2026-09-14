import { getUserTasks } from "../services/task.service.js";
import {
    setRoleService,
    updateHelperProfileService,
    getHelper,
    getHelpersListService,
  submitIdDocumentService,
  verifyUserIdService,
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
      const helpers = await getHelpersListService();
      res.json({
        success: true,
        data: helpers,
      });
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

  export const getPendingIdSubmissions = async (req, res) => {
    try {
      const adminToken = req.query.adminToken;
      if (!adminToken || adminToken !== process.env.ID_VERIFY_TOKEN) {
        return res.status(403).json({ message: 'Invalid admin token' });
      }

      const rows = await getPendingIdSubmissionsService();
      res.json({ success: true, data: rows });
    } catch (error) {
      console.error('Get pending IDs error', error);
      res.status(500).json({ message: 'Failed to fetch pending IDs' });
    }
  };

  export const submitIdDocument = async (req, res) => {
    try {
      const userId = req.user.id;
      const { idDocumentUrl } = req.body;
      if (!idDocumentUrl) return res.status(400).json({ message: 'idDocumentUrl is required' });
      const user = await submitIdDocumentService(userId, idDocumentUrl);
      res.json({ success: true, user });
    } catch (error) {
      console.error('Submit ID error', error);
      res.status(500).json({ message: 'Failed to submit ID document' });
    }
  };

  // Simple admin-style verification endpoint using an ADMIN token in body (env check)
  export const verifyUserId = async (req, res) => {
    try {
      const adminToken = req.body.adminToken || req.query.adminToken;
      if (!adminToken || adminToken !== process.env.ID_VERIFY_TOKEN) {
        return res.status(403).json({ message: 'Invalid admin token' });
      }

      const userId = req.params.id;
      const { status, notes } = req.body;
      if (!['VERIFIED','REJECTED','PENDING','UNVERIFIED'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      const user = await verifyUserIdService(userId, status, notes || null);
      res.json({ success: true, user });
    } catch (error) {
      console.error('Verify ID error', error);
      res.status(500).json({ message: 'Failed to verify user ID' });
    }
  };
  
