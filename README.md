# Birgittes Briks Website

Et Node.js website for Birgittes Briks - Klinik for kropsterapi i Danmark.

## Beskrivelse

Dette er en responsiv website byggnet med Node.js og Express.js for Birgittes Briks, en dansk klinik der tilbyder kropsterapi og holistiske behandlinger. Websitet præsenterer klinikkens tjenester, priser og kontaktinformation på dansk.

## Features

- **Responsiv design** - Fungerer på både mobile og desktop enheder
- **Smooth scrolling navigation** - Header-knapper fører til forskellige sektioner på siden
- **Dansk indhold** - Alt tekst er på dansk som anmodet
- **Grøn/grå farvetema** - Matcher det ønskede sundhedsæstetik
- **Express.js server** - Hurtig og pålidelig webserver

## Installation

1. Klon eller download projektet
2. Åbn terminalen i projektmappen
3. Installer dependencies:
   ```bash
   npm install
   ```

## Kørsel

For at starte serveren:

```bash
npm start
```

For udvikling med auto-restart:

```bash
npm run dev
```

Serveren vil køre på `http://localhost:3000`

## Projektstruktur

```
birgittesbriks/
├── .github/
│   └── copilot-instructions.md
├── public/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── script.js
│   ├── images/
│   │   └── (billeder skal placeres her)
│   └── index.html
├── server.js
├── package.json
└── README.md
```

## Billeder

Følgende billeder er allerede indsat i `public/images/` mappen:

- `Diamond-Beach-e16044072834091.jpg` - Baggrundsbillede til hero sektion
- `profil.jpg` - Portræt af Birgitte
- `behandling.jpg` - Billede af behandlingsrummet
- `behandling mand.jpg` - Billede af behandling med hænder
- `drink.jpg` - Billede af glas vand med mynte
- `logo.png` - Klinikkens logo

## Teknologier

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **HTML5** - Markup
- **CSS3** - Styling med Flexbox og Grid
- **JavaScript** - Smooth scrolling navigation

## Browser Support

Websitet understøtter alle moderne browsere:
- Chrome
- Firefox 
- Safari
- Edge

## Licens

Privat projekt for Birgittes Briks.