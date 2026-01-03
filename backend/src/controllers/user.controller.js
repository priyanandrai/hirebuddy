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
      const helper = await getHelpersListService();
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