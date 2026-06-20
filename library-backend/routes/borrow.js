const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT
                bt.Borrow_id,
                m.Name AS Member_Name,
                b.Title AS Book_Title,
                bt.Issue_date,
                bt.Due_date,
                bt.Return_date,

                CASE
                    WHEN bt.Return_date IS NOT NULL THEN 'Returned'
                    WHEN CURDATE() > bt.Due_date THEN 'Overdue'
                    ELSE 'Pending'
                END AS Status

            FROM Borrow_Transaction bt

            JOIN Member m
                ON bt.Memb_id = m.Memb_id

            JOIN Books b
                ON bt.Book_id = b.Book_id

            ORDER BY bt.Borrow_id
        `);

        res.json(rows);

    } catch (err) {

        console.error("Borrow Route Error:", err);

        res.status(500).json({
            error: err.message
        });
    }

});

module.exports = router;