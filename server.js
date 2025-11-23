import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = 5000;
const JWT_SECRET = 'your-secret-key-change-this-in-production';
const mongodb = process.env.MONGO_DB_CONNECTION_URI || 'mongodb://localhost:27017/notemanager_db';
const dbName = 'notemanager_db';

console.log(mongodb);
// Middleware
app.use(cors());
app.use(express.json());

console.log(mongodb.startsWith('mongodb+srv') ? 'Using MongoDB Atlas' : `Using MongoDB URI: ${mongodb}`);

// MongoDB Connection
mongoose.connect(mongodb, {
  dbName // if the URI doesn't include a DB, mongoose will use this
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- Schemas ---

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const noteSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userEmail: { type: String, required: true }, // Link note to user
  content: { type: String, required: true },
  createdAt: { type: Number, required: true },
  color: { type: String, required: true },
  endDate: String,
  status: { type: String, required: true, enum: ['active', 'pending', 'done'] }
});

const User = mongoose.model('User', userSchema);
const Note = mongoose.model('Note', noteSchema);

// --- Middleware for Auth ---

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user; // user contains { email: '...' }
    next();
  });
};

// --- Auth Endpoints ---

// Sign Up
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check for duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate Token
    const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, email: user.email });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- Protected Note Endpoints ---

// GET user notes
app.get('/api/notes', authenticateToken, async (req, res) => {
  try {
    // Only fetch notes belonging to the logged-in user
    const notes = await Note.find({ userEmail: req.user.email }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST new note
app.post('/api/notes', authenticateToken, async (req, res) => {
  try {
    const newNote = new Note({
      ...req.body,
      userEmail: req.user.email // Attach user email from token
    });
    await newNote.save();
    res.status(201).json(newNote);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update note
app.put('/api/notes/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    // Ensure we only update notes belonging to the user
    const updatedNote = await Note.findOneAndUpdate(
      { id: id, userEmail: req.user.email }, 
      { $set: req.body }, 
      { new: true }
    );
    
    if (!updatedNote) {
      return res.status(404).json({ message: 'Note not found or access denied' });
    }
    
    res.json(updatedNote);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE note
app.delete('/api/notes/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    // Ensure we only delete notes belonging to the user
    const result = await Note.findOneAndDelete({ id: id, userEmail: req.user.email });
    
    if (!result) {
      return res.status(404).json({ message: 'Note not found or access denied' });
    }
    
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});