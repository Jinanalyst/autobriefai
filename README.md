# AutoBrief.AI - AI-Powered Meeting & Document Summarization

AutoBrief.AI is a B2B SaaS application that provides AI-powered meeting and document summarization for teams. The application uses OpenAI's GPT-4o to analyze uploaded files and generate comprehensive summaries with key points and action items.

## Features

- **File Upload**: Support for MP3, MP4, WAV, PDF, and DOCX files
- **AI Summarization**: Powered by OpenAI GPT-4o for intelligent content analysis
- **Key Points Extraction**: Automatically identifies and lists key discussion points
- **Action Items**: Generates actionable tasks from the content
- **PDF Export**: Download summaries as professional PDF reports
- **Database Storage**: Secure storage using Supabase
- **Modern UI**: Clean, professional interface built with Next.js and Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Supabase Storage
- **AI**: OpenAI GPT-4o & Whisper API
- **PDF Generation**: jsPDF, html2canvas
- **UI Components**: Lucide React icons
- **Notifications**: React Hot Toast

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- OpenAI API key

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd autobrief-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Create a new table called `summaries` with the following schema:
   ```sql
   CREATE TABLE summaries (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     file_name TEXT NOT NULL,
     file_type TEXT NOT NULL,
     file_url TEXT NOT NULL,
     summary TEXT,
     key_points TEXT[],
     action_items TEXT[],
     status TEXT DEFAULT 'processing',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```
   - Create a storage bucket called `uploads` with public access
   - Update the RLS policies as needed

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
autobrief-ai/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Homepage
│   └── results/[id]/      # Results page
├── components/            # React components
│   ├── FileUpload.tsx     # File upload component
│   └── Header.tsx         # Header component
├── lib/                   # Utility libraries
│   ├── openai.ts          # OpenAI integration
│   └── supabase.ts        # Supabase client
├── utils/                 # Utility functions
│   └── pdfGenerator.ts    # PDF generation
└── public/                # Static assets
```

## API Routes

- `POST /api/upload` - Upload and process files
- `GET /api/results/[id]` - Fetch summary results

## File Processing

The application supports the following file types:

- **Audio Files** (MP3, WAV): Transcribed using OpenAI Whisper API
- **Video Files** (MP4): Audio extracted and transcribed
- **PDF Files**: Text extracted using PDF parsing
- **DOCX Files**: Text extracted using DOCX parsing

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |
| `OPENAI_API_KEY` | Your OpenAI API key | Yes |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@autobrief.ai or create an issue in the repository.

## Roadmap

- [ ] User authentication and accounts
- [ ] Team collaboration features
- [ ] Advanced file processing (PowerPoint, Excel)
- [ ] Custom summary templates
- [ ] API for third-party integrations
- [ ] Mobile app
- [ ] Advanced analytics and insights 