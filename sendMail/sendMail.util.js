import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import juice from "juice";
import { fileURLToPath } from "url";

// create transport
// mailOptions
// sennd mail

// 1. transport

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
async function compileHTML(templateName, replacements) {
  const templatePath = path.join(__dirname, "templates", templateName);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  let html = fs.readFileSync(templatePath, "utf-8");

  // Replace {{email}}, {{link}} etc.
  for (const [key, value] of Object.entries(replacements)) {
    html = html.replace(new RegExp(`{{${key}}}`, "g"), String(value));
  }

  return html;
}

const sendAuthMail = async (receiverEmail, token, message = "") => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure:
        Number(process.env.EMAIL_PORT) ===
        465 /*  true for port 465, false for other ports */,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const verificationUrl = `${process.env.BASE_URL}/api/v1/users/verification/${token}`;

    const mailOption = {
      from: process.env.SENDER_MAIL, // sender address
      to: receiverEmail, // list of receivers
      subject: "Email verification", // Subject line
      text: `${message} ${verificationUrl}`, // plain text body
      // html: await compileHTML("passwordVerificationLink.html", {
      //   email: receiverEmail,
      //   link: verificationUrl,
      // }),
      // attachments: [
      //   {
      //     filename: "shield.gif",
      //     path: path.join(__dirname, "assets", "shield.gif"),
      //     cid: "shieldLogo", // same cid used in HTML
      //   },
      //   {
      //     filename: "facebook.png",
      //     path: path.join(__dirname, "assets", "facebook.png"),
      //     cid: "facebookIcon",
      //   },
      //   {
      //     filename: "linkedin.png",
      //     path: path.join(__dirname, "assets", "linkedin.png"),
      //     cid: "linkedinIcon",
      //   },
      //   {
      //     filename: "github.png",
      //     path: path.join(__dirname, "assets", "github.png"),
      //     cid: "githubIcon",
      //   },
      //   {
      //     filename: "twitter.png",
      //     path: path.join(__dirname, "assets", "twitter.png"),
      //     cid: "twitterIcon",
      //   },
      // ],
    };

    const info = await transporter.sendMail(mailOption);
    console.log("Message sent: %s", info.messageId);

    return true;
  } catch (error) {
    console.log(`Sending email fail ${error.message}`);
    return false;
  }
};

const sendMail = async (receiverEmail, message = "") => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure:
        Number(process.env.EMAIL_PORT) ===
        465 /*  true for port 465, false for other ports */,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOption = {
      from: process.env.SENDER_MAIL, // sender address
      to: receiverEmail, // list of receivers
      subject: "Connected with Food Apps", // Subject line
      text: `${message}`, // plain text body
    };

    const info = await transporter.sendMail(mailOption);
    console.log("Message sent: ", info.messageId);

    return true;
  } catch (error) {
    console.log(`Sending email fail ${error.message}`);
    return false;
  }
};

export default sendMail;
