const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);


const smsService = async (mobile, data) => {
    try {
        await client.messages.create({
            body: data,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: mobile, // Ensure the number is in E.164 format (+1XXXXXXXXXX)
        });
        console.log(`OTP sent to mobile`);
    } catch (error) {
        console.error("Error sending OTP:", error);
    }
}

module.exports=smsService