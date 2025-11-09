import Post from "../models/post.js";
import Comment from "../models/comment.js";

// ✅ CREATE POST
export const createPost = async (req, res) => {
  try {
    const { text } = req.body;
    const userId = req.user?.id; // From JWT token
    const image = req.file ? req.file.path : null;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    console.log("📝 Creating post with:", { text, image, userId });

    const newPost = new Post({ userId, text, image });
    await newPost.save();
    await newPost.populate("userId", "name email");

    res.status(201).json({
      success: true,
      message: "✅ Post created successfully",
      data: newPost,
    });
  } catch (error) {
    console.error("❌ Error creating post:", error.message);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// ✅ GET ALL POSTS WITH COMMENTS
export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("userId", "name email")
      .populate("likes", "name email")
      .sort({ createdAt: -1 });

    // Get comments for each post
    const postsWithComments = await Promise.all(
      posts.map(async (post) => {
        const comments = await Comment.find({ postId: post._id })
          .populate("userId", "name email")
          .populate("likes", "name email")
          .sort({ createdAt: -1 });
        return {
          ...post.toObject(),
          comments,
        };
      })
    );

    res.status(200).json(postsWithComments);
  } catch (error) {
    console.error("❌ Error fetching posts:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ✅ ADD COMMENT TO POST
export const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const newComment = new Comment({ postId, userId, text });
    await newComment.save();
    await newComment.populate("userId", "name email");

    // Update comment count
    post.commentCount = (post.commentCount || 0) + 1;
    await post.save();

    res.status(201).json({
      success: true,
      message: "✅ Comment added successfully",
      data: newComment,
    });
  } catch (error) {
    console.error("❌ Error adding comment:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// ✅ GET COMMENTS FOR A POST
export const getComments = async (req, res) => {
  try {
    const { postId } = req.params;

    const comments = await Comment.find({ postId })
      .populate("userId", "name email")
      .populate("likes", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(comments);
  } catch (error) {
    console.error("❌ Error fetching comments:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ✅ LIKE/UNLIKE POST
export const togglePostLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const likeIndex = post.likes.indexOf(userId);
    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push(userId);
    }

    await post.save();
    await post.populate("likes", "name email");

    res.status(200).json({
      success: true,
      message: likeIndex > -1 ? "Post unliked" : "Post liked",
      data: post,
    });
  } catch (error) {
    console.error("❌ Error toggling like:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// ✅ LIKE/UNLIKE COMMENT
export const toggleCommentLike = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    const likeIndex = comment.likes.indexOf(userId);
    if (likeIndex > -1) {
      comment.likes.splice(likeIndex, 1);
    } else {
      comment.likes.push(userId);
    }

    await comment.save();
    await comment.populate("likes", "name email");

    res.status(200).json({
      success: true,
      message: likeIndex > -1 ? "Comment unliked" : "Comment liked",
      data: comment,
    });
  } catch (error) {
    console.error("❌ Error toggling comment like:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// ✅ EDIT COMMENT
export const editComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;
    const userId = req.user?.id;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Comment text is required" });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    // Only comment author can edit
    if (comment.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    comment.text = text.trim();
    await comment.save();
    await comment.populate("userId", "name email");
    await comment.populate("likes", "name email");

    res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      data: comment,
    });
  } catch (error) {
    console.error("❌ Error editing comment:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// ✅ DELETE COMMENT
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user?.id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    // Only comment author can delete
    if (comment.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await Comment.findByIdAndDelete(commentId);

    // Update post comment count
    const post = await Post.findById(comment.postId);
    if (post) {
      post.commentCount = Math.max(0, (post.commentCount || 1) - 1);
      await post.save();
    }

    res.status(200).json({ success: true, message: "Comment deleted" });
  } catch (error) {
    console.error("❌ Error deleting comment:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};
