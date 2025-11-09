import express from "express";
import upload from "../middleware/upload.js";
import {
  createPost,
  getAllPosts,
  addComment,
  getComments,
  togglePostLike,
  toggleCommentLike,
  editComment,
  deleteComment,
} from "../controllers/postController.js";
import { verifyToken } from "../controllers/authController.js";

const router = express.Router();

// Posts
router.post("/create", verifyToken, upload.single("image"), createPost);
router.get("/getall", getAllPosts);
router.post("/:postId/like", verifyToken, togglePostLike);

// Comments
router.post("/:postId/comments", verifyToken, addComment);
router.get("/:postId/comments", getComments);
router.put("/comments/:commentId", verifyToken, editComment);
router.delete("/comments/:commentId", verifyToken, deleteComment);
router.post("/comments/:commentId/like", verifyToken, toggleCommentLike);

export default router;
