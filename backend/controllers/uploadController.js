const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
        }
    }
});

const uploadImage = async (req, res, next) => {
    try {
        const uploadSingle = upload.single('image');
        
        uploadSingle(req, res, (err) => {
            if (err) {
                if (err instanceof multer.MulterError) {
                    if (err.code === 'LIMIT_FILE_SIZE') {
                        return res.status(400).json({ 
                            error: 'File size too large. Maximum size is 5MB.',
                            code: 'FILE_TOO_LARGE'
                        });
                    }
                }
                return res.status(400).json({ 
                    error: err.message,
                    code: 'UPLOAD_ERROR'
                });
            }

            if (!req.file) {
                return res.status(400).json({ 
                    error: 'No file uploaded',
                    code: 'NO_FILE'
                });
            }

            const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

            res.json({
                message: 'File uploaded successfully',
                url: fileUrl,
                filename: req.file.filename,
                size: req.file.size
            });
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    uploadImage
};
