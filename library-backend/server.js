require("dotenv").config();
require("./db");

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/books", require("./routes/books"));
app.use("/api/members", require("./routes/members"));
app.use("/api/borrow", require("./routes/borrow"));
app.use("/api/publishers", require("./routes/publishers"));

app.get("/", (req, res) => {
    res.json({
        status: "Library Backend Running 🚀"
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});