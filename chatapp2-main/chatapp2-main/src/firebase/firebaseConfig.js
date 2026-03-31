// firebaseConfig.js
// 👉 File cấu hình Firebase, giúp app kết nối tới Firebase services (Auth, Database, Storage,...)

import { initializeApp, getApps, getApp } from "firebase/app";  
// 🔹 Import các hàm cần để khởi tạo ứng dụng Firebase
//    - initializeApp(): Khởi tạo một app Firebase mới
//    - getApps(): Lấy danh sách các app Firebase hiện có (đã được khởi tạo)
//    - getApp(): Lấy app Firebase đầu tiên nếu đã khởi tạo (tránh khởi tạo trùng)

import { getDatabase } from "firebase/database";  
// 🔹 Import module Realtime Database — dùng để đọc/ghi dữ liệu realtime (giống JSON tree)

import { getStorage } from "firebase/storage";  
// 🔹 Import module Cloud Storage — dùng để upload, lưu trữ file (ảnh, video, tài liệu,...)


// ✅ Cấu hình Firebase của bạn (lấy từ Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyByV88b1HvydGBW59mXZD18slCBe332Rdo",  
  // 🔹 Khóa công khai để app frontend có thể truy cập Firebase API
  //    (Không phải mật khẩu, có thể để public trong mã nguồn)

  authDomain: "chatappdemo-44d04.firebaseapp.com",  
  // 🔹 Domain dùng cho xác thực người dùng (Firebase Authentication)

  databaseURL: "https://chatappdemo-44d04-default-rtdb.asia-southeast1.firebasedatabase.app",  
  // 🔹 Đường dẫn đến Realtime Database (Firebase sẽ kết nối qua URL này)

  projectId: "chatappdemo-44d04",  
  // 🔹 ID của project Firebase (định danh duy nhất trên Google Cloud)

  storageBucket: "chatappdemo-44d04.appspot.com",  
  // 🔹 Tên bucket Cloud Storage (nơi lưu file)
  //    ✅ Chú ý: phải có đuôi .appspot.com để hoạt động đúng

  messagingSenderId: "827872970653",  
  // 🔹 ID của dịch vụ Cloud Messaging (dùng để gửi thông báo)

  appId: "1:827872970653:web:f5423367bd92becf089174",  
  // 🔹 Định danh riêng của app Firebase (mỗi ứng dụng = 1 appId)

  measurementId: "G-2YGCZ31CEN",  
  // 🔹 Dùng cho Google Analytics (nếu bạn bật thống kê)
};


// ✅ Chỉ khởi tạo Firebase App 1 lần duy nhất
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// 🔹 Giải thích:
//    - getApps() trả về danh sách các app Firebase đã khởi tạo
//    - Nếu chưa có app nào (`length === 0`) → gọi initializeApp(firebaseConfig)
//    - Nếu đã có rồi → dùng lại app cũ bằng getApp()
// 👉 Giúp tránh lỗi "Firebase App already exists" khi code chạy nhiều lần (VD: trong React hot reload)


// Xuất (export) Database và Storage để file khác có thể dùng
export const db = getDatabase(app);     
// 🔹 Kết nối tới Realtime Database dựa trên app vừa khởi tạo

export const storage = getStorage(app); 
// 🔹 Kết nối tới Cloud Storage để upload / tải file

