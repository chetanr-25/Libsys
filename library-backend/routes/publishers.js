const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT
                p.Pub_id,
                p.Name,
                p.Address,
                COUNT(b.Book_id) AS BooksPublished
            FROM Publisher p
            LEFT JOIN Books b
                ON p.Pub_id = b.Pub_id
            GROUP BY p.Pub_id
            ORDER BY p.Pub_id
        `);

        res.json(rows);

    } catch (err) {

        console.error("Publisher Route Error:", err);

        res.status(500).json({
            error: err.message
        });
    }

});

module.exports = router;