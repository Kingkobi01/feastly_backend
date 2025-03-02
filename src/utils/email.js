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
        // Format the QR code content dynamically
        // Generate the QR code link dynamically
        let qrData = "";

        if (type === "order") {
            qrData = `https://feastly.flutterflow.app/orders/${id}`;
        } else if (type === "reservation") {
            qrData = `https://feastly.flutterflow.app/reservations/${id}`;
        }


        // Generate QR Code as a Buffer
        const qrCodeData = await QRCode.toDataURL(qrData);
        const qrCodePath = path.join(__dirname, `qr_${id}.png`);

        // Convert Base64 to PNG file
        const base64Data = qrCodeData.replace(/^data:image\/png;base64,/, "");
        fs.writeFileSync(qrCodePath, base64Data, "base64");

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            html: text, // Use HTML instead of plain text
            attachments: [
                {
                    filename: "qr_code.png",
                    path: qrCodePath,
                    cid: "qrcode@feastly",
                },
            ],
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to} with QR code`);

        // Delete the file after sending
        fs.unlinkSync(qrCodePath);
    } catch (error) {
        console.error("Error sending email with QR code:", error);
    }
};
