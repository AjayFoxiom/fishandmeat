const nodemailer = require('nodemailer')


const emailService = async (email, subject, data, orderId, pdfPath) => {
    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_ID,
            pass: process.env.EMAIL_PASS,
        },
    });

    if (orderId && pdfPath) {
        var mailOptions = {
            from: process.env.EMAIL_ID,
            to: email,
            subject,
            text: data,
            attachments: [
                {
                    filename: `invoice_${orderId}.pdf`,
                    path: pdfPath,
                },
            ]
        };
    } else {
        var mailOptions = {
            from: process.env.EMAIL_ID,
            to: email,
            subject,
            text: data,
        }
    }

    await transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log(err);
        } else {
            console.log("email send successfully");
        }
    })

};

module.exports = emailService