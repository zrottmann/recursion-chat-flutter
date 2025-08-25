# Trading Post - AI-Powered Marketplace

A comprehensive marketplace application with AI-powered pricing, photo-to-listing automation, and advanced user matching algorithms.

## 🚀 Features

- **User Authentication**: Email/password and OAuth (Google, GitHub)
- **Item Listings**: Create, search, and manage marketplace items
- **Trading System**: Request trades and manage transactions
- **Real-time Chat**: Message system for trade coordination
- **User Profiles**: Public profiles with ratings and reviews
- **AI Photo Mode**: Automatic item categorization and descriptions
- **Responsive Design**: Mobile-friendly React frontend

## 🏗️ Architecture

### Backend (Python/FastAPI)
- FastAPI REST API
- Appwrite integration for database and auth
- SQLite fallback database
- Real-time WebSocket support

### Frontend (React)
- React 18 with modern hooks
- Bootstrap 5 UI components
- Appwrite Web SDK integration
- Real-time updates
- Mobile-responsive design

### Appwrite Integration
- **Database**: 7 collections (users, items, trades, messages, etc.)
- **Authentication**: Email/password + OAuth providers
- **Storage**: File uploads for item images
- **Functions**: Backend API endpoints
- **Real-time**: Live updates for messages and trades

## 🔧 Setup

### Prerequisites
- Node.js 16+
- Python 3.9+
- Appwrite Cloud account

### Appwrite Configuration

**Project Details:**
- **Project ID**: `689bdee000098bd9d55c`
- **Endpoint**: `https://nyc.cloud.appwrite.io/v1`
- **Database**: `trading_post_db`

**Collections:**
- `users` - User profiles
- `items` - Marketplace listings  
- `wants` - User wish lists
- `trades` - Trade requests
- `messages` - Chat messages
- `reviews` - User reviews
- `notifications` - System notifications

**Storage:**
- `item_images` - Product photos

### Environment Variables

Create `.env` files based on the templates:

**Backend (.env):**
```bash
APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=689bdee000098bd9d55c
APPWRITE_API_KEY=your_api_key_here
APPWRITE_DATABASE_ID=trading_post_db
```

**Frontend (.env):**
```bash
REACT_APP_APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
REACT_APP_APPWRITE_PROJECT_ID=689bdee000098bd9d55c
REACT_APP_APPWRITE_DATABASE_ID=trading_post_db
```

### Installation

**Backend:**
```bash
pip install -r requirements.txt
python app_appwrite.py
```

**Frontend:**
```bash
cd trading-app-frontend
npm install
npm start
```

## 🌐 Deployment

### Appwrite Functions
The application includes ready-to-deploy Appwrite Functions:

1. **Backend Function**: `functions/trading-post-backend/`
2. **Frontend Function**: `functions/trading-post-frontend-serve/`

### Alternative Hosting

**Vercel (Recommended):**
```bash
cd trading-app-frontend
npm install -g vercel
vercel
```

**Netlify:**
```bash
cd trading-app-frontend
npm install -g netlify-cli
netlify deploy
```

## 📱 Mobile Support

The application includes Capacitor configuration for mobile deployment:

```bash
cd trading-app-frontend
npm run build
npx cap sync
npx cap open android
```

## 🔐 Security Features

- OAuth2 integration (Google, GitHub, Facebook)
- JWT token management
- CORS protection
- Input validation and sanitization
- File upload restrictions
- Rate limiting

## 🧪 Testing

**Backend:**
```bash
python test_appwrite_sso.py
```

**Frontend:**
```bash
cd trading-app-frontend
npm test
```

## 📊 Monitoring

The application includes:
- Appwrite Console integration
- Error logging
- Performance monitoring
- Real-time analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and support:
- Check Appwrite Console for backend issues
- Review browser console for frontend errors
- Check deployment logs for hosting issues

---

**Ready to deploy!** The application is fully configured for Appwrite Cloud deployment.// Webhook test Thu, Aug 14, 2025 12:09:59 PM
// Webhook test with corrected URL Thu, Aug 14, 2025 12:16:52 PM
# Test auto-deploy Mon, Aug 18, 2025  9:41:15 AM
