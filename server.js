const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Set up multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const publicPath = path.join(__dirname, 'public');
        fs.access(publicPath, fs.constants.W_OK, (err) => {
            if (err) {
                console.error('Cannot access public directory for uploads:', err);
                cb(err);
            } else {
                cb(null, publicPath);
            }
        });
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/png' && file.originalname.match(/^(image_\d+|flashka)\.png$/)) {
            cb(null, true);
        } else {
            cb(new Error('Only PNG files named image_1.png to image_10.png or flashka.png are allowed'), false);
        }
    }
});

// Debug middleware to log all incoming requests
app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.url}`);
    next();
});

// Serve static files from the 'public' directory
const publicPath = path.join(__dirname, 'public');
console.log('Serving static files from:', publicPath);
fs.access(publicPath, fs.constants.R_OK, (err) => {
    if (err) {
        console.error('Cannot access public directory:', err);
    }
});
app.use(express.static(publicPath));

// Route to handle image uploads
app.post('/upload-images', upload.any(), (req, res) => {
    console.log('Handling /upload-images request');
    if (req.files && req.files.length > 0) {
        res.send('Images uploaded successfully!');
    } else {
        res.status(400).send('No valid images were uploaded.');
    }
});

// Route to shuffle image positions
app.post('/shuffle-images', (req, res) => {
    console.log('Handling /shuffle-images request');
    try {
        const imageNames = Array.from({ length: 10 }, (_, i) => `image_${i + 1}.png`);
        // Fisher-Yates shuffle
        for (let i = imageNames.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [imageNames[i], imageNames[j]] = [imageNames[j], imageNames[i]];
        }

        // Rename files: First copy to temp names to avoid conflicts
        const tempNames = imageNames.map((name, index) => `temp_${index}_${name}`);
        imageNames.forEach((name, index) => {
            const srcPath = path.join(publicPath, name);
            const tempPath = path.join(publicPath, tempNames[index]);
            fs.copyFileSync(srcPath, tempPath);
            console.log(`Copied ${srcPath} to ${tempPath}`);
        });

        // Rename temp files to final names
        imageNames.forEach((name, index) => {
            const tempPath = path.join(publicPath, tempNames[index]);
            const destPath = path.join(publicPath, `image_${index + 1}.png`);
            fs.renameSync(tempPath, destPath);
            console.log(`Renamed ${tempPath} to ${destPath}`);
        });

        res.send('Image positions shuffled successfully!');
    } catch (error) {
        console.error('Error shuffling images:', error);
        res.status(500).send('Failed to shuffle image positions.');
    }
});

// Explicit route for /admin
app.get('/admin', (req, res) => {
    const adminPath = path.join(__dirname, 'public', 'admin.html');
    console.log('Handling /admin request, serving file:', adminPath);
    fs.access(adminPath, fs.constants.R_OK, (err) => {
        if (err) {
            console.error('Cannot access admin.html:', err);
            res.status(404).send('Admin page not found');
        } else {
            res.sendFile(adminPath);
        }
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});