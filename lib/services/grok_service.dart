import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../config/environment.dart';

class GrokService extends ChangeNotifier {
  final List<Map<String, String>> _conversationHistory = [];
  bool _isLoading = false;
  String? _lastError;

  bool get isLoading => _isLoading;
  String? get lastError => _lastError;
  List<Map<String, String>> get conversationHistory => _conversationHistory;

  GrokService() {
    // Initialize with a system message
    _conversationHistory.add({
      'role': 'system',
      'content': 'You are Grok, a helpful and witty AI assistant integrated into Recursion Chat. Be friendly, informative, and occasionally humorous in your responses.'
    });
  }

  Future<String?> sendMessage(String message) async {
    _isLoading = true;
    _lastError = null;
    notifyListeners();

    try {
      // Add user message to history
      _conversationHistory.add({
        'role': 'user',
        'content': message
      });

      // Debug API configuration
      debugPrint('Grok API Endpoint: ${Environment.grokApiEndpoint}');
      debugPrint('Grok API Key (masked): ${Environment.grokApiKey.substring(0, 8)}...');
      debugPrint('Grok Model: ${Environment.grokModel}');

      // Prepare the request
      final response = await http.post(
        Uri.parse(Environment.grokApiEndpoint),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${Environment.grokApiKey}',
        },
        body: jsonEncode({
          'model': Environment.grokModel,
          'messages': _conversationHistory,
          'temperature': 0.7,
          'max_tokens': 500,
          'stream': false,
        }),
      );

      debugPrint('Grok API Response Status: ${response.statusCode}');
      debugPrint('Grok API Response Body: ${response.body}');
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final grokResponse = data['choices'][0]['message']['content'];
        
        // Add Grok's response to history
        _conversationHistory.add({
          'role': 'assistant',
          'content': grokResponse
        });

        // Keep conversation history manageable (last 20 messages)
        if (_conversationHistory.length > 21) {
          // Keep system message + last 20 messages
          _conversationHistory.removeRange(1, _conversationHistory.length - 20);
        }

        _isLoading = false;
        notifyListeners();
        return grokResponse;
      } else {
        final errorBody = response.body;
        debugPrint('Grok API Error Response: $errorBody');
        throw Exception('Failed to get response from Grok: ${response.statusCode} - $errorBody');
      }
    } catch (e) {
      _lastError = e.toString();
      _isLoading = false;
      
      // Remove the failed user message from history
      if (_conversationHistory.isNotEmpty && 
          _conversationHistory.last['role'] == 'user') {
        _conversationHistory.removeLast();
      }
      
      notifyListeners();
      debugPrint('Grok API error: $e');
      return null;
    }
  }

  void clearConversation() {
    _conversationHistory.clear();
    // Re-add system message
    _conversationHistory.add({
      'role': 'system',
      'content': 'You are Grok, a helpful and witty AI assistant integrated into Recursion Chat. Be friendly, informative, and occasionally humorous in your responses.'
    });
    notifyListeners();
  }

  String getErrorMessage() {
    if (_lastError == null) return '';
    
    if (_lastError!.contains('Incorrect API key') || _lastError!.contains('401')) {
      return 'Invalid Grok API key. Please update the API key in environment configuration.';
    } else if (_lastError!.contains('429')) {
      return 'Rate limit exceeded. Please wait a moment.';
    } else if (_lastError!.contains('SocketException')) {
      return 'Network error. Please check your connection.';
    } else if (_lastError!.contains('YOUR_GROK_API_KEY_HERE')) {
      return 'Grok API key not configured. Please set the GROK_API_KEY environment variable.';
    } else {
      return 'Failed to get response. Please try again. Error: ${_lastError}';
    }
  }
}