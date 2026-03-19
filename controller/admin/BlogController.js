import pool from "../../config.js";
import sanitizeHtml from "sanitize-html";

export const createBlog = async (req, res) => {
  try {
   

  

    const { title, author, writer, content, full_description, tag, readtime, readTime } = req.body;

    // prefer `writer` column but accept legacy `author` field from frontend
    const blogWriter = (writer || author || "").trim();
    const blogContentRaw = (content || full_description || "").trim();

    // Basic validation
    if (!title || title.trim() === "") {
      return res.status(400).json({ success: false, message: "Title is required" });
    }
    if (!blogWriter) {
      return res.status(400).json({ success: false, message: "Writer is required" });
    }
    if (!blogContentRaw || blogContentRaw.length < 20) {
      return res.status(400).json({ success: false, message: "Content is required (min 20 chars)" });
    }

    // Sanitization: allow basic formatting but strip scripts/styles and dangerous attributes
    const blogContent = sanitizeHtml(blogContentRaw, {
      allowedTags: [
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "blockquote",
        "p",
        "a",
        "ul",
        "ol",
        "nl",
        "li",
        "b",
        "i",
        "strong",
        "em",
        "strike",
        "code",
        "hr",
        "br",
        "div",
        "span",
        "img",
      ],
      allowedAttributes: {
        a: ["href", "name", "target", "rel"],
        img: ["src", "alt", "title", "width", "height"],
        '*': ['class']
      },
      transformTags: {
        'a': sanitizeHtml.simpleTransform('a', { rel: 'nofollow noopener noreferrer', target: '_blank' })
      }
    });

    const writerToStore = blogWriter;
    const fullDescriptionToStore = blogContent;
    const tagToStore = tag ? String(tag).trim() : null;
    const readtimeRaw = readtime !== undefined ? readtime : readTime;
    const readtimeToStore = readtimeRaw !== undefined && readtimeRaw !== null ? String(readtimeRaw).trim() : null;

    const [result] = await pool.execute(
      `INSERT INTO blogs (title, writer, full_description, tag, readtime) VALUES (?, ?, ?, ?, ?)`,
      [title.trim(), writerToStore, fullDescriptionToStore, tagToStore, readtimeToStore]
    );

    res.status(201).json({ success: true, message: "Blog created successfully", blogId: result.insertId });

   

   
  } catch (error) {
    console.error("Error creating blog:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getAllBlog = async (req, res) => {
  try {
    const [blogs] = await pool.query(`SELECT id, title, writer, tag, readtime, full_description, created_at, updated_at FROM blogs ORDER BY created_at DESC`);

    res.status(200).json({
      success: true,
      count: blogs.length,
      blogs: blogs,
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getBlogById = async (req, res) => {
  try {
    const blogId = req.params.id;
    const [rows] = await pool.query(`SELECT id, title, writer, tag, readtime, full_description, created_at, updated_at FROM blogs WHERE id = ?`, [blogId]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Blog not found' });
    res.json({ success: true, blog: rows[0] });
  } catch (err) {
    console.error('Error getting blog:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateBlog = async (req, res) => {
  try {
    const blogId = req.params.id;
    const {
      title,
      writer,
      author,
      content,
      full_description,
      tag,
      readtime,
      readTime,
    } = req.body;

    // fetch existing
    const [existingRows] = await pool.query(`SELECT * FROM blogs WHERE id = ?`, [blogId]);
    if (existingRows.length === 0) return res.status(404).json({ success: false, message: 'Blog not found' });
    const existing = existingRows[0];

    const newTitle = title !== undefined ? title : existing.title;
    const newWriter = (writer || author || existing.writer || "").trim();
    const rawContent = (content || full_description || existing.full_description || "").trim();
    const newTag = tag !== undefined ? tag : existing.tag;
    const newReadtimeRaw = readtime !== undefined ? readtime : (readTime !== undefined ? readTime : existing.readtime);
    const newReadtime = newReadtimeRaw !== null && newReadtimeRaw !== undefined ? String(newReadtimeRaw).trim() : newReadtimeRaw;

    if (!newTitle || newTitle.trim() === "") {
      return res.status(400).json({ success: false, message: "Title is required" });
    }
    if (!newWriter) {
      return res.status(400).json({ success: false, message: "Writer is required" });
    }
    if (!rawContent || rawContent.length < 20) {
      return res.status(400).json({ success: false, message: "Content is required (min 20 chars)" });
    }

    const sanitizedContent = sanitizeHtml(rawContent, {
      allowedTags: [
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "blockquote",
        "p",
        "a",
        "ul",
        "ol",
        "nl",
        "li",
        "b",
        "i",
        "strong",
        "em",
        "strike",
        "code",
        "hr",
        "br",
        "div",
        "span",
        "img",
      ],
      allowedAttributes: {
        a: ["href", "name", "target", "rel"],
        img: ["src", "alt", "title", "width", "height"],
        '*': ['class']
      },
      transformTags: {
        'a': sanitizeHtml.simpleTransform('a', { rel: 'nofollow noopener noreferrer', target: '_blank' })
      }
    });

    await pool.execute(
      `UPDATE blogs SET title = ?, writer = ?, full_description = ?, tag = ?, readtime = ? WHERE id = ?`,
      [newTitle.trim(), newWriter, sanitizedContent, newTag, newReadtime, blogId]
    );

    res.json({ success: true, message: 'Blog updated successfully' });
  } catch (err) {
    console.error('Error updating blog:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};




export const deleteBlog = async (req, res) => {
  try {
    const blogId = req.params.id;

    // check blog exists
    const [blogs] = await pool.query(`SELECT * FROM blogs WHERE id = ?`, [
      blogId,
    ]);
    if (blogs.length === 0) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    // delete blog from DB
    await pool.query(`DELETE FROM blogs WHERE id = ?`, [blogId]);

    res.json({ success: true, message: "Blog deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

