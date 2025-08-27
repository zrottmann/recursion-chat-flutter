import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:path_provider/path_provider.dart';
import 'package:file_picker/file_picker.dart';

// Export service for chat conversations
class ChatExportService {
  static const String _appName = 'Recursion Chat';
  
  // Export format enum
  enum ExportFormat { text, pdf }
  
  // Message data model for export
  class ExportMessage {
    final String id;
    final String text;
    final String sender;
    final DateTime timestamp;
    final bool isCurrentUser;
    final String? voiceMessagePath;
    final List<String> reactions;

    const ExportMessage({
      required this.id,
      required this.text,
      required this.sender,
      required this.timestamp,
      required this.isCurrentUser,
      this.voiceMessagePath,
      this.reactions = const [],
    });
  }

  // Export conversation to text format
  static Future<String> exportToText({
    required String chatName,
    required List<ExportMessage> messages,
    String? customPath,
  }) async {
    final buffer = StringBuffer();
    
    // Header
    buffer.writeln('$_appName - Chat Export');
    buffer.writeln('Chat: $chatName');
    buffer.writeln('Exported: ${_formatDateTime(DateTime.now())}');
    buffer.writeln('Total Messages: ${messages.length}');
    buffer.writeln('${'-' * 50}\n');
    
    // Messages
    for (final message in messages) {
      buffer.writeln('${message.sender} - ${_formatDateTime(message.timestamp)}');
      
      if (message.voiceMessagePath != null) {
        buffer.writeln('[Voice Message]');
      } else {
        buffer.writeln(message.text);
      }
      
      if (message.reactions.isNotEmpty) {
        buffer.writeln('Reactions: ${message.reactions.join(' ')}');
      }
      
      buffer.writeln('');
    }
    
    // Save to file
    final directory = customPath != null 
        ? Directory(customPath)
        : await getApplicationDocumentsDirectory();
    
    final fileName = '${chatName.replaceAll(' ', '_')}_${DateTime.now().millisecondsSinceEpoch}.txt';
    final file = File('${directory.path}/$fileName');
    
    await file.writeAsString(buffer.toString());
    
    return file.path;
  }

