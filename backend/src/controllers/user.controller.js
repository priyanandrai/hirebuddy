import {
    setRoleService,
    updateHelperProfileService,
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
    const helper = await userService.getHelper(req.params.id);
    if (!helper) {
      return res.status(404).json({ message: "Helper not found" });
    }
    res.json(helper);
  };