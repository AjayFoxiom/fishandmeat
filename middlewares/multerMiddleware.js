const multer = require('multer')


const storage = multer.memoryStorage();

const fileFilter = (req, file, callback) => {
    if (file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        callback(null, true)
    } else {
        callback(null, false)
        return callback(new Error(`Please upload files with following extensions (jpg/jpge/png)`))
    }
}

const multerConfig = multer({
    storage, fileFilter
})

module.exports = multerConfig