# RC Spot Finder

A mobile-friendly web application for discovering and sharing RC car, truck, boat, and crawler spots.

**Live at: [rcspotfinder.com](https://rcspotfinder.com)**

## Features

### Core Features
- **Interactive Map** - Leaflet-based map with OpenStreetMap and satellite view toggle
- **Multiple Classifications** - Bash spots, race tracks, crawl areas, hobby shops, air fields, and boat spots
- **Natural Language Search** - Search using phrases like "bash spots in portland, or" or "hobby shops phoenix, az"
- **Place Geocoding** - Automatically zooms to specific locations when searching by city/state
- **Nearest Hobby Shop** - Associate RC spots with their nearest hobby shop (clickable link to view shop details)
- **Get Directions** - One-tap directions to any spot via Google Maps
- **Auto-Detect Region** - Regions automatically assigned based on coordinates
- **Image Upload** - Add photos with automatic optimization via Cloudinary
- **Mobile Responsive** - Swipeable bottom sheet on mobile, collapsible sidebar on desktop
- **Draggable Markers** - Precisely position locations by dragging the map marker

### User Accounts & Authentication
- **Google OAuth** - Sign in with your Google account via NextAuth.js
- **User Ownership** - Only you can edit or delete spots you've created
- **My Spots Filter** - Quickly view only the spots you've added

### Community Voting
- **Thumbs Up/Down** - Community voting system to surface the best spots
- **Vote Sorting** - Sort spots by community votes to find top-rated locations
- **Real-time Updates** - Vote counts update instantly

### Personalization
- **Default Region** - Set your preferred region to auto-load on every visit
- **Persistent Preferences** - Saved in database for logged-in users, localStorage for guests

### Sharing
- **Share Spots** - Share any spot with a direct link
- **Native iOS Share Sheet** - Uses the native share menu on iOS devices
- **Clipboard Fallback** - Copies link to clipboard on desktop browsers
- **Deep Linking** - Shared links open directly to the spot details

## Tech Stack

- **Framework:** Next.js 15 with App Router (TypeScript)
- **Authentication:** NextAuth.js v5 with Google OAuth
- **Maps:** Leaflet + react-leaflet + OpenStreetMap/Esri satellite tiles
- **Database:** PostgreSQL (Neon) with Prisma ORM
- **Image Storage:** Cloudinary with automatic optimization
- **Styling:** Tailwind CSS
- **Geocoding:** OpenStreetMap Nominatim
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database (or Neon account)
- Google Cloud Console project (for OAuth)
- Cloudinary account (for image uploads)

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

3. Set up environment variables (copy `.env.example` to `.env.local`):
   ```env
   # Database
   POSTGRES_PRISMA_URL="postgresql://..."
   POSTGRES_URL_NON_POOLING="postgresql://..."

   # NextAuth.js
   NEXTAUTH_SECRET=<run: openssl rand -base64 32>
   NEXTAUTH_URL=http://localhost:3000

   # Google OAuth
   GOOGLE_CLIENT_ID="<from-google-cloud-console>"
   GOOGLE_CLIENT_SECRET="<from-google-cloud-console>"

   # Cloudinary
   CLOUDINARY_CLOUD_NAME="<your-cloud-name>"
   CLOUDINARY_API_KEY="<your-api-key>"
   CLOUDINARY_API_SECRET="<your-api-secret>"
   ```

4. Set up the database:
   ```bash
   npx prisma db push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Adding a Spot

1. Sign in with Google
2. Click anywhere on the map to drop a pin
3. Drag the purple marker to adjust the exact location
4. Fill in the details (name, classification, description, etc.)
5. Optionally upload an image and select the nearest hobby shop
6. Click "Add Location"

### Searching

Use natural language to search:
- `bash spots portland, or` - Find bash spots near Portland, Oregon
- `race tracks in california` - Find race tracks in California
- `hobby shops phoenix, az` - Find hobby shops near Phoenix, Arizona
- `top voted crawl areas` - Find highest-rated crawl areas

### Setting a Default Region

1. Open the Filters panel
2. Select your preferred region
3. Click "Set as Default"
4. The map will load centered on this region every time you visit

### Getting Directions

1. Open any spot's details
2. Click the small map icon next to the coordinates
3. Opens Google Maps with directions to the spot
4. Works on mobile (opens Maps app) and desktop (opens in browser)

### Sharing a Spot

1. Open any spot's details
2. Click the "Share" button
3. On iOS: Native share sheet appears
4. On Desktop: Link copied to clipboard

### Classifications

| Type | Color | Description |
|------|-------|-------------|
| Bash Spot | Red | Open areas for bashing RC cars |
| Race Track | Blue | Dedicated RC race tracks |
| Crawl Area | Green | Rock crawling terrain |
| Hobby Shop | Orange | RC hobby stores |
| Air Field | Purple | RC airplane flying fields |
| Boat Spot | Cyan | RC boat locations |

## Project Structure

```
rc-spot-finder/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/  # NextAuth.js route
│   │   ├── locations/           # Location CRUD endpoints
│   │   ├── upload/              # Cloudinary image upload
│   │   ├── vote/                # Voting endpoint
│   │   └── user/preferences/    # User preferences
│   ├── layout.tsx
│   ├── page.tsx                 # Main map view
│   └── globals.css
├── components/
│   ├── Map.tsx                  # Main map component
│   ├── LocationMarker.tsx       # Custom map markers
│   ├── LocationForm.tsx         # Add/edit form
│   ├── LocationCard.tsx         # Location details + share
│   ├── FilterPanel.tsx          # Filter controls
│   ├── SearchBox.tsx            # Search input
│   ├── AuthButton.tsx           # Google sign in/out
│   └── VoteButtons.tsx          # Thumbs up/down voting
├── lib/
│   ├── prisma.ts                # Prisma client
│   ├── types.ts                 # TypeScript types
│   ├── searchParser.ts          # Natural language search
│   └── geocode.ts               # Place geocoding
├── prisma/
│   └── schema.prisma            # Database schema
└── auth.ts                      # NextAuth.js configuration
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to [vercel.com/new](https://vercel.com/new)
3. Add environment variables in Vercel dashboard:
   - Database credentials
   - `NEXTAUTH_SECRET` and `NEXTAUTH_URL`
   - Google OAuth credentials
   - Cloudinary credentials
4. Deploy

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create or select a project
3. Go to "APIs & Services" > "Credentials"
4. Create OAuth Client ID (Web application)
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://rcspotfinder.com/api/auth/callback/google`

### Cloudinary Setup

1. Create account at [cloudinary.com](https://cloudinary.com)
2. Go to Settings > API Keys
3. Copy Cloud Name, API Key, and API Secret

## License

MIT
