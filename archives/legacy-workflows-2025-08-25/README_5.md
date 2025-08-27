# Recursion Chat App - Appwrite Cloud Edition

A modern real-time chat application powered by Appwrite Cloud. Features include Google OAuth authentication, real-time messaging, room-based conversations, and customizable design themes.

## 🚀 Deployment

This application is fully deployed on **Appwrite Cloud**:

- **Live URL**: [https://chat.recursionsystems.com](https://chat.recursionsystems.com)
- **Project ID**: `689bdaf500072795b0f6`
- **Region**: NYC (US East)
- **Dashboard**: [Appwrite Console](https://cloud.appwrite.io/console/project-689bdaf500072795b0f6)

## 🛠️ Tech Stack

- **Frontend**: React + Vite
- **Backend**: Appwrite Cloud
- **Database**: Appwrite Database
- **Auth**: Appwrite Auth with Google OAuth
- **Realtime**: Appwrite Realtime API
- **Storage**: Appwrite Storage
- **Functions**: Appwrite Functions (Node.js)

## 📦 Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/zrottmann/recursion-chat-app.git
   cd recursion-chat-app
   ```

2. Install dependencies:
   ```bash
   npm install
   cd client && npm install
   ```

3. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your Appwrite credentials
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

## 🏗️ Project Structure

```
recursion-app/
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── contexts/       # React contexts
│   │   ├── styles/         # CSS & design system
│   │   └── utils/          # Helper functions
│   ├── android/            # Capacitor Android build
│   └── package.json
├── server.js               # Express/Socket.io backend
├── package.json            # Backend dependencies
└── vercel.json            # Deployment config
```

## 🛠️ Local Development

### Backend
```bash
npm install
npm start
# Server runs on http://localhost:3000
```

### Frontend
```bash
cd client
npm install  
npm run dev
# Client runs on http://localhost:5173
```

## 📱 Mobile Development

### Android
```bash
cd client
npm run android:dev    # Open in Android Studio
npm run android:build  # Build APK
```

### iOS
```bash
cd client
npm run ios:dev        # Open in Xcode
npm run ios:build      # Build IPA
```

## 🔧 Technology Stack

- **Frontend**: React 18, Vite, React Router
- **Backend**: Node.js, Express, Socket.io / Appwrite Cloud
- **Database**: SQLite / Appwrite Database
- **Mobile**: Capacitor
- **Auth**: Appwrite Auth with Google OAuth
- **Deployment**: Vercel
- **Styling**: CSS3 with custom design system

## ⚡ Features

- **Real-time Chat**: Instant messaging with Socket.io
- **User Authentication**: Secure login/signup system
- **Mobile Ready**: iOS & Android apps via Capacitor
- **Design System**: Comprehensive UI component library
- **Voice Services**: Audio communication support
- **Responsive**: Works on all screen sizes
- **Achievement System**: Gamified user experience
- **Private Messaging**: Direct user-to-user chat
- **Room Management**: Multiple chat rooms
- **User Profiles**: Customizable avatars and profiles

## 🌍 Environment Variables

Create `.env` file in root:

```env
NODE_ENV=production
DATABASE_URL=./database/recursion.db
JWT_SECRET=your-secret-key
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your-project-id
VITE_APPWRITE_DATABASE_ID=your-database-id
```

## 🔒 Security Features

- JWT authentication
- Input validation
- CORS protection
- Environment variable protection
- Secure database connections

## 📈 Performance

- Vite for fast builds
- Code splitting
- Lazy loading
- Optimized images
- Efficient Socket.io connections

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

**Build Failures:**
- Ensure Node.js 16+ is installed
- Delete `node_modules` and reinstall
- Check environment variables

**Deployment Issues:**
- Verify vercel.json configuration
- Check build logs in Vercel dashboard
- Ensure all dependencies are listed

**Mobile Build Issues:**
- Update Android Studio/Xcode
- Check Capacitor configuration
- Verify platform-specific dependencies

### Support

- 📧 Create an issue on GitHub
- 💬 Check existing issues and discussions
- 📚 Review documentation in `/docs`

---

**Made with ❤️ for real-time communication**