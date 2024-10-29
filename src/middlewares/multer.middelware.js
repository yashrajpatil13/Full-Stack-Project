import multer from "multer"

// Two types of storage to save: diskstorage and memory buffer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})
// storage will return the local path of saved file 

export const upload = multer({ 
    storage,
})