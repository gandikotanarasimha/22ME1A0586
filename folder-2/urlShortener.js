// middleware/urlShortener.js
const { v4: uuidv4 } = require('uuid');

// Temporary in-memory store
const urlDatabase = {};

exports.shortenUrl = (req, res) => {
    const { longUrl } = req.body;

    if (!longUrl) {
        return res.status(400).json({ error: 'Missing longUrl' });
    }

    const shortId = uuidv4().slice(0, 6); // Short 6-character ID
    const shortUrl = `http://localhost:3000/${shortId}`;

    urlDatabase[shortId] = longUrl;

    res.status(201).json({ shortUrl, longUrl });
};

exports.redirectToOriginal = (req, res) => {
    const shortId = req.params.shortId;
    const longUrl = urlDatabase[shortId];

    if (longUrl) {
        res.redirect(longUrl);
    } else {
        res.status(404).json({ error: 'Short URL not found' });
    }
};
