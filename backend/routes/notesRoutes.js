// backend/routes/notesRoutes.js
const express = require("express");
const router = express.Router();
const Note = require("../models/Note");
const auth = require("../middleware/authMiddleware");

// All routes below require authentication
router.use(auth);

// GET /api/notes - get all notes for logged-in user
router.get("/", async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(notes);
  } catch (err) {
    console.error("Error getting notes:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/notes - create note
router.post("/", async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res
        .status(400)
        .json({ message: "Title and content are required" });
    }

    const newNote = new Note({
      title,
      content,
      user: req.user.id,
    });

    const savedNote = await newNote.save();
    res.status(201).json(savedNote);
  } catch (err) {
    console.error("Error creating note:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/notes/:id - update note
router.put("/:id", async (req, res) => {
  try {
    const { title, content } = req.body;

    const updatedNote = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { title, content },
      { new: true }
    );

    if (!updatedNote) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json(updatedNote);
  } catch (err) {
    console.error("Error updating note:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/notes/:id - delete note
router.delete("/:id", async (req, res) => {
  try {
    const deletedNote = await Note.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!deletedNote) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json({ message: "Note deleted successfully" });
  } catch (err) {
    console.error("Error deleting note:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
