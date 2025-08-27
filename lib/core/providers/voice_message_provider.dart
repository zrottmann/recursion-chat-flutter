import 'dart:async';
import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:record/record.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';

// Voice message model
class VoiceMessage {
  final String id;
  final String filePath;
  final Duration duration;
  final DateTime timestamp;
  final bool isPlaying;
  final double progress; // 0.0 to 1.0

  const VoiceMessage({
    required this.id,
    required this.filePath,
    required this.duration,
    required this.timestamp,
    this.isPlaying = false,
    this.progress = 0.0,
  });

  VoiceMessage copyWith({
    String? id,
    String? filePath,
    Duration? duration,
    DateTime? timestamp,
    bool? isPlaying,
    double? progress,
  }) {
    return VoiceMessage(
      id: id ?? this.id,
      filePath: filePath ?? this.filePath,
      duration: duration ?? this.duration,
      timestamp: timestamp ?? this.timestamp,
      isPlaying: isPlaying ?? this.isPlaying,
      progress: progress ?? this.progress,
    );
  }
}

// Voice recording state
enum RecordingState {
  idle,
  recording,
  paused,
  stopped,
}

// Voice message state
class VoiceMessageState {
  final RecordingState recordingState;
  final Duration recordingDuration;
  final Map<String, VoiceMessage> voiceMessages;
  final String? currentlyPlayingId;

  const VoiceMessageState({
    this.recordingState = RecordingState.idle,
    this.recordingDuration = Duration.zero,
    this.voiceMessages = const {},
    this.currentlyPlayingId,
  });

  VoiceMessageState copyWith({
    RecordingState? recordingState,
    Duration? recordingDuration,
    Map<String, VoiceMessage>? voiceMessages,
    String? currentlyPlayingId,
  }) {
    return VoiceMessageState(
      recordingState: recordingState ?? this.recordingState,
      recordingDuration: recordingDuration ?? this.recordingDuration,
      voiceMessages: voiceMessages ?? this.voiceMessages,
      currentlyPlayingId: currentlyPlayingId,
    );
  }

  bool get isRecording => recordingState == RecordingState.recording;
  bool get isIdle => recordingState == RecordingState.idle;
}

// Voice message notifier
class VoiceMessageNotifier extends StateNotifier<VoiceMessageState> {
  VoiceMessageNotifier() : super(const VoiceMessageState()) {
    _initializeAudio();
  }

  final AudioRecorder _audioRecorder = AudioRecorder();
  final AudioPlayer _audioPlayer = AudioPlayer();
  Timer? _recordingTimer;
  StreamSubscription<Duration>? _playerPositionSubscription;
  StreamSubscription<PlayerState>? _playerStateSubscription;

  void _initializeAudio() {
    // Listen to player state changes
    _playerStateSubscription = _audioPlayer.onPlayerStateChanged.listen((playerState) {
      if (playerState == PlayerState.completed) {
        _stopPlayback();
      }
    });

    // Listen to player position changes
    _playerPositionSubscription = _audioPlayer.onPositionChanged.listen((position) {
      final currentlyPlaying = state.currentlyPlayingId;
      if (currentlyPlaying != null) {
        final voiceMessage = state.voiceMessages[currentlyPlaying];
        if (voiceMessage != null) {
          final progress = voiceMessage.duration.inMilliseconds > 0 
              ? position.inMilliseconds / voiceMessage.duration.inMilliseconds
              : 0.0;
          
          final updatedVoiceMessages = Map<String, VoiceMessage>.from(state.voiceMessages);
          updatedVoiceMessages[currentlyPlaying] = voiceMessage.copyWith(progress: progress.clamp(0.0, 1.0));
          
          state = state.copyWith(voiceMessages: updatedVoiceMessages);
        }
      }
    });
  }

  Future<bool> _requestPermissions() async {
    final microphoneStatus = await Permission.microphone.request();
    return microphoneStatus == PermissionStatus.granted;
  }

  Future<void> startRecording() async {
    try {
      final hasPermission = await _requestPermissions();
      if (!hasPermission) {
        throw Exception('Microphone permission not granted');
      }

      final directory = await getTemporaryDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final filePath = '${directory.path}/voice_message_$timestamp.m4a';

      await _audioRecorder.start(
        const RecordConfig(encoder: AudioEncoder.aacLc),
        path: filePath,
      );

      state = state.copyWith(
        recordingState: RecordingState.recording,
        recordingDuration: Duration.zero,
      );

      _startRecordingTimer();
    } catch (e) {
      // Handle recording error
      state = state.copyWith(recordingState: RecordingState.idle);
    }
  }

