// server.js
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-this";

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for base64 images

// --- MIDDLEWARE ---
// This checks if the user sends a valid token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) return res.status(401).json({ error: "Access denied" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user; // Attach user ID to the request object
    next();
  });
};

// --- AUTH ROUTES ---

// 1. REGISTER
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;

  try {
    // Hash the password (10 rounds of salt)
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name
      }
    });

    res.json({ message: "User created successfully" });
  } catch (error) {
    res.status(400).json({ error: "User already exists" });
  }
});

// 2. LOGIN
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: "User not found" });

    // Compare sent password with hashed password in DB
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: "Invalid password" });

    // Create a Token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, name: user.name, email: user.email, profileImage: user.profileImage });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

// --- SIMULATION ROUTES ---

app.get('/api/simulations', async (req, res) => {
  const sims = await prisma.simulation.findMany();
  res.json(sims);
});

// --- PROTECTED ROUTES (Require Login) ---

// Get User Profile
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  const userId = parseInt(req.user.userId);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        profileImage: true,
        createdAt: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: "Failed to get profile" });
  }
});

// Update User Profile
app.put('/api/user/profile', authenticateToken, async (req, res) => {
  const userId = parseInt(req.user.userId);
  const { name, profileImage } = req.body;

  console.log('Updating profile for user:', userId);
  console.log('Name:', name);
  console.log('Image size:', profileImage ? profileImage.length : 0);

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        name: name || null,
        profileImage: profileImage || null
      },
      select: {
        id: true,
        email: true,
        name: true,
        profileImage: true
      }
    });
    res.json(updatedUser);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: "Failed to update profile", details: error.message });
  }
});

// 3. Save Progress (Now Protected)
app.post('/api/save-progress', authenticateToken, async (req, res) => {
  // We get userId from the token, not the body (more secure)
  const userId = req.user.userId; 
  const { simulationId, data, name } = req.body;

  try {
    const newLog = await prisma.simulationState.create({
        data: { 
            userId, 
            simulationId, 
            name: name || "Untitled Experiment",
            data 
        }
    });
    res.json({ message: "Progress saved!", id: newLog.id });
  } catch (error) {
    res.status(500).json({ error: "Failed to save progress" });
  }
});

// 4. Get My History (Now Protected)
app.get('/api/my-history/:simulationId', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { simulationId } = req.params;
    
    console.log('Fetching history for userId:', userId, 'simulationId:', simulationId);
    
    try {
        const history = await prisma.simulationState.findMany({
            where: {
                userId: parseInt(userId),
                simulationId: parseInt(simulationId)
            },
            orderBy: { createdAt: 'desc' }
        });
        console.log('Found history items:', history.length);
        res.json(history);
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ error: "Failed to fetch history" });
    }
});

// 5. Delete Experiment (Protected)
app.delete('/api/experiments/:experimentId', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { experimentId } = req.params;
    
    try {
        // Verify the experiment belongs to the user
        const experiment = await prisma.simulationState.findFirst({
            where: {
                id: parseInt(experimentId),
                userId: parseInt(userId)
            }
        });
        
        if (!experiment) {
            return res.status(404).json({ error: "Experiment not found or access denied" });
        }
        
        await prisma.simulationState.delete({
            where: { id: parseInt(experimentId) }
        });
        
        res.json({ message: "Experiment deleted successfully" });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: "Failed to delete experiment" });
    }
});

app.listen(PORT, () => {
  console.log(`Virtual Lab Backend running on port ${PORT}`);
});