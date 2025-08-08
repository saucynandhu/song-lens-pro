
# 🎵 Song Lens - Music Discovery Web App

Song Lens is a sleek web app that lets you discover songs similar to any YouTube music video URL you provide. Powered by the YouTube Data API and Last.fm API, it extracts song metadata from YouTube and finds similar tracks using Last.fm’s rich music database.

---

## 🚀 Features

- Paste a YouTube song URL and get a list of similar songs.
- Fetches video metadata (title, channel, thumbnail) from YouTube.
- Uses Last.fm to find similar tracks and artists.
- Displays song recommendations with cover art and clickable links.
- Responsive, modern UI with dark theme and smooth animations.
- Easy to extend with additional music APIs or features.

---

## 🔧 Tech Stack

- Frontend: HTML, CSS, JavaScript (Vite-based)
- Backend: Node.js with Express (or serverless functions) to securely handle API keys and API calls
- APIs:
  - [YouTube Data API v3](https://developers.google.com/youtube/v3)
  - [Last.fm API](https://www.last.fm/api)

---
You can use it here : [song lens](https://song-lens-pro.vercel.app/)
---

## 🔑 Getting API Keys

* **YouTube Data API:**

  * Go to [Google Cloud Console](https://console.cloud.google.com/).
  * Create a project and enable **YouTube Data API v3**.
  * Create API credentials (API key).
  * Restrict the key to your domain or localhost for security.

* **Last.fm API:**

  * Sign up at [Last.fm API](https://www.last.fm/api/account/create).
  * Create an API key for your app.
  * No OAuth required, just use the key.

---

## 🛠 How It Works

1. User enters a YouTube music video URL.
2. Backend extracts video ID and calls YouTube API to get video metadata.
3. Backend searches Last.fm for matching track info using video title & artist.
4. Backend fetches similar tracks from Last.fm’s `track.getSimilar` endpoint.
5. Backend returns structured data with similar songs.
6. Frontend displays recommendations with cover art and links.

---

## 📈 Future Improvements

* Add user accounts and favorites using Supabase or Firebase.
* Use Spotify API to enrich recommendations and audio features.
* Implement audio analysis from uploaded music files.
* Add collaborative filtering or ML-based personalized recommendations.
* Deploy as a serverless app with secure environment variables.

---

## 🙌 Contribution

Feel free to open issues or submit pull requests to improve the app!

---

## 📄 License

MIT License © 2025 nandhu

---

**Built with ❤️ by nandhu**

