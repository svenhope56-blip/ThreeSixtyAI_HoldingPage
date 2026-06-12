const express = require('express');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Path to data file
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'registrations.json');

// Ensure data directory and file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf8');
}

// Security headers using Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
    },
  },
}));

// Parse JSON bodies
app.use(express.json());

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Rate Limiter for registration endpoint
// Max 5 registrations per 15 minutes per IP to prevent spam
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: 'Too many registration attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Simple lock mechanism to prevent concurrent write issues
let isWriting = false;
const writeQueue = [];

function processWriteQueue() {
  if (isWriting || writeQueue.length === 0) return;
  isWriting = true;

  const { data, resolve, reject } = writeQueue.shift();
  const tempFile = `${DATA_FILE}.tmp`;

  fs.writeFile(tempFile, JSON.stringify(data, null, 2), 'utf8', (err) => {
    if (err) {
      isWriting = false;
      reject(err);
      processWriteQueue();
      return;
    }

    fs.rename(tempFile, DATA_FILE, (renameErr) => {
      isWriting = false;
      if (renameErr) {
        reject(renameErr);
      } else {
        resolve();
      }
      processWriteQueue();
    });
  });
}

function saveRegistration(newRegistration) {
  return new Promise((resolve, reject) => {
    fs.readFile(DATA_FILE, 'utf8', (err, content) => {
      let registrations = [];
      if (!err && content) {
        try {
          registrations = JSON.parse(content);
        } catch (parseErr) {
          registrations = [];
        }
      }

      // Check if email already exists
      const duplicate = registrations.some(
        (reg) => reg.email.toLowerCase() === newRegistration.email.toLowerCase()
      );

      if (duplicate) {
        return reject(new Error('Email is already registered.'));
      }

      // Add timestamp
      newRegistration.registeredAt = new Date().toISOString();
      registrations.push(newRegistration);

      // Add to write queue
      writeQueue.push({ data: registrations, resolve, reject });
      processWriteQueue();
    });
  });
}

// POST endpoint for registration
app.post('/api/register', registerLimiter, async (req, res) => {
  try {
    let { name, company, role, email } = req.body;

    // Clean inputs
    name = (name || '').trim();
    company = (company || '').trim();
    role = (role || '').trim();
    email = (email || '').trim();

    // Validation
    if (!name || name.length < 2 || name.length > 100) {
      return res.status(400).json({ error: 'Name must be between 2 and 100 characters.' });
    }
    if (!company || company.length < 2 || company.length > 100) {
      return res.status(400).json({ error: 'Company must be between 2 and 100 characters.' });
    }
    if (!role || role.length < 2 || role.length > 100) {
      return res.status(400).json({ error: 'Role/Job title must be between 2 and 100 characters.' });
    }

    // Simple email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || email.length > 254 || !emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    // Save registration securely
    await saveRegistration({ name, company, role, email });

    return res.status(200).json({ message: 'Successfully registered interest.' });
  } catch (error) {
    if (error.message === 'Email is already registered.') {
      return res.status(409).json({ error: error.message });
    }
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'An internal server error occurred. Please try again later.' });
  }
});

// Fallback to index.html for any other requests (SPA friendly)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`ThreeSixtyAI Holding Server running on port ${PORT}`);
});
