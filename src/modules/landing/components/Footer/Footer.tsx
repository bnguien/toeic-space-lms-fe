import { Link } from "react-router-dom";
import mascotLogo from "@/assets/mascot/oy2-hello.png";
import styles from "./Footer.module.css";

export const Footer = () => {
  return (
    <footer id="about" className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.topGrid}>
          {/* Brand Column */}
          <div className={styles.brandCol}>
            <Link to="/" className={styles.brandLink} aria-label="Trang chủ TOEICSpace">
              <img src={mascotLogo} alt="TOEICSpace Mascot" className={styles.brandMascotImg} />
              <span className={styles.brandText}>TOEICSpace</span>
            </Link>

            <p className={styles.brandDesc}>
              Không gian luyện thi TOEIC yên tĩnh, thông minh và cá nhân hoá lộ trình theo năng lực
              từng học viên.
            </p>
          </div>
          <div className={styles.linksCol}>
            <h4>Tài khoản</h4>
            <ul className={styles.linksList}>
              <li>
                <Link to="/profile">Hồ sơ cá nhân</Link>
              </li>
              <li>
                <Link to="/change-password">Đổi mật khẩu</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottomRow}>
          <div className={styles.copyright}>
            © 2026 TOEICSpace. Hệ thống Ôn luyện & Khảo thí TOEIC tích hợp LMS Quản lý Trung tâm.
          </div>
        </div>
      </div>
    </footer>
  );
};
