# RC Spot Finder

A mobile-friendly web application for discovering and sharing RC car, truck, and crawler spots.

## Features

- **Interactive Map** - Leaflet-based map with OpenStreetMap and satellite view toggle
- **Multiple Classifications** - Bash spots, race tracks, crawl areas, hobby shops, and air fields
- **Natural Language Search** - Search using phrases like "bash spots in portland, or" or "hobby shops phoenix, az"
- **Place Geocoding** - Automatically zooms to specific locations when searching by city/state
- **US State Support** - All 50 state abbreviations mapped to regions
- **Nearest Hobby Shop** - Associate RC spots with their nearest hobby shop
- **Star Ratings** - 1-5 star rating system for locations
- **Image Upload** - Add photos to locations
- **Mobile Responsive** - Swipeable bottom sheet on mobile, sidebar on desktop
- **Draggable Markers** - Precisely position locations by dragging the map marker

## Tech Stack

- **Framework:** Next.js 16 with App Router (TypeScript)
- **Maps:** Leaflet + react-leaflet + OpenStreetMap/Esri satellite tiles
- **Database:** SQLite with Prisma ORM
- **Styling:** Tailwind CSS
- **Geocoding:** OpenStreetMap Nominatim

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/lewishowell/rc-spot-finder.git
   cd rc-spot-finder
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:
   ```bash
   npx prisma db push
   ```

4. (Optional) Seed with sample data:
   ```bash
   npx prisma db seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Adding a Spot

1. Click anywhere on the map to drop a pin
2. Drag the purple marker to adjust the exact location
3. Fill in the details (name, classification, rating, etc.)
4. Optionally select the nearest hobby shop
5. Click "Add Location"

### Searching

Use natural language to search:
- `bash spots portland, or` - Find bash spots near Portland, Oregon
- `race tracks in california` - Find race tracks in California
- `hobby shops phoenix, az` - Find hobby shops near Phoenix, Arizona
- `5 star crawl areas` - Find top-rated crawl areas

### Classifications

| Type | Color | Description |
|------|-------|-------------|
| Bash Spot | Red | Open areas for bashing RC cars |
| Race Track | Blue | Dedicated RC race tracks |
| Crawl Area | Green | Rock crawling terrain |
| Hobby Shop | Orange | RC hobby stores |
| Air Field | Purple | RC airplane flying fields |

## Project Structure

```
rc-spot-finder/
├── app/
│   ├── api/
│   │   ├── locations/     # Location CRUD endpoints
│   │   └── upload/        # Image upload endpoint
│   ├── layout.tsx
│   ├── page.tsx           # Main map view
│   └── globals.css
├── components/
│   ├── Map.tsx            # Main map component
│   ├── LocationMarker.tsx # Custom map markers
│   ├── LocationForm.tsx   # Add/edit form
│   ├── LocationCard.tsx   # Location details
│   ├── FilterPanel.tsx    # Filter controls
│   ├── SearchBox.tsx      # Search input
│   └── RatingStars.tsx    # Star rating component
├── lib/
│   ├── prisma.ts          # Prisma client
│   ├── types.ts           # TypeScript types
│   ├── searchParser.ts    # Natural language search
│   └── geocode.ts         # Place geocoding
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Sample data
└── public/
    └── uploads/           # Uploaded images
```

## Deployment

### Vercel with Vercel Postgres

1. Push to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) and import your repository
3. Before deploying, go to the **Storage** tab and create a new **Postgres** database
4. Connect the database to your project - this automatically sets the environment variables
5. Deploy the project
6. After deployment, run database migration from the Vercel dashboard or locally:
   ```bash
   npx prisma db push
   ```

### Local Development with Vercel Postgres

1. Install Vercel CLI: `npm i -g vercel`
2. Link your project: `vercel link`
3. Pull environment variables: `vercel env pull .env.local`
4. Run migrations: `npx prisma db push`
5. Start dev server: `npm run dev`

## License

MIT
