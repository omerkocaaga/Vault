# Vault - Bookmark Manager

A full-stack web application for saving and organizing bookmarks, built with Next.js, Tailwind CSS, and Supabase.

## Features

- Email/password authentication
- Save URLs with automatic metadata fetching
- Import bookmarks from Pocket CSV exports
- Archive and delete saved items
- Infinite scroll pagination
- Responsive design

## Tech Stack

- Next.js (App Router)
- Tailwind CSS
- Supabase (Auth & Database)
- PapaParse (CSV parsing)

## Prerequisites

- Node.js 18+ and npm
- Supabase account

## Setup

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd vault
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a Supabase project and set up the database:

   - Create a new project in Supabase
   - Create a new table called `saves` with the following schema:
     ```sql
     create table saves (
       id uuid default uuid_generate_v4() primary key,
       user_id uuid references auth.users not null,
       url text not null,
       domain text,
       title text,
       description text,
       tags text[] default '{}',
       og_image_url text,
       favicon_url text,
       fetch_failed boolean default false,
       archived boolean default false,
       created_at timestamp with time zone default timezone('utc'::text, now()) not null
     );
     ```
   - Enable Row Level Security (RLS) and create policies:

     ```sql
     alter table saves enable row level security;

     create policy "Users can view their own saves"
       on saves for select
       using (auth.uid() = user_id);

     create policy "Users can insert their own saves"
       on saves for insert
       with check (auth.uid() = user_id);

     create policy "Users can update their own saves"
       on saves for update
       using (auth.uid() = user_id);

     create policy "Users can delete their own saves"
       on saves for delete
       using (auth.uid() = user_id);
     ```

4. Create a `.env.local` file in the root directory with your Supabase credentials:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Sign up for an account or log in
2. Save URLs by entering them in the form
3. Import bookmarks from a Pocket CSV export
4. View, archive, and delete your saved items
5. Access archived items in the archive page

## License

MIT
