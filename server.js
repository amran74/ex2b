/* 
  amran hamam 212132096
  nagham hasan 214035891
  fatma tabash 325469971 
*/



const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Serve public folder
app.use(express.static(path.join(__dirname, 'public')));

// Dynamically serve folders that contain a poster image
fs.readdirSync(__dirname).forEach(folder => {
  const folderPath = path.join(__dirname, folder);
  if (fs.statSync(folderPath).isDirectory()) {
    const hasPoster =
      fs.existsSync(path.join(folderPath, 'poster.jpg')) ||
      fs.existsSync(path.join(folderPath, 'poster.png'));
    if (hasPoster) {
      app.use(`/${folder}`, express.static(folderPath));
    }
  }
});

// Connect to SQLite
const db = new sqlite3.Database('./rtfilms.db', sqlite3.OPEN_READONLY, err => {
  if (err) {
    console.error("❌ Failed to connect to database:", err.message);
  } else {
    console.log("✅ Connected to rtfilms.db");
  }
});

// API: Movie info
app.get('/api/movie', (req, res) => {
  const filmCode = req.query.film;
  if (!filmCode) return res.status(400).json({ error: "Missing film code" });

  const movieQuery = `SELECT Title, Year, Score FROM Films WHERE FilmCode = ?`;

  db.get(movieQuery, [filmCode], (err, movie) => {
    if (err || !movie) return res.status(404).json({ error: "Movie not found" });

    const movieData = {
      title: movie.Title,
      year: movie.Year,
      score: movie.Score,
      poster: `/${filmCode}/poster.jpg`,
      attributes: [],
      links: { official: "#", rt: "#", imdb: "#" },
      reviews: []
    };

    const detailsQuery = `SELECT Attribute, Value FROM FilmDetails WHERE FilmCode = ?`;

    db.all(detailsQuery, [filmCode], (err, details) => {
      if (err) return res.status(500).json({ error: "Error fetching details" });

      details.forEach(({ Attribute, Value }) => {
        const attr = Attribute.toLowerCase();
        if (attr === "links") {
          const parts = Value.split(', ');
          parts.forEach(link => {
            if (link.startsWith('IMDB:')) movieData.links.imdb = link.replace('IMDB: ', '');
            else if (link.startsWith('RT:')) movieData.links.rt = link.replace('RT: ', '');
            else movieData.links.official = link;
          });
        } else if (attr === "starring") {
          movieData.attributes.push({ label: Attribute, value: Value.split(', ') });
        } else {
          movieData.attributes.push({ label: Attribute, value: Value });
        }
      });

      const reviewsQuery = `
        SELECT ReviewerName AS critic, Affiliation AS publication, ReviewText AS comment
        FROM Reviews
        WHERE FilmCode = ?
      `;

      db.all(reviewsQuery, [filmCode], (err, reviews) => {
        if (err) return res.status(500).json({ error: "Error fetching reviews" });

        movieData.reviews = reviews;
        res.json(movieData);
      });
    });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
