import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';

enum WeatherType { clear, cloudy, rainy, stormy, foggy, snowy }
enum Season { spring, summer, autumn, winter }

class GameTimeWeatherSystem {
  static const int timeMultiplier = 120; // 1 real minute = 2 game hours
  
  final DateTime _gameStartTime = DateTime.now();
  WeatherType _currentWeather = WeatherType.clear;
  Season _currentSeason = Season.spring;
  Timer? _weatherTimer;
  Timer? _seasonTimer;
  
  final math.Random _random = math.Random();

  WeatherType get currentWeather => _currentWeather;
  Season get currentSeason => _currentSeason;

  void initialize() {
    print('[WeatherSystem] Initializing time and weather systems...');

    // Update weather every 5 minutes
    _weatherTimer = Timer.periodic(const Duration(minutes: 5), (_) {
      _updateWeather();
    });

    // Update season every 30 minutes  
    _seasonTimer = Timer.periodic(const Duration(minutes: 30), (_) {
      _updateSeason();
    });

    print('[WeatherSystem] Time system initialized');
  }

  DateTime getCurrentGameTime() {
    final realTimeElapsed = DateTime.now().difference(_gameStartTime);
    final gameTimeElapsed = Duration(
      milliseconds: (realTimeElapsed.inMilliseconds * timeMultiplier).round()
    );
    return _gameStartTime.add(gameTimeElapsed);
  }

  Map<String, dynamic> getCurrentTimeInfo() {
    final gameTime = getCurrentGameTime();
    
    return {
      'hours': gameTime.hour,
      'minutes': gameTime.minute,
      'dayOfWeek': _getDayOfWeekName(gameTime.weekday),
      'month': _getMonthName(gameTime.month),
      'day': gameTime.day,
      'year': gameTime.year,
      'season': _currentSeason.name,
      'weather': _currentWeather.name,
      'timeOfDay': _getTimeOfDay(gameTime.hour),
    };
  }

  String getFormattedTime() {
    final gameTime = getCurrentGameTime();
    final period = gameTime.hour >= 12 ? 'PM' : 'AM';
    final displayHour = gameTime.hour == 0 ? 12 : 
                       gameTime.hour > 12 ? gameTime.hour - 12 : gameTime.hour;
    final minutes = gameTime.minute.toString().padLeft(2, '0');
    
    return '$displayHour:$minutes $period';
  }

  void _updateWeather() {
    final weatherTypes = WeatherType.values;
    WeatherType newWeather;
    
    // Weather patterns based on season
    switch (_currentSeason) {
      case Season.spring:
        newWeather = _random.nextBool() ? 
          WeatherType.rainy : _getRandomWeather([WeatherType.clear, WeatherType.cloudy]);
        break;
      case Season.summer:
        newWeather = _getRandomWeather([WeatherType.clear, WeatherType.clear, WeatherType.cloudy]);
        break;
      case Season.autumn:
        newWeather = _getRandomWeather([WeatherType.cloudy, WeatherType.rainy, WeatherType.foggy]);
        break;
      case Season.winter:
        newWeather = _getRandomWeather([WeatherType.snowy, WeatherType.cloudy, WeatherType.stormy]);
        break;
    }
    
    if (newWeather != _currentWeather) {
      _currentWeather = newWeather;
      print('[WeatherSystem] Weather changed to: ${_currentWeather.name}');
    }
  }

  void _updateSeason() {
    final seasons = Season.values;
    final currentIndex = seasons.indexOf(_currentSeason);
    final newIndex = (currentIndex + 1) % seasons.length;
    
    if (seasons[newIndex] != _currentSeason) {
      _currentSeason = seasons[newIndex];
      print('[WeatherSystem] Season changed to: ${_currentSeason.name}');
    }
  }

  WeatherType _getRandomWeather(List<WeatherType> options) {
    return options[_random.nextInt(options.length)];
  }

  String _getDayOfWeekName(int weekday) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[weekday - 1];
  }

  String _getMonthName(int month) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
  }

  String _getTimeOfDay(int hour) {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  Color getWeatherOverlayColor() {
    switch (_currentWeather) {
      case WeatherType.clear:
        return Colors.transparent;
      case WeatherType.cloudy:
        return Colors.grey.withOpacity(0.2);
      case WeatherType.rainy:
        return Colors.blue.withOpacity(0.3);
      case WeatherType.stormy:
        return Colors.indigo.withOpacity(0.4);
      case WeatherType.foggy:
        return Colors.grey.withOpacity(0.5);
      case WeatherType.snowy:
        return Colors.white.withOpacity(0.3);
    }
  }

  double getVisibilityModifier() {
    switch (_currentWeather) {
      case WeatherType.clear:
        return 1.0;
      case WeatherType.cloudy:
        return 0.9;
      case WeatherType.rainy:
        return 0.8;
      case WeatherType.stormy:
        return 0.7;
      case WeatherType.foggy:
        return 0.5;
      case WeatherType.snowy:
        return 0.6;
    }
  }

  Map<String, dynamic> getWeatherEffects() {
    return {
      'rentModifier': _getRentModifier(),
      'allySpeedModifier': _getAllySpeedModifier(),
      'visibilityModifier': getVisibilityModifier(),
      'overlayColor': getWeatherOverlayColor(),
    };
  }

  double _getRentModifier() {
    switch (_currentWeather) {
      case WeatherType.clear:
        return 1.0;
      case WeatherType.cloudy:
        return 1.0;
      case WeatherType.rainy:
        return 0.95; // Slight rent decrease due to weather issues
      case WeatherType.stormy:
        return 0.9; // Moderate rent decrease
      case WeatherType.foggy:
        return 0.98;
      case WeatherType.snowy:
        return 0.92; // Higher heating costs affect rent
    }
  }

  double _getAllySpeedModifier() {
    switch (_currentWeather) {
      case WeatherType.clear:
        return 1.0;
      case WeatherType.cloudy:
        return 1.0;
      case WeatherType.rainy:
        return 0.8; // Allies move slower in rain
      case WeatherType.stormy:
        return 0.7; // Much slower in storms
      case WeatherType.foggy:
        return 0.9; // Slightly slower due to low visibility
      case WeatherType.snowy:
        return 0.75; // Slower movement in snow
    }
  }

  void dispose() {
    _weatherTimer?.cancel();
    _seasonTimer?.cancel();
  }
}