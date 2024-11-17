const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const multer = require('multer');
const path = require('path');
const adminLayout = '../views/layouts/admin';
const jwtSecret = process.env.JWT_SECRET;

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

// Middleware for authentication
const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.redirect('/'); // Redirect if no token
  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

// Routes

// Admin Dashboard
router.get('/admin', async (req, res) => {
  try {
    const locals = { title: 'Admin', description: 'Admin Dashboard' };
    res.render('admin/index', { locals, layout: adminLayout });
  } catch (error) {
    console.error(error);
  }
});

// Admin Login
router.post('/admin', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id }, jwtSecret);
    res.cookie('token', token, { httpOnly: true });
    res.redirect('/dashboard');
  } catch (error) {
    console.error(error);
  }
});

// Enable Two-Factor Authentication
router.get('/auth/2fa/establish', authMiddleware, async (req, res) => {
  try {
    const locals = { title: 'Enable 2FA', description: 'Two-Factor Authentication Setup' };
    const user = await User.findById(req.userId);
    const key = speakeasy.generateSecret({ name: `AppName (${user.username})` });
    user.twofactorKey = key.base32;
    await user.save();
    const qrcode = await QRCode.toDataURL(key.otpauth_url);
    res.render('2fa', { qrcode, locals, layout: adminLayout });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

router.post('/auth/2fa/enable', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const isValid = speakeasy.totp.verify({
      token: req.body.token,
      encoding: 'base32',
      secret: user.twofactorKey,
    });
    if (!isValid) return res.status(400).json({ message: 'Invalid token' });
    user.twofactorEnabled = true;
    await user.save();
    res.status(200).json({ message: '2FA Enabled' });
  } catch (error) {
    console.error(error);
  }
});

// Dashboard
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const locals = { title: 'Dashboard', description: 'User Dashboard' };
    const data = await Post.find();
    res.render('admin/dashboard', { locals, data, layout: adminLayout });
  } catch (error) {
    console.error(error);
  }
});

// Add Post
router
  .route('/add-post')
  .get(authMiddleware, async (req, res) => {
    try {
      const locals = { title: 'Add Post', description: 'Create a new post' };
      res.render('admin/add-post', { locals, layout: adminLayout });
    } catch (error) {
      console.error(error);
    }
  })
  .post(authMiddleware, upload.array('images', 3), async (req, res) => {
    try {
      const { title, body } = req.body;
      const images = req.files.map((file) => '/uploads/' + file.filename);
      if (!title || !body || !images.length) {
        return res.status(400).send('All fields are required');
      }
      await Post.create({ title, body, imagePaths: images });
      res.redirect('/dashboard');
    } catch (error) {
      console.error(error);
      res.status(500).send('Error adding post');
    }
  });

// Edit Post
router.put('/edit-post/:id', authMiddleware, upload.array('images', 3), async (req, res) => {
  try {
    const { title, body } = req.body;
    const images = req.files.map((file) => file.path);
    if (!title || !body) return res.status(400).send('All fields are required');
    await Post.findByIdAndUpdate(req.params.id, {
      title,
      body,
      imagePaths: images.length ? images : undefined,
      updatedAt: Date.now(),
    });
    res.redirect('/dashboard');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error editing post');
  }
});

// Delete Post
router.delete('/delete-post/:id', authMiddleware, async (req, res) => {
  try {
    await Post.deleteOne({ _id: req.params.id });
    res.redirect('/dashboard');
  } catch (error) {
    console.error(error);
  }
});

// User Registration
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, age, country, gender } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      age,
      country,
      gender,
    });

    // Send welcome email
    const mailOptions = {
      from: 'amakoken73@gmail.com',
      to: email,
      subject: 'Welcome to our App!',
      text: `Hi ${firstName},\n\nThank you for registering with our app!`,
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
      }
      res.status(201).json({ message: 'User Created', user });
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(409).json({ message: 'Username or email already in use' });
    } else {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
});

// Logout
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

module.exports = router;
