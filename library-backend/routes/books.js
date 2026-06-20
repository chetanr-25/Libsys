const express = require("express");
const router = express.Router();
const db = require("../db");

/* ===========================
   GET ALL BOOKS
=========================== */

router.get("/", async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT
                Book_id,
                Title,
                Author_Name,
                Price,
                Available,
                Pub_id
            FROM Books
            ORDER BY Book_id
        `);

        res.json(rows);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });

    }

});


/* ===========================
   ADD NEW BOOK
=========================== */

router.post("/", async (req, res) => {

    try {

        const {
            Title,
            Author_Name,
            Price,
            Available,
            Pub_id
        } = req.body;

        if (!Title || !Author_Name || !Price || !Pub_id) {
            return res.status(400).json({
                message: "Please fill all required fields."
            });
        }

        const [max] = await db.query(
            "SELECT MAX(Book_id) AS id FROM Books"
        );

        const newId = (max[0].id || 100) + 1;

        await db.query(
            `
            INSERT INTO Books
            (Book_id, Title, Author_Name, Price, Available, Pub_id)
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                newId,
                Title,
                Author_Name,
                Price,
                Available ?? true,
                Pub_id
            ]
        );

        res.status(201).json({
            success: true,
            message: "Book Added Successfully"
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });

    }

});

/* ===========================
   UPDATE BOOK
=========================== */

router.put("/:id", async (req, res) => {

    try {

        const id = req.params.id;

        const {
            Title,
            Author_Name,
            Price,
            Available,
            Pub_id
        } = req.body;

        const [result] = await db.query(
            `
            UPDATE Books
            SET
                Title = ?,
                Author_Name = ?,
                Price = ?,
                Available = ?,
                Pub_id = ?
            WHERE Book_id = ?
            `,
            [
                Title,
                Author_Name,
                Price,
                Available,
                Pub_id,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Book not found"
            });
        }

        res.json({
            success: true,
            message: "Book updated successfully"
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });

    }

});

/* ===========================
   DELETE BOOK
=========================== */

router.delete("/:id", async (req, res) => {

    try {

        const id = req.params.id;

        const [result] = await db.query(
            "DELETE FROM Books WHERE Book_id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Book not found"
            });
        }

        res.json({
            success: true,
            message: "Book deleted successfully"
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });

    }

});




module.exports = router;