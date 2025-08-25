import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Star, MapPin, Clock, DollarSign, Camera, 
  Heart, MessageCircle, Share, Filter, SortAsc, Eye,
  TrendingUp, TrendingDown, Minus, Plus, AlertTriangle
} from 'lucide-react';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../config';

const MobileTradeResults = ({ sessionData, onBack, onContactUser }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'high_confidence', 'nearby', 'exact_value'
  const [sortBy, setSortBy] = useState('match_quality'); // 'match_quality', 'value_difference', 'distance'
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState(new Set());

  useEffect(() => {
    if (sessionData?.trade_matches) {
      setMatches(sessionData.trade_matches);
      setLoading(false);
    } else if (sessionData?.session_id) {
      fetchDetailedMatches();
    }
  }, [sessionData]);

  const fetchDetailedMatches = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/photo-to-trade/results/${sessionData.session_id}`);
      const data = await response.json();
      setMatches(data.trade_matches || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast.error('Failed to load trade matches');
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedMatches = () => {
    let filtered = matches;

    // Apply filters
    switch (filter) {
      case 'high_confidence':
        filtered = matches.filter(match => match.confidence_score >= 0.8);
        break;
      case 'nearby':
        filtered = matches.filter(match => 
          match.value_analysis?.distance_km && match.value_analysis.distance_km <= 25
        );
        break;
      case 'exact_value':
        filtered = matches.filter(match => 
          Math.abs(match.value_analysis?.difference_percent || 100) <= 10
        );
        break;
      default:
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'value_difference':
          return Math.abs(a.value_analysis?.difference_percent || 100) - 
                 Math.abs(b.value_analysis?.difference_percent || 100);
        case 'distance':
          return (a.value_analysis?.distance_km || 999) - (b.value_analysis?.distance_km || 999);
        case 'match_quality':
        default:
          return (b.match_quality_score || 0) - (a.match_quality_score || 0);
      }
    });

    return filtered;
  };

  const toggleFavorite = (matchId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(matchId)) {
      newFavorites.delete(matchId);
    } else {
      newFavorites.add(matchId);
    }
    setFavorites(newFavorites);
  };

  const getValueDifferenceDisplay = (match) => {
    const value1 = match.value_analysis?.value1 || 0;
    const value2 = match.value_analysis?.value2 || 0;
    const difference = value2 - value1;
    const percentDiff = match.value_analysis?.difference_percent || 0;

    if (Math.abs(difference) < 5) {
      return {
        icon: <Minus className="w-4 h-4 text-green-600" />,
        text: 'Equal Value',
        color: 'text-green-600'
      };
    } else if (difference > 0) {
      return {
        icon: <TrendingUp className="w-4 h-4 text-blue-600" />,
        text: `+$${Math.abs(difference).toFixed(0)} (${Math.abs(percentDiff).toFixed(1)}%)`,
        color: 'text-blue-600'
      };
    } else {
      return {
        icon: <TrendingDown className="w-4 h-4 text-orange-600" />,
        text: `-$${Math.abs(difference).toFixed(0)} (${Math.abs(percentDiff).toFixed(1)}%)`,
        color: 'text-orange-600'
      };
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const TradeMatchCard = ({ match, index }) => {
    const valueDiff = getValueDifferenceDisplay(match);
    const isFavorite = favorites.has(match.match_id);

    return (
      <div 
        className="bg-white rounded-lg border border-gray-200 p-4 mb-3 shadow-sm"
        onClick={() => setSelectedMatch(match)}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(match.confidence_score)}`}>
              {Math.round(match.confidence_score * 100)}% match
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(match.match_id);
            }}
            className="p-1"
          >
            <Heart 
              className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-400'}`} 
            />
          </button>
        </div>

        {/* Item Info */}
        <div className="space-y-2 mb-3">
          <h3 className="font-medium text-gray-800 line-clamp-2">
            Item Title Would Go Here {/* TODO: Extract from match data */}
          </h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 mr-1" />
              ${match.value_analysis?.value2 || 0}
            </div>
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {match.value_analysis?.distance_km ? `${match.value_analysis.distance_km.toFixed(1)}km` : 'Unknown'}
            </div>
          </div>
        </div>

        {/* Value Difference */}
        <div className="flex items-center space-x-2 mb-3">
          {valueDiff.icon}
          <span className={`text-sm font-medium ${valueDiff.color}`}>
            {valueDiff.text}
          </span>
        </div>

        {/* AI Recommendation */}
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <p className="text-sm text-gray-700 line-clamp-2">
            {match.ai_recommendation || 'AI recommendation not available'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedMatch(match);
            }}
            className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <Eye className="w-4 h-4 mr-1" />
            Details
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onContactUser && onContactUser(match);
            }}
            className="flex-1 px-3 py-2 border border-blue-600 text-blue-600 text-sm rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center"
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            Contact
          </button>
        </div>
      </div>
    );
  };

  const DetailedMatchView = ({ match, onClose }) => {
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b px-4 py-3 flex items-center">
          <button onClick={onClose} className="mr-3">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-800">Trade Details</h1>
        </div>

        <div className="p-4 space-y-6">
          {/* Match Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-blue-800">Match Quality</h3>
              <span className="text-2xl font-bold text-blue-600">
                {Math.round(match.match_quality_score * 100)}%
              </span>
            </div>
            <p className="text-sm text-blue-700">
              High-quality match based on value compatibility and AI analysis
            </p>
          </div>

          {/* Value Analysis */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-3">Value Analysis</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Your Item Value:</span>
                <span className="font-medium">${match.value_analysis?.value1 || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Their Item Value:</span>
                <span className="font-medium">${match.value_analysis?.value2 || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Difference:</span>
                <span className={`font-medium ${getValueDifferenceDisplay(match).color}`}>
                  {getValueDifferenceDisplay(match).text}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Matching Algorithm:</span>
                <span className="font-medium capitalize">
                  {match.value_analysis?.algorithm?.replace('_', ' ') || 'Standard'}
                </span>
              </div>
            </div>
          </div>

          {/* Location & Distance */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-3">Location</h3>
            <div className="space-y-2">
              <div className="flex items-center text-gray-600">
                <MapPin className="w-4 h-4 mr-2" />
                <span>
                  {match.value_analysis?.distance_km 
                    ? `${match.value_analysis.distance_km.toFixed(1)} km away`
                    : 'Location not available'
                  }
                </span>
              </div>
              <div className="flex items-center text-gray-600">
                <Clock className="w-4 h-4 mr-2" />
                <span>Available for trade</span>
              </div>
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-3">AI Recommendation</h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              {match.ai_recommendation || 'No specific recommendation available.'}
            </p>
          </div>

          {/* Confidence Breakdown */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-3">Confidence Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Overall Confidence:</span>
                <span className="font-medium">{Math.round(match.confidence_score * 100)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Value Compatibility:</span>
                <span className="font-medium">
                  {Math.round((match.value_analysis?.compatibility_score || 0) * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => onContactUser && onContactUser(match)}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Contact User
            </button>
            <button
              onClick={() => {
                // TODO: Implement share functionality
                navigator.share && navigator.share({
                  title: 'Trade Match',
                  text: 'Check out this trade match I found!',
                  url: window.location.href
                });
              }}
              className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
            >
              <Share className="w-5 h-5 mr-2" />
              Share Match
            </button>
          </div>
        </div>
      </div>
    );
  };

  const FilterSortPanel = () => (
    <div className="bg-white border-b p-4 space-y-4">
      {/* Filters */}
      <div>
        <h4 className="font-medium text-gray-800 mb-2">Filter Matches</h4>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All Matches' },
            { key: 'high_confidence', label: 'High Confidence' },
            { key: 'nearby', label: 'Nearby' },
            { key: 'exact_value', label: 'Exact Value' }
          ].map(option => (
            <button
              key={option.key}
              onClick={() => setFilter(option.key)}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                filter === option.key
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <h4 className="font-medium text-gray-800 mb-2">Sort By</h4>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="match_quality">Match Quality</option>
          <option value="value_difference">Value Difference</option>
          <option value="distance">Distance</option>
        </select>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trade matches...</p>
        </div>
      </div>
    );
  }

  const filteredMatches = filteredAndSortedMatches();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-3">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Trade Matches</h1>
            <p className="text-sm text-gray-600">
              {filteredMatches.length} of {matches.length} matches
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Filters & Sort Panel */}
      {showFilters && <FilterSortPanel />}

      {/* Results Summary */}
      {sessionData?.photo_analysis && (
        <div className="bg-white border-b p-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
              <Camera className="w-8 h-8 text-gray-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-800">Your Item</h3>
              <p className="text-sm text-gray-600">
                Estimated value: ${sessionData.photo_analysis.price_analysis?.estimated_price || 'Unknown'}
              </p>
              <p className="text-sm text-gray-600">
                {Math.round((sessionData.photo_analysis.confidence_score || 0) * 100)}% confidence
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trade Matches */}
      <div className="p-4">
        {filteredMatches.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-medium text-gray-800 mb-2">No matches found</h3>
            <p className="text-sm text-gray-600 mb-4">
              Try adjusting your filters or preferences to see more results.
            </p>
            <button
              onClick={() => setShowFilters(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Adjust Filters
            </button>
          </div>
        ) : (
          <div>
            {filteredMatches.map((match, index) => (
              <TradeMatchCard 
                key={match.match_id} 
                match={match} 
                index={index}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detailed Match View */}
      {selectedMatch && (
        <DetailedMatchView 
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  );
};

export default MobileTradeResults;