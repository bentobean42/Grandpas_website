const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
require("dotenv").config(); // Load environment variables
const sgMail = require("@sendgrid/mail"); // Import SendGrid library

// Set SendGrid API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dbrename, "../Grandpas website"))); // Adjust path to your frontend

// Form submission route
app.post("/submit", async (req, res) => {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).send("Please fill in all required fields.");
    }

    const msg = {
        to: process.env.RECEIVING_EMAIL, // Your email from the .env file
        from: "test@example.com", // Your verified sender email in SendGrid
        subject: "New Contact Form Submission",
        text: `You have received a new message:\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || "N/A"}\nMessage:\n${message}`,
        html: `
            <strong>You have received a new message:</strong><br><br>
            <b>Name:</b> ${name}<br>
            <b>Email:</b> ${email}<br>
            <b>Phone:</b> ${phone || "N/A"}<br>
            <b>Message:</b><br>${message}
        `,
    };

    try {
        await sgMail.send(msg);
        res.status(200).send("Thank you for contacting us! We will get back to you soon.");
    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).send("There was an error processing your request. Please try again later.");
    }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
