const QRCode = require('qrcode');
const path = require("path")
const fs = require("fs")
const nodemailer = require("nodemailer");

// Configure the transporter
const transporter = nodemailer.createTransport({
    service: "gmail", // Change this if you're using another provider
    auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASS, // Your email password or app password
    },
});


exports.sendEmailWithQR = async (to, subject, text, id, restaurantName, details, userName, type) => {
    try {
        if (!id) {
            throw new Error("Invalid ID for QR code generation");
        }

        if (!["order", "reservation"].includes(type)) {
            throw new Error(`Invalid type for QR code generation: ${type}`);
        }

        let qrData = type === "order"
            ? `https://feastly.flutterflow.app/orders/${id}`
            : `https://feastly.flutterflow.app/reservations/${id}`;

        console.log("QR Generation Debug:", { id, type, qrData });

        if (!qrData) {
            throw new Error("QR data is empty. Type or ID might be incorrect.");
        }

        const qrCodeData = await QRCode.toDataURL(qrData);
        const qrCodePath = path.join(__dirname, `qr_${id}.png`);

        fs.writeFileSync(qrCodePath, qrCodeData.replace(/^data:image\/png;base64,/, ""), "base64");

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            html: text,
            attachments: [
                { filename: "qr_code.png", path: qrCodePath, cid: "qrcode@feastly" },
            ],
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to} with QR code`);

        fs.unlinkSync(qrCodePath);
    } catch (error) {
        console.error("Error sending email with QR code:", error);
    }
};
