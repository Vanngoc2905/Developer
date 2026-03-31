import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_application_1/main.dart';

void main() {
  testWidgets('HomePage loads and shows username', (WidgetTester tester) async {
    await tester.pumpWidget(MeMeChatApp());
    await tester.pumpAndSettle();

    // Kiểm tra username hiển thị trên sidebar
    expect(find.text('User'), findsOneWidget);

    // Kiểm tra RoomList input có tồn tại
    expect(find.byType(TextField), findsWidgets);

    // Kiểm tra có nút tạo phòng
    expect(find.byIcon(Icons.add), findsWidgets);
  });
}
