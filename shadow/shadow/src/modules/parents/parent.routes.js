const express = require("express");
const router = express.Router();
const parentController = require("./parent.controller");
const { protect } = require("../../middlewares/auth.middleware");

// Protections
router.use(protect);

router.get("/", parentController.getAllParents);
router.get("/:id", parentController.getParentById);
router.post("/", parentController.createParent);
router.post("/link", parentController.linkChild);
router.put("/:id", parentController.updateParent);
router.delete("/:id", parentController.deleteParent);

module.exports = router;
