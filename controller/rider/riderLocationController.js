import pool from "../../config.js";

export const updateLocation = async (req, res) => {
  try {
    const riderId = req.rider.id;
    const { latitude, longitude, speed, heading } = req.body;

    if (latitude == null || longitude == null) {
      return res.status(400).json({ success: false, message: "Latitude and longitude required" });
    }

    await pool.query(
      `UPDATE riders SET current_latitude = ?, current_longitude = ?, last_location_update = CURRENT_TIMESTAMP WHERE id = ?`,
      [latitude, longitude, riderId]
    );

    await pool.query(
      `INSERT INTO rider_location_history (rider_id, latitude, longitude, speed, heading) VALUES (?, ?, ?, ?, ?)`,
      [riderId, latitude, longitude, speed || null, heading || null]
    );

    return res.json({ success: true, message: "Location updated" });
  } catch (error) {
    console.error("Update location error:", error);
    return res.status(500).json({ success: false, message: "Failed to update location" });
  }
};

export const getCurrentLocation = async (req, res) => {
  try {
    const riderId = req.rider.id;

    const [rows] = await pool.query(
      `SELECT current_latitude, current_longitude, last_location_update FROM riders WHERE id = ?`,
      [riderId]
    );

    return res.json({
      success: true,
      location: {
        latitude: rows[0].current_latitude,
        longitude: rows[0].current_longitude,
        last_update: rows[0].last_location_update,
      },
    });
  } catch (error) {
    console.error("Get location error:", error);
    return res.status(500).json({ success: false, message: "Failed to get location" });
  }
};