  void _startRecordingTimer() {
    _recordingTimer?.cancel();
    _recordingTimer = Timer.periodic(const Duration(milliseconds: 100), (timer) {
      if (state.recordingState == RecordingState.recording) {
        state = state.copyWith(
          recordingDuration: state.recordingDuration + const Duration(milliseconds: 100),
        );
      }
    });
  }

  Future<VoiceMessage?> stopRecording() async {
    try {
      final path = await _audioRecorder.stop();
      _recordingTimer?.cancel();

      state = state.copyWith(
        recordingState: RecordingState.stopped,
      );

      if (path != null) {
        final voiceMessageId = DateTime.now().millisecondsSinceEpoch.toString();
        final voiceMessage = VoiceMessage(
          id: voiceMessageId,
          filePath: path,
          duration: state.recordingDuration,
          timestamp: DateTime.now(),
        );

        final updatedVoiceMessages = Map<String, VoiceMessage>.from(state.voiceMessages);
        updatedVoiceMessages[voiceMessageId] = voiceMessage;

        state = state.copyWith(
          voiceMessages: updatedVoiceMessages,
          recordingState: RecordingState.idle,
          recordingDuration: Duration.zero,
        );

        return voiceMessage;
      }
    } catch (e) {
      // Handle stop recording error
      state = state.copyWith(
        recordingState: RecordingState.idle,
        recordingDuration: Duration.zero,
      );
    }
    return null;
  }

  Future<void> cancelRecording() async {
    try {
      await _audioRecorder.stop();
      _recordingTimer?.cancel();
      
      state = state.copyWith(
        recordingState: RecordingState.idle,
        recordingDuration: Duration.zero,
      );
    } catch (e) {
      // Handle cancel recording error
    }
  }

  Future<void> playVoiceMessage(String voiceMessageId) async {
    try {
      // Stop any currently playing message
      await _stopPlayback();

      final voiceMessage = state.voiceMessages[voiceMessageId];
      if (voiceMessage == null) return;

      await _audioPlayer.play(DeviceFileSource(voiceMessage.filePath));

      final updatedVoiceMessages = Map<String, VoiceMessage>.from(state.voiceMessages);
      updatedVoiceMessages[voiceMessageId] = voiceMessage.copyWith(isPlaying: true);

      state = state.copyWith(
        voiceMessages: updatedVoiceMessages,
        currentlyPlayingId: voiceMessageId,
      );
    } catch (e) {
      // Handle playback error
    }
  }

  Future<void> pauseVoiceMessage(String voiceMessageId) async {
    try {
      await _audioPlayer.pause();

      final voiceMessage = state.voiceMessages[voiceMessageId];
      if (voiceMessage == null) return;

      final updatedVoiceMessages = Map<String, VoiceMessage>.from(state.voiceMessages);
      updatedVoiceMessages[voiceMessageId] = voiceMessage.copyWith(isPlaying: false);

      state = state.copyWith(
        voiceMessages: updatedVoiceMessages,
        currentlyPlayingId: null,
      );
    } catch (e) {
      // Handle pause error
    }
  }

  Future<void> _stopPlayback() async {
    try {
      await _audioPlayer.stop();

      final currentlyPlaying = state.currentlyPlayingId;
      if (currentlyPlaying != null) {
        final voiceMessage = state.voiceMessages[currentlyPlaying];
        if (voiceMessage != null) {
          final updatedVoiceMessages = Map<String, VoiceMessage>.from(state.voiceMessages);
          updatedVoiceMessages[currentlyPlaying] = voiceMessage.copyWith(
            isPlaying: false,
            progress: 0.0,
          );

          state = state.copyWith(
            voiceMessages: updatedVoiceMessages,
            currentlyPlayingId: null,
          );
        }
      }
    } catch (e) {
      // Handle stop error
    }
  }

  @override
  void dispose() {
    _recordingTimer?.cancel();
    _playerPositionSubscription?.cancel();
    _playerStateSubscription?.cancel();
    _audioRecorder.dispose();
    _audioPlayer.dispose();
    super.dispose();
  }
}

// Provider
final voiceMessageProvider = StateNotifierProvider<VoiceMessageNotifier, VoiceMessageState>(
  (ref) => VoiceMessageNotifier(),
);