const multer = require('multer')
const path = require('path')
const fs = require('fs')

const uploadDir = path.join(__dirname, '../public/uploads')

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
       // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
        const ext = path.extname(file.originalname) || ''
        const baseName = path.basename(file.originalname, ext)
       // cb(null, `${baseName}-${uniqueSuffix}${ext}`)

	let safeName = String(baseName)
	.normalize('NFC')                 // ใช้ NFC พอ (ปลอดภัยกว่า NFD)
                .replace(/[\u0300-\u036f]/g, '')  // ลบ accent marks
                .replace(/[^a-zA-Z0-9ก-ฮ0-9_-]/g, '-') // แทนตัวอักษรพิเศษ
                .replace(/-+/g, '-')              // รวม - ซ้ำ ๆ
                .replace(/^-|-$/g, '')            // ตัด - ข้างหน้า/หลัง

            if (!safeName) safeName = 'file'      // กันกรณีชื่อว่างเปล่า

            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
            cb(null, `${safeName}-${uniqueSuffix}${ext}`)
    }
})

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 30MB
})

module.exports = upload
