window.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const film = urlParams.get("film");

  if (!film) {
    alert("Missing film code in URL.");
    return;
  }

  fetch(`/api/movie?film=${film}`)
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        document.getElementById("movie-title").textContent = "Movie not found.";
        return;
      }

      // Set page title and heading
      document.title = `${data.title} – Rancid Tomatoes`;
      document.getElementById("movie-title").textContent = `${data.title} (${data.year})`;

      // Rating
      document.getElementById("movie-score").textContent = `${data.score}%`;
      document.getElementById("rating-icon").src = data.score >= 60 ? "/images/freshbig.png" : "/images/rottenbig.png";

      // Poster fallback: .jpg → .png → overview.png → default
      const poster = document.getElementById("poster");
      function tryPoster(paths) {
        if (!paths.length) {
          poster.src = "/images/missing.png"; // fallback
          return;
        }
        const next = paths.shift();
        poster.onerror = () => tryPoster(paths);
        poster.src = next;
      }
      tryPoster([
        `/${film}/poster.jpg`,
        `/${film}/poster.png`,
        `/${film}/overview.png`
      ]);

      // Sidebar attributes
      const attrContainer = document.getElementById("movie-details");
      attrContainer.innerHTML = "";

      data.attributes.forEach(attr => {
        const dt = document.createElement("dt");
        dt.textContent = `${attr.label.toUpperCase()}:`;

        const dd = document.createElement("dd");

        if (Array.isArray(attr.value)) {
          const ul = document.createElement("ul");
          ul.className = "starring-list";
          attr.value.forEach(val => {
            const li = document.createElement("li");
            li.textContent = val;
            ul.appendChild(li);
          });
          dd.appendChild(ul);
        } else {
          dd.textContent = attr.value;
        }

        attrContainer.appendChild(dt);
        attrContainer.appendChild(dd);
      });

      // External links
      const linkDT = document.createElement("dt");
      linkDT.textContent = "EXTERNAL LINKS:";
      const linkDD = document.createElement("dd");
      linkDD.innerHTML = `
        <a href="${data.links.official}" target="_blank">Official Site</a><br>
        <a href="${data.links.rt}" target="_blank">RT Review</a><br>
        <a href="${data.links.imdb}" target="_blank">IMDB Home</a>
      `;
      attrContainer.appendChild(linkDT);
      attrContainer.appendChild(linkDD);

      // Reviews
      const reviewSection = document.getElementById("reviews");
      const reviewFooter = document.getElementById("review-footer");
      reviewSection.innerHTML = "";

      if (data.reviews && data.reviews.length > 0) {
        for (let i = 0; i < data.reviews.length; i += 2) {
          const row = document.createElement("div");
          row.className = "review-row";

          [data.reviews[i], data.reviews[i + 1]].forEach(review => {
            if (review) {
              const container = document.createElement("div");
              container.className = "review-container";

              const reviewDiv = document.createElement("div");
              reviewDiv.className = "review";

              const icon = document.createElement("img");
              icon.className = "icon";
              icon.src = data.score >= 60 ? "/fresh.gif" : "/rotten.gif";
              icon.alt = "Review Type Icon";

              const quote = document.createElement("blockquote");
              quote.textContent = `"${review.comment}"`;

              reviewDiv.appendChild(icon);
              reviewDiv.appendChild(quote);

              const criticDiv = document.createElement("div");
              criticDiv.className = "critic-info-centered";

              const criticIcon = document.createElement("img");
              criticIcon.src = "/critic.gif";
              criticIcon.alt = "Critic Icon";
              criticIcon.className = "critic-icon-vertical";

              const criticText = document.createElement("div");
              criticText.className = "critic-text";
              criticText.innerHTML = `<strong>${review.critic}</strong><br>${review.publication}`;

              criticDiv.appendChild(criticIcon);
              criticDiv.appendChild(criticText);

              container.appendChild(reviewDiv);
              container.appendChild(criticDiv);
              row.appendChild(container);
            }
          });

          reviewSection.appendChild(row);
        }

        reviewFooter.textContent = `(1–${data.reviews.length}) of ${data.reviews.length}`;
      } else {
        reviewSection.innerHTML = "<p>No reviews available.</p>";
        reviewFooter.textContent = "";
      }
    })
    .catch(err => {
      console.error("Error fetching movie data:", err);
      document.getElementById("movie-title").textContent = "Failed to load movie.";
    });
});
