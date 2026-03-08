import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool
const pool = mysql.createPool({
  host: process.env.RDS_HOST || 'localhost',
  user: process.env.RDS_USER || 'admin',
  password: process.env.RDS_PASSWORD || '',
  database: process.env.RDS_DATABASE || 'plant_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0,
});

// Test connection
pool.on('connection', (connection) => {
  console.log('New database connection established');
});

pool.on('error', (error) => {
  console.error('Database pool error:', error);
});

// =======================
// USER OPERATIONS
// =======================

export async function createUser(
  email: string,
  passwordHash: string,
  fullName: string
) {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.execute(
      'INSERT INTO users (email, password_hash, full_name) VALUES (?, ?, ?)',
      [email, passwordHash, fullName]
    );
    return result;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  } finally {
    connection.release();
  }
}

export async function getUserById(userId: number) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT id, email, full_name, profile_image_url, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );
    return rows?.[0] || null;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  } finally {
    connection.release();
  }
}

export async function getUserByEmail(email: string) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows?.[0] || null;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateUserProfile(
  userId: number,
  fullName: string,
  profileImageUrl?: string
) {
  const connection = await pool.getConnection();
  try {
    const query = profileImageUrl
      ? 'UPDATE users SET full_name = ?, profile_image_url = ? WHERE id = ?'
      : 'UPDATE users SET full_name = ? WHERE id = ?';
    
    const params = profileImageUrl
      ? [fullName, profileImageUrl, userId]
      : [fullName, userId];

    await connection.execute(query, params);
    return await getUserById(userId);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// =======================
// PLANT OPERATIONS
// =======================

export async function createPlant(plantData: {
  userId: number;
  name: string;
  species: string;
  description: string;
  imageUrl: string;
  location: string;
  wateringFrequency: number;
  sunlightRequirement?: string;
  temperatureRange?: string;
  humidityLevel?: string;
  fertilizerType?: string;
}) {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.execute(
      `INSERT INTO plants 
       (user_id, name, species, description, image_url, location, watering_frequency, 
        sunlight_requirement, temperature_range, humidity_level, fertilizer_type) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        plantData.userId,
        plantData.name,
        plantData.species,
        plantData.description,
        plantData.imageUrl,
        plantData.location,
        plantData.wateringFrequency,
        plantData.sunlightRequirement || null,
        plantData.temperatureRange || null,
        plantData.humidityLevel || null,
        plantData.fertilizerType || null,
      ]
    );
    return result;
  } catch (error) {
    console.error('Error creating plant:', error);
    throw error;
  } finally {
    connection.release();
  }
}

export async function getPlantById(plantId: number) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT * FROM plants WHERE id = ?',
      [plantId]
    );
    return rows?.[0] || null;
  } catch (error) {
    console.error('Error fetching plant:', error);
    throw error;
  } finally {
    connection.release();
  }
}

export async function getUserPlants(userId: number, limit = 50, offset = 0) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT * FROM plants WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [userId, limit, offset]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching user plants:', error);
    throw error;
  } finally {
    connection.release();
  }
}

export async function updatePlant(
  plantId: number,
  plantData: Partial<any>
) {
  const connection = await pool.getConnection();
  try {
    const fields = Object.keys(plantData)
      .map((key) => `${key} = ?`)
      .join(', ');
    const values = [...Object.values(plantData), plantId];

    await connection.execute(
      `UPDATE plants SET ${fields} WHERE id = ?`,
      values
    );
    return await getPlantById(plantId);
  } catch (error) {
    console.error('Error updating plant:', error);
    throw error;
  } finally {
    connection.release();
  }
}

export async function deletePlant(plantId: number) {
  const connection = await pool.getConnection();
  try {
    await connection.execute('DELETE FROM plants WHERE id = ?', [plantId]);
  } catch (error) {
    console.error('Error deleting plant:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// =======================
// CARE LOG OPERATIONS
// =======================

export async function addCareLog(
  plantId: number,
  careType: 'watering' | 'fertilizing' | 'pruning' | 'repotting',
  notes: string
) {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.execute(
      'INSERT INTO care_logs (plant_id, care_type, date, notes) VALUES (?, ?, CURDATE(), ?)',
      [plantId, careType, notes]
    );
    return result;
  } catch (error) {
    console.error('Error adding care log:', error);
    throw error;
  } finally {
    connection.release();
  }
}

export async function getCareLogs(plantId: number, limit = 100) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT * FROM care_logs WHERE plant_id = ? ORDER BY date DESC LIMIT ?',
      [plantId, limit]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching care logs:', error);
    throw error;
  } finally {
    connection.release();
  }
}

export async function getCareLogsByType(plantId: number, careType: string) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT * FROM care_logs WHERE plant_id = ? AND care_type = ? ORDER BY date DESC',
      [plantId, careType]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching care logs by type:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// =======================
// FAVORITES OPERATIONS
// =======================

export async function addFavorite(userId: number, plantId: number) {
  const connection = await pool.getConnection();
  try {
    await connection.execute(
      'INSERT INTO favorites (user_id, plant_id) VALUES (?, ?)',
      [userId, plantId]
    );
  } catch (error) {
    console.error('Error adding favorite:', error);
    throw error;
  } finally {
    connection.release();
  }
}

export async function removeFavorite(userId: number, plantId: number) {
  const connection = await pool.getConnection();
  try {
    await connection.execute(
      'DELETE FROM favorites WHERE user_id = ? AND plant_id = ?',
      [userId, plantId]
    );
  } catch (error) {
    console.error('Error removing favorite:', error);
    throw error;
  } finally {
    connection.release();
  }
}

export async function getUserFavorites(userId: number) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT p.* FROM plants p
       INNER JOIN favorites f ON p.id = f.plant_id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC`,
      [userId]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching favorites:', error);
    throw error;
  } finally {
    connection.release();
  }
}

export async function isFavorite(userId: number, plantId: number) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT id FROM favorites WHERE user_id = ? AND plant_id = ?',
      [userId, plantId]
    );
    return rows.length > 0;
  } catch (error) {
    console.error('Error checking favorite:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// =======================
// NOTIFICATIONS OPERATIONS
// =======================

export async function createNotification(
  userId: number,
  type: string,
  message: string,
  plantId?: number
) {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.execute(
      'INSERT INTO notifications (user_id, plant_id, type, message) VALUES (?, ?, ?, ?)',
      [userId, plantId || null, type, message]
    );
    return result;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  } finally {
    connection.release();
  }
}

export async function getUserNotifications(userId: number, unreadOnly = false) {
  const connection = await pool.getConnection();
  try {
    const query = unreadOnly
      ? 'SELECT * FROM notifications WHERE user_id = ? AND is_read = FALSE ORDER BY created_at DESC'
      : 'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC';

    const [rows] = await connection.execute(query, [userId]);
    return rows;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  } finally {
    connection.release();
  }
}

export async function markNotificationAsRead(notificationId: number) {
  const connection = await pool.getConnection();
  try {
    await connection.execute(
      'UPDATE notifications SET is_read = TRUE WHERE id = ?',
      [notificationId]
    );
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  } finally {
    connection.release();
  }
}

export async function deleteNotification(notificationId: number) {
  const connection = await pool.getConnection();
  try {
    await connection.execute(
      'DELETE FROM notifications WHERE id = ?',
      [notificationId]
    );
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// =======================
// DATABASE UTILITIES
// =======================

export async function closePool() {
  try {
    await pool.end();
    console.log('Database pool closed');
  } catch (error) {
    console.error('Error closing database pool:', error);
    throw error;
  }
}

export { pool };
