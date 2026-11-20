import type { NavSection } from "../types/nav.types";

export const ADMIN_NAV_SECTIONS: NavSection[] = [
  {
    key: "overview",
    label: "Tổng quan",
    icon: "▣",
    path: "/admin",
  },
  {
    key: "teachers",
    label: "Giáo viên",
    icon: "♙",
    children: [
      { key: "teachers-overview", label: "Tổng quan", path: "/admin/teachers" },
      { key: "teachers-list", label: "Danh sách giáo viên", path: "/admin/teachers/list" },
      { key: "teachers-activities", label: "Hoạt động", path: "/admin/teachers/activities" },
    ],
  },
  {
    key: "students",
    label: "Học viên",
    icon: "♙",
    children: [
      { key: "students-overview", label: "Tổng quan", path: "/admin/students" },
      { key: "students-list", label: "Danh sách học viên", path: "/admin/students/list" },
      { key: "students-activities", label: "Hoạt động học", path: "/admin/students/activities" },
    ],
  },
  {
    key: "classes",
    label: "Lớp học",
    icon: "▣",
    children: [
      { key: "classes-overview", label: "Tổng quan", path: "/admin/classes" },
      { key: "classes-list", label: "Danh sách lớp học", path: "/admin/classes/list" },
      { key: "classes-facilities", label: "Cơ sở & Phòng học", path: "/admin/classes/facilities" },
      { key: "classes-lifecycle", label: "Lưu trữ & đã xóa", path: "/admin/classes/lifecycle" },
    ],
  },
  {
    key: "exams",
    label: "Ngân hàng đề",
    icon: "▣",
    children: [
      { key: "exams-overview", label: "Tổng quan", path: "/admin/exams" },
      { key: "exams-list", label: "Đề thi", path: "/admin/exams/list" },
      { key: "exams-part-1", label: "Part 1 (Mô tả hình ảnh)", path: "/admin/exams/part-1" },
      { key: "exams-part-2", label: "Part 2 (Hỏi - Đáp)", path: "/admin/exams/part-2" },
      { key: "exams-part-3", label: "Part 3 (Hội thoại ngắn)", path: "/admin/exams/part-3" },
      { key: "exams-part-4", label: "Part 4 (Bài nói ngắn)", path: "/admin/exams/part-4" },
      { key: "exams-part-5", label: "Part 5 (Điền câu)", path: "/admin/exams/part-5" },
      { key: "exams-part-6", label: "Part 6 (Điền đoạn văn)", path: "/admin/exams/part-6" },
      { key: "exams-part-7", label: "Part 7 (Đọc hiểu)", path: "/admin/exams/part-7" },
    ],
  },
  {
    key: "tuition",
    label: "Học phí",
    icon: "▣",
    children: [
      { key: "tuition-overview", label: "Tổng quan", path: "/admin/tuition" },
      { key: "tuition-create", label: "Tạo khoản thu", path: "/admin/tuition/create" },
      { key: "tuition-statements", label: "Sao kê học phí", path: "/admin/tuition/statements" },
    ],
  },
  {
    key: "system",
    label: "Hệ thống",
    icon: "⚙",
    children: [
      { key: "system-users", label: "Tất cả tài khoản", path: "/admin/system/users" },
      { key: "system-admins", label: "Admin", path: "/admin/system/admins" },
    ],
  },
];
