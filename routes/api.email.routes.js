import express from "express";
import sendMail from "../sendMail/sendMail.util.js";

const router = express.Router();

router.post("/get_in_touch", async (req, res, next) => {
  const { email } = req.body;

  try {
    const sendMailCheck = await sendMail(
      email,
      "Thank you for connected with Food Apps"
    );
    // console.log("Mail ===", sendMailCheck);
    if (sendMailCheck) {
      return res.status(201).json({
        success: true,
        message: "Thank you for connected",
      });
    }
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
