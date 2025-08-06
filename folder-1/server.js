const express = require('express');
const { v4: uuidv4 } = require('uuid');
const app = express();

// In-memory storage
const urlDatabase = {};

app.use(express.json());

// Create Short URL (POST /shorturls)
app.post('/shorturls', (req, res) => {
  const { url, validity = 30, shortcode } = req.body;
  
  // Validate URL format
  try {
    new URL(url);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  // Generate or validate shortcode
  const finalShortcode = shortcode || uuidv4().substr(0, 6);
  if (!/^[a-zA-Z0-9_-]{4,20}$/.test(finalShortcode)) {
    return res.status(400).json({ error: 'Shortcode must be 4-20 alphanumeric characters' });
  }
  if (urlDatabase[finalShortcode]) {
    return res.status(409).json({ error: 'Shortcode already in use' });
  }

  // Store URL with expiration
  const expiresAt = new Date(Date.now() + validity * 60000);
  urlDatabase[finalShortcode] = {
    originalUrl: url,
    createdAt: new Date(),
    expiresAt,
    clicks: 0
  };

  res.status(201).json({
    shortUrl: `http://${req.headers.host}/${finalShortcode}`,
    expiresAt: expiresAt.toISOString()
  });
});

// Redirect (GET /:shortcode)
app.get('/:shortcode', (req, res) => {
  const { shortcode } = req.params;
  const urlData = urlDatabase[shortcode];

  if (!urlData) return res.status(404).json({ error: 'Short URL not found' });
  if (new Date() > urlData.expiresAt) return res.status(410).json({ error: 'URL expired' });

  urlData.clicks++;
  res.redirect(urlData.originalUrl);
});

// Get Stats (GET /:shortcode/stats)
app.get('/:shortcode/stats', (req, res) => {
  const { shortcode } = req.params;
  const urlData = urlDatabase[shortcode] || {};
  
  res.json({
    originalUrl: urlData.originalUrl,
    shortcode,
    clicks: urlData.clicks || 0,
    createdAt: urlData.createdAt?.toISOString(),
    expiresAt: urlData.expiresAt?.toISOString(),
    isActive: new Date() < (urlData.expiresAt || 0)
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API Endpoint: POST http://localhost:${PORT}/shorturls`);
});