  // Export conversation to PDF format
  static Future<String> exportToPdf({
    required String chatName,
    required List<ExportMessage> messages,
    String? customPath,
  }) async {
    final pdf = pw.Document();
    
    // Load font for better text rendering
    final regularFont = await PdfGoogleFonts.poppinsRegular();
    final boldFont = await PdfGoogleFonts.poppinsSemiBold();
    
    // Create PDF pages
    final pageTheme = pw.PageTheme(
      margin: const pw.EdgeInsets.all(32),
      pageFormat: PdfPageFormat.a4,
    );

    // Title page
    pdf.addPage(
      pw.Page(
        pageTheme: pageTheme,
        build: (context) => pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Header(
              level: 0,
              child: pw.Text(
                _appName,
                style: pw.TextStyle(
                  font: boldFont,
                  fontSize: 28,
                  color: const PdfColor.fromInt(0xFF667EEA),
                ),
              ),
            ),
            pw.SizedBox(height: 20),
            pw.Text(
              'Chat Conversation Export',
              style: pw.TextStyle(
                font: boldFont,
                fontSize: 18,
              ),
            ),
            pw.SizedBox(height: 40),
            pw.Table(
              columnWidths: {
                0: const pw.FixedColumnWidth(100),
                1: const pw.FlexColumnWidth(),
              },
              children: [
                _buildInfoRow('Chat Name:', chatName, regularFont, boldFont),
                _buildInfoRow('Export Date:', _formatDateTime(DateTime.now()), regularFont, boldFont),
                _buildInfoRow('Total Messages:', '${messages.length}', regularFont, boldFont),
              ],
            ),
          ],
        ),
      ),
    );

    // Message pages
    final messagesPerPage = 15;
    final totalPages = (messages.length / messagesPerPage).ceil();
    
    for (int pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      final startIndex = pageIndex * messagesPerPage;
      final endIndex = (startIndex + messagesPerPage < messages.length) 
          ? startIndex + messagesPerPage 
          : messages.length;
      
      final pageMessages = messages.sublist(startIndex, endIndex);
      
      pdf.addPage(
        pw.Page(
          pageTheme: pageTheme,
          build: (context) => pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Header(
                level: 1,
                child: pw.Text(
                  '$chatName - Page ${pageIndex + 1}',
                  style: pw.TextStyle(
                    font: boldFont,
                    fontSize: 16,
                  ),
                ),
              ),
              pw.SizedBox(height: 20),
              ...pageMessages.map((message) => _buildMessageWidget(
                message, 
                regularFont, 
                boldFont,
              )).toList(),
            ],
          ),
        ),
      );
    }

    // Save PDF
    final directory = customPath != null 
        ? Directory(customPath)
        : await getApplicationDocumentsDirectory();
    
    final fileName = '${chatName.replaceAll(' ', '_')}_${DateTime.now().millisecondsSinceEpoch}.pdf';
    final file = File('${directory.path}/$fileName');
    
    await file.writeAsBytes(await pdf.save());
    
    return file.path;
  }

  static pw.TableRow _buildInfoRow(
    String label, 
    String value, 
    pw.Font regularFont, 
    pw.Font boldFont,
  ) {
    return pw.TableRow(
      children: [
        pw.Padding(
          padding: const pw.EdgeInsets.only(bottom: 8),
          child: pw.Text(
            label,
            style: pw.TextStyle(font: boldFont, fontSize: 12),
          ),
        ),
        pw.Padding(
          padding: const pw.EdgeInsets.only(bottom: 8),
          child: pw.Text(
            value,
            style: pw.TextStyle(font: regularFont, fontSize: 12),
          ),
        ),
      ],
    );
  }

  static pw.Widget _buildMessageWidget(
    ExportMessage message,
    pw.Font regularFont,
    pw.Font boldFont,
  ) {
    return pw.Container(
      margin: const pw.EdgeInsets.only(bottom: 16),
      padding: const pw.EdgeInsets.all(12),
      decoration: pw.BoxDecoration(
        color: message.isCurrentUser 
            ? const PdfColor.fromInt(0x1A667EEA) 
            : const PdfColor.fromInt(0x1AF1F3F5),
        borderRadius: pw.BorderRadius.circular(8),
        border: pw.Border.all(
          color: const PdfColor.fromInt(0x33000000),
          width: 0.5,
        ),
      ),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            children: [
              pw.Text(
                message.sender,
                style: pw.TextStyle(
                  font: boldFont,
                  fontSize: 11,
                  color: message.isCurrentUser 
                      ? const PdfColor.fromInt(0xFF667EEA)
                      : const PdfColor.fromInt(0xFF764BA2),
                ),
              ),
              pw.Text(
                _formatDateTime(message.timestamp),
                style: pw.TextStyle(
                  font: regularFont,
                  fontSize: 9,
                  color: const PdfColor.fromInt(0x66000000),
                ),
              ),
            ],
          ),
          pw.SizedBox(height: 6),
          if (message.voiceMessagePath != null)
            pw.Container(
              padding: const pw.EdgeInsets.all(8),
              decoration: pw.BoxDecoration(
                color: const PdfColor.fromInt(0x1A000000),
                borderRadius: pw.BorderRadius.circular(4),
              ),
              child: pw.Text(
                '[Voice Message]',
                style: pw.TextStyle(
                  font: regularFont,
                  fontSize: 10,
                  fontStyle: pw.FontStyle.italic,
                ),
              ),
            )
          else
            pw.Text(
              message.text,
              style: pw.TextStyle(
                font: regularFont,
                fontSize: 10,
              ),
            ),
          if (message.reactions.isNotEmpty) ...[
            pw.SizedBox(height: 6),
            pw.Text(
              'Reactions: ${message.reactions.join(' ')}',
              style: pw.TextStyle(
                font: regularFont,
                fontSize: 9,
                color: const PdfColor.fromInt(0x66000000),
              ),
            ),
          ],
        ],
      ),
    );
  }

  // Share exported file
  static Future<void> shareFile(String filePath) async {
    try {
      await Printing.sharePdf(
        bytes: await File(filePath).readAsBytes(),
        filename: filePath.split('/').last,
      );
    } catch (e) {
      // Fallback to system share if PDF sharing fails
      throw Exception('Failed to share file: $e');
    }
  }

  // Let user choose save location
  static Future<String?> getUserSelectedPath({
    required String suggestedFileName,
    required String fileExtension,
  }) async {
    try {
      final result = await FilePicker.platform.saveFile(
        dialogTitle: 'Save Chat Export',
        fileName: suggestedFileName,
        allowedExtensions: [fileExtension],
        type: FileType.custom,
      );
      
      return result;
    } catch (e) {
      return null;
    }
  }

  // Format date time for display
  static String _formatDateTime(DateTime dateTime) {
    return '${dateTime.day.toString().padLeft(2, '0')}/'
           '${dateTime.month.toString().padLeft(2, '0')}/'
           '${dateTime.year} '
           '${dateTime.hour.toString().padLeft(2, '0')}:'
           '${dateTime.minute.toString().padLeft(2, '0')}';
  }

  // Convert messages from your app's message format to export format
  static List<ExportMessage> convertMessagesToExportFormat(
    List<dynamic> messages, // Replace with your message type
    String currentUserName,
    String otherUserName,
  ) {
    final exportMessages = <ExportMessage>[];
    
    for (final message in messages) {
      // This is a mock conversion - adapt to your message structure
      final mockMessage = message as Map<String, dynamic>;
      
      exportMessages.add(
        ExportMessage(
          id: mockMessage['id'] as String,
          text: mockMessage['text'] as String,
          sender: (mockMessage['isMe'] as bool) ? currentUserName : otherUserName,
          timestamp: mockMessage['timestamp'] as DateTime,
          isCurrentUser: mockMessage['isMe'] as bool,
          voiceMessagePath: mockMessage['voiceMessagePath'] as String?,
          reactions: (mockMessage['reactions'] as List<dynamic>?)
              ?.cast<String>() ?? [],
        ),
      );
    }
    
    return exportMessages;
  }

  // Get human-readable file size
  static String getFileSize(String filePath) {
    try {
      final file = File(filePath);
      final bytes = file.lengthSync();
      
      if (bytes < 1024) {
        return '${bytes} B';
      } else if (bytes < 1048576) {
        return '${(bytes / 1024).toStringAsFixed(1)} KB';
      } else {
        return '${(bytes / 1048576).toStringAsFixed(1)} MB';
      }
    } catch (e) {
      return 'Unknown';
    }
  }
}