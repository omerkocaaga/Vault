# Vault - Bookmark Manager

A modern bookmark manager built with Next.js and Supabase, allowing you to save, organize, and manage your bookmarks with metadata extraction.

## Features

- Save URLs with automatic metadata extraction (title, description, images)
- Import bookmarks from CSV files
- Tag-based organization
- Responsive design
- Secure authentication
- Real-time updates

## Tech Stack

- Next.js 15
- React 19
- Supabase (Authentication & Database)
- Tailwind CSS
- PapaParse (CSV parsing)

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/vault.git
   cd vault
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   Create a `.env.local` file with the following variables:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application uses the following Supabase tables:

### saves

- id (UUID, primary key)
- user_id (UUID, foreign key to auth.users)
- url (TEXT)
- title (TEXT)
- description (TEXT)
- og_image_url (TEXT)
- favicon_url (TEXT)
- time_added (BIGINT)
- tags (TEXT[])
- status (TEXT)
- domain (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

## License

MIT
