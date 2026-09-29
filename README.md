# ViliQuiz — Vercel + GitHub

Tämä versio on tehty Vercel-deployta varten. Et tarvitse Linuxia tai `npm start` -palvelinta Vercelin julkaisemiseen.

## GitHub → Vercel
1. Pura ZIP.
2. Luo GitHubiin uusi repository.
3. Lataa KAIKKI tämän kansion tiedostot ja kansiot repositoryn juureen.
4. Vercel → Add New → Project → valitse GitHub repository.
5. Framework Preset: Other.
6. Build Command: jätä tyhjäksi.
7. Output Directory: jätä tyhjäksi.
8. Deploy.

Etusivu on `public/index.html` ja API on `api/index.js`.

Admin-salasana kehitysversiossa: `blooket123`.

## Tärkeä huomio
Tämä versio käyttää palvelimettomia API-reittejä, joten se ei tarvitse WebSocket-palvelinta. Demo-tiedot ovat palvelimen muistissa ja voivat nollautua Vercelin funktioiden uudelleenkäynnistyessä. Oikeaa tuotantoversiota varten käyttäjät, pelit ja tavarat kannattaa tallentaa tietokantaan ja salasanat hashata.
