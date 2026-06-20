const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res) => {
    try {
        console.log("Books API called");

        const [rows] = await db.query("SELECT * FROM Books");

        console.log("Found", rows.length, "books");

        res.json(rows);

    } catch (err) {
        console.error("Books Route Error:");
        console.error(err);

        res.status(500).json({
            error: err.message
        });
    }
});

module.exports = router;