# Control Room Plus

A modern personal management application built with Next.js and TypeScript, designed to help users organize various aspects of their life in one place.

## Features

### 📔 Personal Diary
- Write and manage daily entries
- Record thoughts and experiences
- Private and secure journaling

### 💰 Finance Manager
- Track income and expenses
- Manage personal budget
- View financial reports and analytics
- Monitor spending patterns

### 📝 Therapy Notes
- Keep track of thoughts and feelings
- Document therapy sessions
- Store important information for discussion
- Track progress over time

### 🎥 Media Collection Manager
- Movies Collection
  - Browse your movie library
  - View detailed movie information
  - Monitor storage usage

- TV Shows Collection
  - Manage TV series collection
  - Track episodes and seasons
  - View show details
  - Monitor storage usage

## Technology Stack

- **Frontend & Backend**: Next.js 14 with TypeScript
- **Authentication**: Built-in authentication system
- **Database**: MongoDB
- **Styling**: Tailwind CSS
- **Media Management**: Integration with Plex Media Server

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB instance
- Plex Media Server (for media features)

### Installation

1. Clone the repository:

```bash 
git clone https://github.com/FrankMike/controlroomplus.git
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with the following variables:

```env
MONGODB_URI=your_mongodb_connection_string
PLEX_TOKEN=your_plex_token
PLEX_URL=your_plex_server_url
```

4. Run the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Security

- All user data is private and secured
- Authentication required for accessing personal features
- Session-based security

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with Next.js
- Styled with Tailwind CSS
- Media management powered by Plex