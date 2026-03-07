const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("====================================");
console.log("🚀 Starting Unified Vercel Build...");
console.log("====================================");

try {
    // 1. Build the React app
    console.log("\\n[1/4] Building React app in /back...");
    execSync('npm install', { cwd: path.join(__dirname, 'back'), stdio: 'inherit' });
    execSync('npm run build', { cwd: path.join(__dirname, 'back'), stdio: 'inherit' });

    // 2. Prepare output directory
    console.log("\\n[2/4] Preparing /dist directory...");
    const distDir = path.join(__dirname, 'dist');
    if (fs.existsSync(distDir)) {
        fs.rmSync(distDir, { recursive: true, force: true });
    }
    fs.mkdirSync(distDir);

    // 3. Copy React app to dist root
    console.log("\\n[3/4] Copying React build to /dist...");
    const backDist = path.join(__dirname, 'back', 'dist');
    if (fs.existsSync(backDist)) {
        fs.cpSync(backDist, distDir, { recursive: true });
    } else {
        throw new Error("React build failed: back/dist not found");
    }

    // 4. Copy Vanilla JS dashboard to dist/admin
    console.log("\\n[4/4] Copying Admin Dashboard to /dist/admin...");
    const adminDist = path.join(distDir, 'admin');
    fs.mkdirSync(adminDist);
    const frontDir = path.join(__dirname, 'front');
    fs.cpSync(frontDir, adminDist, { recursive: true });

    console.log("\\n✅ Build complete! All files successfully successfully merged into /dist");
} catch (error) {
    console.error("\\n❌ Build failed:", error.message);
    process.exit(1);
}
