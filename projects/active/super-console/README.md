# Claude Super Console

A web-based console interface for Claude Code on Appwrite. Provides a full-featured terminal, file explorer, and real-time command execution through an elegant web interface.

## ✨ Features

- **Terminal Interface**: Full xterm.js terminal with command history and syntax highlighting
- **Session Management**: Create and manage multiple Claude sessions
- **File Explorer**: Browse, upload, and manage files in your workspace
- **Real-time Updates**: Live output streaming via Appwrite Realtime
- **Mobile Responsive**: Works seamlessly on desktop and mobile devices
- **Claude Integration**: Direct integration with Claude API for command execution
- **Persistent Storage**: All sessions and files stored securely in Appwrite

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Appwrite Cloud account
- Claude API key from Anthropic

### Installation

1. Clone and install dependencies:
```bash
git clone <repository>
cd super-console
npm install
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
# Edit .env.local with your API keys
```

3. Deploy Appwrite resources:
```bash
npx appwrite deploy
```

4. Start development server:
```bash
npm run dev
```

### Production Deployment

Deploy to Appwrite Sites:
```bash
npm run deploy
```

## 🏗️ Architecture

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Appwrite Functions for Claude API integration
- **Database**: Appwrite Database for sessions, commands, and files
- **Storage**: Appwrite Storage for file uploads
- **Real-time**: Appwrite Realtime for live updates

## 📝 Usage

1. **Create Session**: Click "New Session" to start a new Claude session
2. **Execute Commands**: Type Claude commands in the terminal
3. **Manage Files**: Use the file explorer to upload and manage files
4. **View History**: See all previous commands and their outputs
5. **Switch Sessions**: Use the session dropdown to switch between sessions

## 🛠️ Development

### Project Structure

```
src/
  app/                 # Next.js app directory
  components/          # React components
    terminal/          # Terminal-related components
    file-explorer/     # File management components
    ui/               # Reusable UI components
  hooks/              # Custom React hooks
  lib/                # Utility libraries
  services/           # API services
  types/              # TypeScript definitions
functions/            # Appwrite Functions
  claude-executor/    # Main Claude execution function
```

### Key Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run deploy` - Deploy to Appwrite Sites

## 🔒 Security

- API keys are stored securely in Appwrite environment variables
- User authentication through Appwrite Auth
- Rate limiting on command execution
- Input sanitization for all user inputs

## 📊 Performance

- Optimized bundle size with tree shaking
- Lazy loading of components
- Virtual scrolling for large outputs
- CDN delivery through Appwrite Sites

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
- Check the GitHub Issues
- Review Appwrite documentation
- Check Claude API documentation

---

**Built with ❤️ using Appwrite, Next.js, and Claude AI**