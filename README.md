# AutoBrief.AI 🚀

A powerful B2B SaaS application that automatically generates comprehensive summaries from documents, audio, and video files using AI.

## ✨ Features

- **📄 PDF Processing**: Extract and summarize text from PDF documents
- **📝 DOCX Support**: Process Microsoft Word documents
- **🎵 Audio Transcription**: Convert MP3 and WAV files to text using OpenAI Whisper
- **🎥 Video Analysis**: Extract audio and transcribe from MP4 videos
- **🤖 AI Summarization**: Generate executive summaries, key points, and action items using GPT-4
- **💾 Cloud Storage**: Secure file storage with Supabase
- **🔐 Authentication**: Web3 wallet integration
- **💳 Payment Processing**: Stripe integration for subscriptions

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **AI/ML**: OpenAI GPT-4, Whisper API
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Authentication**: Web3 Wallets (Phantom, etc.)
- **Payments**: Stripe
- **Deployment**: Netlify

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- OpenAI API key
- Stripe account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Jinanalyst/autobriefai.git
   cd autobriefai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   OPENAI_API_KEY=your_openai_api_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Run the SQL schema from `database/schema.sql`
   - Create a storage bucket named 'uploads'
   - Set up Row Level Security (RLS) policies

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
autobriefai/
├── app/                    # Next.js 14 app directory
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # UI components
│   └── blocks/           # Page blocks
├── lib/                  # Utility libraries
├── database/             # Database schema
├── supabase/             # Supabase functions
└── utils/                # Utility functions
```

## 🔧 API Endpoints

- `POST /api/upload` - Upload and process files
- `GET /api/results/[id]` - Get summary results
- `POST /api/chat` - AI chat interface
- `POST /api/verify-payment` - Payment verification

## 📦 Supported File Types

- **Documents**: PDF, DOCX
- **Audio**: MP3, WAV  
- **Video**: MP4

## 🌐 Deployment

### Netlify Deployment

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variables in Netlify dashboard
5. Deploy!

### Environment Variables for Production

Make sure to set these in your deployment platform:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/Jinanalyst/autobriefai/issues) page
2. Create a new issue with detailed information
3. Contact the development team

## 🚀 Roadmap

- [ ] Real-time collaboration features
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Mobile app development
- [ ] Enterprise SSO integration
- [ ] Advanced AI models integration

---

**Built with ❤️ by the AutoBrief.AI team** 