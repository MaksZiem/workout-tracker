const express = require("express");

const authController = require("../controllers/auth-controller");

const router = express.Router();

router.put("/:userId", authController.updateUser);

router.post("/signup", authController.signup);

router.post("/login", authController.login);

module.exports = router;
