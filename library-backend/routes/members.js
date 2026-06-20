const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                Memb_id,
                Name,
                Memb_type,
                Address,
                Memb_date,
                Expiry_date
            FROM Member
            ORDER BY Memb_id
        `);

        res.json(rows);

    } catch (err) {
        console.error("Members Route Error:", err);
        res.status(500).json({
            error: err.message
        });
    }
});

module.exports = router;