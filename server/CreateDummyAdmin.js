import { pool } from "./config/db.js";
import bcrypt from "bcryptjs";

const createDummyAdmin = async () => {
  try {
    const email = "admin@gmail.com";
    const password = "12345678"; // Change this to your preferred password
    
    // Check if admin already exists
    const checkQuery = "SELECT * FROM admins WHERE email = $1";
    const existingAdmin = await pool.query(checkQuery, [email]);
    
    if (existingAdmin.rows.length > 0) {
      console.log("Admin already exists!");
      return;
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create admin with all permissions
    const insertQuery = `
      INSERT INTO admins (email, password_hash, first_name, last_name, phone, role_level, permissions, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING admin_id, email, first_name, last_name, role_level;
    `;
    
    // Full permissions for super admin
    const fullPermissions = {
      "manage_users": true,
      "manage_doctors": true,
      "manage_patients": true,
      "view_analytics": true,
      "manage_appointments": true,
      "manage_system_settings": true,
      "manage_admins": true,
      "view_logs": true,
      "manage_notifications": true,
      "approve_doctors": true,
      "delete_records": true
    };

    const insertValues = [
      email,
      hashedPassword,
      "Super",
      "Admin",
      "+1234567890",
      "super_admin",
      JSON.stringify(fullPermissions),
      true
    ];

    const result = await pool.query(insertQuery, insertValues);
    const admin = result.rows[0];

    console.log("✅ Dummy admin created successfully!");
    console.log("📧 Email:", email);
    console.log("🔑 Password:", password);
    console.log("👤 Admin ID:", admin.admin_id);
    console.log("\n⚠️  Remember to change the password after first login!");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating dummy admin:", error);
    process.exit(1);
  }
};

createDummyAdmin();