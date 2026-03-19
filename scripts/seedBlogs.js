import db from "../config/db.js";

function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function getColumns(connection, tableName) {
  const [rows] = await connection.query(
    `
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
    `,
    [tableName]
  );
  return new Set(rows.map((r) => r.COLUMN_NAME));
}

async function seedBlogs() {
  let connection;
  try {
    const host = process.env.DB_HOST || "localhost";
    const port = process.env.DB_PORT || "3306";
    const dbName = process.env.DB_NAME || "";
    const dbUser = process.env.DB_USER || "";
    console.log(`🔌 DB config: host=${host} port=${port} db=${dbName || "(missing)"} user=${dbUser || "(missing)"}`);

    connection = await db.getConnection();
    await connection.beginTransaction();

    const cols = await getColumns(connection, "blogs");
    const has = (c) => cols.has(c);

    const blogs = [
      {
        title: "Milk 101: How to Choose the Right Milk for Your Family",
        tag: "milk",
        readtime: "4 min",
        short_description:
          "A simple guide to full cream vs toned vs cow/buffalo milk, plus storage tips to keep it fresh.",
        full_description: `
<h2>Milk 101</h2>
<p>Milk is a daily staple, but the “best” choice depends on taste, nutrition goals, and how you use it (tea, smoothies, curd, paneer).</p>
<h3>How to choose</h3>
<ul>
  <li><b>For tea/coffee:</b> richer milk gives better body and mouthfeel.</li>
  <li><b>For curd:</b> consistent fat and freshness helps set thick, creamy dahi.</li>
  <li><b>For kids:</b> focus on freshness and regular intake rather than chasing labels.</li>
</ul>
<h3>Storage tips</h3>
<ul>
  <li>Refrigerate immediately.</li>
  <li>Use clean, dry utensils to avoid contamination.</li>
  <li>Boil only what you need to reduce repeated heating.</li>
</ul>
<p>Fresh milk + good handling = better taste and longer shelf life.</p>
`.trim(),
      },
      {
        title: "Ghee Benefits & Myths: What’s True and What’s Not",
        tag: "ghee",
        readtime: "5 min",
        short_description:
          "Is ghee unhealthy? Does it help digestion? Let’s clear common misconceptions and share practical usage tips.",
        full_description: `
<h2>Ghee: benefits & myths</h2>
<p>Ghee is a traditional fat used for cooking and flavor. Like any fat, it’s about portion and quality.</p>
<h3>Common myths</h3>
<ul>
  <li><b>Myth:</b> “Ghee is always unhealthy.” <b>Reality:</b> balanced intake matters most.</li>
  <li><b>Myth:</b> “More ghee = more health.” <b>Reality:</b> excess calories still count.</li>
</ul>
<h3>How to use</h3>
<ul>
  <li>Add 1 tsp over dal/roti for aroma.</li>
  <li>Use for tempering when you want a nutty taste.</li>
  <li>Store tightly closed, away from moisture.</li>
</ul>
`.trim(),
      },
      {
        title: "Curd (Dahi) at Home: Easy Steps for Thick, Creamy Curd",
        tag: "curd",
        readtime: "6 min",
        short_description:
          "From milk temperature to starter quantity—everything that affects curd setting and texture.",
        full_description: `
<h2>Make thick curd at home</h2>
<ol>
  <li><b>Boil milk</b> and cool to lukewarm (warm but not hot).</li>
  <li><b>Add starter</b>: 1–2 tsp curd per litre (too much can make it sour).</li>
  <li><b>Incubate</b> 6–10 hours in a warm place.</li>
  <li><b>Refrigerate</b> after setting to stop further fermentation.</li>
</ol>
<h3>Common issues</h3>
<ul>
  <li><b>Watery curd:</b> milk too cool or starter too little.</li>
  <li><b>Too sour:</b> long incubation or too much starter.</li>
  <li><b>Not set:</b> low temperature or weak starter culture.</li>
</ul>
`.trim(),
      },
      {
        title: "Paneer vs Cheese: What’s the Difference and When to Use Each",
        tag: "paneer",
        readtime: "4 min",
        short_description:
          "Understand how paneer is made, how it cooks, and how it compares to aged cheeses in recipes.",
        full_description: `
<h2>Paneer vs cheese</h2>
<p>Paneer is a fresh, non-aged cheese made by curdling milk with acid and pressing the curds. Most cheeses are aged and fermented.</p>
<h3>Cooking tips</h3>
<ul>
  <li>Paneer holds shape and absorbs flavors in gravies.</li>
  <li>Soak paneer briefly in warm water to keep it soft.</li>
  <li>Cheese melts differently based on moisture and aging.</li>
</ul>
`.trim(),
      },
      {
        title: "Why Butter Tastes Better Fresh: Storage, Salt, and Serving Tips",
        tag: "butter",
        readtime: "3 min",
        short_description:
          "Keep butter aromatic and spreadable—without picking up fridge odors or turning rancid.",
        full_description: `
<h2>Fresh butter tips</h2>
<ul>
  <li><b>Store airtight</b> to prevent odor absorption.</li>
  <li><b>Salted butter</b> lasts longer; unsalted is better for baking control.</li>
  <li><b>Serving</b>: keep a small amount out (cool place) and rest refrigerated.</li>
</ul>
<p>Butter is sensitive to heat, light, and air—protect it to preserve flavor.</p>
`.trim(),
      },
      {
        title: "Lassi Love: 5 Healthy Ways to Make Lassi at Home",
        tag: "lassi",
        readtime: "5 min",
        short_description:
          "From classic sweet lassi to salted jeera lassi—easy variations for every season.",
        full_description: `
<h2>5 easy lassi ideas</h2>
<ol>
  <li><b>Classic sweet</b>: curd + sugar + cardamom.</li>
  <li><b>Salted jeera</b>: curd + salt + roasted cumin + mint.</li>
  <li><b>Mango</b>: curd + ripe mango + a little honey.</li>
  <li><b>Protein boost</b>: add a spoon of soaked chia or roasted nuts.</li>
  <li><b>Buttermilk style</b>: thin with water, add curry leaves + ginger.</li>
</ol>
`.trim(),
      },
      {
        title: "Milk Safety & Hygiene: Simple Habits That Make a Big Difference",
        tag: "hygiene",
        readtime: "4 min",
        short_description:
          "Clean containers, fast cooling, and smart reheating—how to keep milk safer and fresher at home.",
        full_description: `
<h2>Milk hygiene basics</h2>
<ul>
  <li>Use clean, dry steel/glass containers.</li>
  <li>Cool and refrigerate quickly after boiling.</li>
  <li>Avoid mixing new milk into old milk.</li>
  <li>Use separate ladles for milk/curd to reduce cross-contamination.</li>
</ul>
`.trim(),
      },
      {
        title: "Ghee in Cooking: Best Uses for Tadka, Frying, and Sweets",
        tag: "cooking",
        readtime: "6 min",
        short_description:
          "When ghee shines—and when neutral oils might be a better fit.",
        full_description: `
<h2>Cooking with ghee</h2>
<h3>Great for</h3>
<ul>
  <li><b>Tadka</b> for dal and sabzi.</li>
  <li><b>Roasting</b> spices for aroma.</li>
  <li><b>Indian sweets</b> for richness and flavor.</li>
</ul>
<h3>Consider alternatives</h3>
<p>If you want a very neutral taste or strict calorie control, rotate fats based on dish and goals.</p>
`.trim(),
      },
      {
        title: "Curd for Summer: Cooling Recipes and Easy Meal Ideas",
        tag: "summer",
        readtime: "5 min",
        short_description:
          "Simple curd-based meals like kadhi, raita, and chaas to beat the heat without heavy cooking.",
        full_description: `
<h2>Curd-based summer meals</h2>
<ul>
  <li><b>Raita</b>: cucumber/onion + roasted cumin.</li>
  <li><b>Chaas</b>: curd + water + salt + mint.</li>
  <li><b>Kadhi</b>: a filling, comforting option with pakoras or plain.</li>
  <li><b>Curd rice</b>: add tadka and veggies for a complete meal.</li>
</ul>
`.trim(),
      },
      {
        title: "How to Store Dairy Products: Milk, Curd, Paneer, Butter, and Ghee",
        tag: "storage",
        readtime: "7 min",
        short_description:
          "A practical storage guide to extend freshness and avoid common spoilage issues.",
        full_description: `
<h2>Dairy storage guide</h2>
<h3>Milk</h3>
<p>Refrigerate quickly and avoid repeated warming cycles.</p>
<h3>Curd</h3>
<p>Refrigerate after setting; keep covered to prevent odors.</p>
<h3>Paneer</h3>
<p>Store in water (change daily) for short-term freshness; keep chilled.</p>
<h3>Butter</h3>
<p>Airtight container; keep away from strong-smelling foods.</p>
<h3>Ghee</h3>
<p>Dry spoon only; moisture is the enemy. Store sealed, cool, and away from sunlight.</p>
`.trim(),
      },
    ];

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const blog of blogs) {
      const title = blog.title.trim();
      const writer = "Gaualla Team";
      const tag = blog.tag ?? null;
      const readtime = blog.readtime ?? null;
      const full_description = blog.full_description.trim();

      const slug = slugify(title);
      const short_description = (blog.short_description || "").trim() || null;
      const type = "img";
      const yt_link = null;
      const img = null;

      if (has("slug")) {
        // Idempotent via UNIQUE(slug) when present.
        const columns = [];
        const values = [];
        if (has("img")) {
          columns.push("img");
          values.push(img);
        }
        columns.push("title", "slug", "writer");
        values.push(title, slug, writer);

        if (has("short_description")) {
          columns.push("short_description");
          values.push(short_description);
        }
        if (has("yt_link")) {
          columns.push("yt_link");
          values.push(yt_link);
        }
        if (has("type")) {
          columns.push("type");
          values.push(type);
        }
        if (has("tag")) {
          columns.push("tag");
          values.push(tag);
        }
        if (has("readtime")) {
          columns.push("readtime");
          values.push(readtime);
        }
        columns.push("full_description");
        values.push(full_description);

        const placeholders = columns.map(() => "?").join(", ");
        const sql = `
          INSERT INTO blogs (${columns.join(", ")})
          VALUES (${placeholders})
          ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            writer = VALUES(writer)
        `;

        const [result] = await connection.execute(sql, values);
        // mysql2: affectedRows = 1 insert, 2 update (usually) for ON DUP KEY
        if (result.affectedRows === 1) inserted += 1;
        else updated += 1;
      } else {
        // Minimal schema: dedupe by title.
        const [existing] = await connection.query("SELECT id FROM blogs WHERE title = ? LIMIT 1", [title]);
        if (existing.length) {
          skipped += 1;
          continue;
        }

        const columns = ["title", "writer", "full_description"];
        const values = [title, writer, full_description];
        if (has("tag")) {
          columns.push("tag");
          values.push(tag);
        }
        if (has("readtime")) {
          columns.push("readtime");
          values.push(readtime);
        }

        const placeholders = columns.map(() => "?").join(", ");
        await connection.execute(
          `INSERT INTO blogs (${columns.join(", ")}) VALUES (${placeholders})`,
          values
        );
        inserted += 1;
      }
    }

    await connection.commit();
    console.log(`✅ Seeded blogs. inserted=${inserted} updated=${updated} skipped=${skipped}`);
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("❌ Blog seed failed:", err);
    process.exitCode = 1;
  } finally {
    if (connection) connection.release();
  }
}

seedBlogs();


