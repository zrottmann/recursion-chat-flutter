import React, { useState, useEffect } from 'react';
import { 
  Camera, Zap, TrendingUp, Clock, Users, Star,
  Search, Bell, Menu, Plus, ArrowRight, Sparkles,
  DollarSign, BarChart3, MapPin, History
} from 'lucide-react';
import MobilePhotoCapture from './MobilePhotoCapture';
import MobileTradeResults from './MobileTradeResults';
import { API_BASE_URL } from '../config';

const MobileTradingHub = () => {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'photo_capture', 'trade_results'
  const [sessionData, setSessionData] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [userStats, setUserStats] = useState({
    totalTrades: 0,
    avgTradeValue: 0,
    successRate: 0,
    aiAnalyses: 0
  });
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadUserData();
    loadRecentSessions();
  }, []);

  const loadUserData = async () => {
    try {
      // TODO: Implement user stats API
      setUserStats({
        totalTrades: 12,
        avgTradeValue: 245,
        successRate: 89,
        aiAnalyses: 25
      });
      
      setNotifications([
        { id: 1, type: 'match', message: 'New high-confidence match found!', time: '2 min ago' },
        { id: 2, type: 'trade', message: 'Trade completed successfully', time: '1 hour ago' }
      ]);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadRecentSessions = async () => {
    try {
      // TODO: Implement recent sessions API
      setRecentSessions([
        {
          id: 'session1',
          itemName: 'iPhone 12',
          estimatedValue: 450,
          matchesFound: 7,
          timestamp: new Date(Date.now() - 3600000),
          status: 'completed'
        },
        {
          id: 'session2', 
          itemName: 'MacBook Pro',
          estimatedValue: 1200,
          matchesFound: 3,
          timestamp: new Date(Date.now() - 86400000),
          status: 'completed'
        }
      ]);
    } catch (error) {
      console.error('Error loading recent sessions:', error);
    }
  };

  const handlePhotoComplete = (results) => {
    setSessionData(results);
    setCurrentView('trade_results');
  };

  const handleContactUser = (match) => {
    // TODO: Implement contact user functionality
    console.log('Contact user for match:', match);
  };

  const QuickStatsCard = ({ icon, label, value, trend, color = "blue" }) => (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg bg-${color}-100`}>
          {icon}
        </div>
        {trend && (
          <div className="flex items-center text-green-600 text-sm">
            <TrendingUp className="w-3 h-3 mr-1" />
            +{trend}%
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-sm text-gray-600">{label}</p>
      </div>
    </div>
  );

  const FeatureCard = ({ icon, title, description, onClick, highlight = false }) => (
    <div 
      onClick={onClick}
      className={`bg-white rounded-lg p-4 border cursor-pointer transition-all ${
        highlight 
          ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md' 
          : 'border-gray-200 hover:border-blue-200 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center space-x-3 mb-3">
        <div className={`p-2 rounded-lg ${highlight ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold ${highlight ? 'text-blue-800' : 'text-gray-800'}`}>
            {title}
          </h3>
        </div>
        <ArrowRight className={`w-5 h-5 ${highlight ? 'text-blue-600' : 'text-gray-400'}`} />
      </div>
      <p className={`text-sm ${highlight ? 'text-blue-700' : 'text-gray-600'}`}>
        {description}
      </p>
      {highlight && (
        <div className="mt-3 flex items-center text-xs text-blue-600">
          <Sparkles className="w-3 h-3 mr-1" />
          AI-Powered Feature
        </div>
      )}
    </div>
  );

  const RecentSessionCard = ({ session }) => (
    <div 
      className="bg-white rounded-lg p-4 border border-gray-200 cursor-pointer hover:border-blue-200 transition-colors"
      onClick={() => {
        // Load session data and show results
        setSessionData({ session_id: session.id });
        setCurrentView('trade_results');
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-800">{session.itemName}</h4>
        <span className="text-sm text-gray-500">
          {session.timestamp.toLocaleDateString()}
        </span>
      </div>
      
      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
        <div className="flex items-center">
          <DollarSign className="w-4 h-4 mr-1" />
          ${session.estimatedValue}
        </div>
        <div className="flex items-center">
          <Users className="w-4 h-4 mr-1" />
          {session.matchesFound} matches
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          session.status === 'completed' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {session.status}
        </span>
        <span className="text-xs text-blue-600">View matches →</span>
      </div>
    </div>
  );

  const NotificationCard = ({ notification }) => (
    <div className="bg-white rounded-lg p-3 border border-gray-200 mb-2">
      <div className="flex items-start space-x-3">
        <div className={`p-1 rounded-full mt-0.5 ${
          notification.type === 'match' ? 'bg-blue-100' : 'bg-green-100'
        }`}>
          {notification.type === 'match' ? (
            <Zap className="w-3 h-3 text-blue-600" />
          ) : (
            <Star className="w-3 h-3 text-green-600" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-800">{notification.message}</p>
          <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
        </div>
      </div>
    </div>
  );

  if (currentView === 'photo_capture') {
    return (
      <MobilePhotoCapture
        onComplete={handlePhotoComplete}
        onCancel={() => setCurrentView('dashboard')}
      />
    );
  }

  if (currentView === 'trade_results') {
    return (
      <MobileTradeResults
        sessionData={sessionData}
        onBack={() => setCurrentView('dashboard')}
        onContactUser={handleContactUser}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Trading Hub</h1>
            <p className="text-sm text-gray-600">AI-powered trading made simple</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              )}
            </button>
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-6">
        {/* Hero Section - AI Photo Trading */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold mb-2">Smart Photo Trading</h2>
              <p className="text-blue-100 text-sm">
                Take a photo, get instant AI valuation, find equal trades
              </p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <Sparkles className="w-8 h-8" />
            </div>
          </div>
          
          <button
            onClick={() => setCurrentView('photo_capture')}
            className="w-full bg-white text-blue-600 font-semibold py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
          >
            <Camera className="w-5 h-5 mr-2" />
            Take Photo & Find Trades
          </button>
        </div>

        {/* Quick Stats */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Your Trading Stats</h3>
          <div className="grid grid-cols-2 gap-3">
            <QuickStatsCard
              icon={<Users className="w-5 h-5 text-blue-600" />}
              label="Total Trades"
              value={userStats.totalTrades}
              trend={12}
              color="blue"
            />
            <QuickStatsCard
              icon={<DollarSign className="w-5 h-5 text-green-600" />}
              label="Avg Trade Value"
              value={`$${userStats.avgTradeValue}`}
              trend={8}
              color="green"
            />
            <QuickStatsCard
              icon={<Star className="w-5 h-5 text-yellow-600" />}
              label="Success Rate"
              value={`${userStats.successRate}%`}
              color="yellow"
            />
            <QuickStatsCard
              icon={<BarChart3 className="w-5 h-5 text-purple-600" />}
              label="AI Analyses"
              value={userStats.aiAnalyses}
              trend={25}
              color="purple"
            />
          </div>
        </div>

        {/* Features */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Features</h3>
          <div className="space-y-3">
            <FeatureCard
              icon={<Camera className="w-5 h-5" />}
              title="AI Photo Analysis"
              description="Instant item recognition and value estimation using computer vision"
              onClick={() => setCurrentView('photo_capture')}
              highlight={true}
            />
            
            <FeatureCard
              icon={<Search className="w-5 h-5" />}
              title="Smart Trade Matching"
              description="Find perfect equal-value trades based on your preferences"
              onClick={() => {
                // TODO: Navigate to browse matches
              }}
            />
            
            <FeatureCard
              icon={<MapPin className="w-5 h-5" />}
              title="Local Trading"
              description="Connect with nearby traders for convenient exchanges"
              onClick={() => {
                // TODO: Navigate to local traders
              }}
            />
            
            <FeatureCard
              icon={<TrendingUp className="w-5 h-5" />}
              title="Market Insights"
              description="Real-time market data and trending item values"
              onClick={() => {
                // TODO: Navigate to market insights
              }}
            />
          </div>
        </div>

        {/* Recent Sessions */}
        {recentSessions.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">Recent AI Analyses</h3>
              <button className="text-sm text-blue-600 hover:text-blue-800">
                View All
              </button>
            </div>
            <div className="space-y-3">
              {recentSessions.slice(0, 3).map(session => (
                <RecentSessionCard key={session.id} session={session} />
              ))}
            </div>
          </div>
        )}

        {/* Notifications */}
        {notifications.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Recent Activity</h3>
            <div>
              {notifications.slice(0, 3).map(notification => (
                <NotificationCard key={notification.id} notification={notification} />
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => setCurrentView('photo_capture')}
            className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">New Analysis</span>
          </button>
          
          <button className="bg-white border border-gray-300 text-gray-700 p-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2">
            <History className="w-5 h-5" />
            <span className="font-medium">History</span>
          </button>
        </div>

        {/* Tips */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
            <Sparkles className="w-4 h-4 mr-2" />
            Pro Tip
          </h4>
          <p className="text-sm text-yellow-700">
            For best AI analysis results, take photos in good lighting and show the entire item. 
            Our AI can detect wear patterns and assess condition automatically!
          </p>
        </div>
      </div>

      {/* Bottom Navigation Spacer */}
      <div className="h-20"></div>
    </div>
  );
};

export default MobileTradingHub;