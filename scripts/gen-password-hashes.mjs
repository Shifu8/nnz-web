import bcrypt from "bcryptjs";

const staff = "D@wgs-St4ff#9Kp2!Qm7&Vx4";
const admin = "D@wgs-@dm1n#R7n!Wq3$Zp8&Kf5";

const staffHash = await bcrypt.hash(staff, 12);
const adminHash = await bcrypt.hash(admin, 12);

console.log("STAFF_PASSWORD_HASH_B64=" + Buffer.from(staffHash, "utf8").toString("base64"));
console.log("ADMIN_PASSWORD_HASH_B64=" + Buffer.from(adminHash, "utf8").toString("base64"));
console.log("# Pegar *_HASH_B64 en .env.local (Next corrompe hashes con $ en texto plano).");
console.log("staff_verify", await bcrypt.compare(staff, staffHash));
console.log("admin_verify", await bcrypt.compare(admin, adminHash));
