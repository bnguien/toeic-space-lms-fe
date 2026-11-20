import { useNavigate } from "react-router-dom";
import { FilePlus2, ReceiptText, Search } from "lucide-react";
import mascot from "@/assets/mascot/oy2-focus.png";
import { AdminPage, Button, ButtonLink, Card, ListHero, OverviewHero } from "@/modules/admin";
import { TuitionPage } from "./TuitionPage";
import { useParams } from "react-router-dom";
import styles from "./Tuition.module.css";

function StatementLookup() {
  const navigate = useNavigate();
  return (
    <Card title="Tra cứu sao kê">
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          const id = String(new FormData(event.currentTarget).get("orderId")).trim();
          navigate(`/admin/tuition/statements/${encodeURIComponent(id)}`);
        }}
      >
        <label>
          Mã khoản thu
          <input
            name="orderId"
            required
            pattern="[0-9a-fA-F]{8}(-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}"
            title="Nhập mã UUID của khoản thu"
          />
        </label>
        <Button type="submit" variant="primary" icon={<Search size={16} />}>
          Xem sao kê
        </Button>
      </form>
    </Card>
  );
}

export function TuitionOverview() {
  return (
    <AdminPage
      theme="amber"
      hero={
        <OverviewHero
          eyebrow="Học phí"
          icon={<ReceiptText size={16} />}
          title="Tổng quan"
          highlight="học phí"
          description="Quản lý khoản thu theo lớp và theo dõi học phí của từng học viên."
          watermark="TUITION"
          mascot={mascot}
          panelLabel="Ghi nhận học phí"
          panelTitle="Hình thức thanh toán và miễn giảm"
          stats={[
            { key: "bank", label: "Chuyển khoản", value: "SePay" },
            { key: "cash", label: "Tại quầy", value: "Tiền mặt" },
            { key: "waiver", label: "Điều chỉnh", value: "Miễn giảm" },
          ]}
          actions={
            <>
              <ButtonLink to="create" variant="primary" icon={<FilePlus2 size={16} />}>
                Tạo khoản thu
              </ButtonLink>
              <ButtonLink to="statements" icon={<ReceiptText size={16} />}>
                Sao kê
              </ButtonLink>
            </>
          }
        />
      }
    >
      <StatementLookup />
    </AdminPage>
  );
}

export function TuitionStatements() {
  const { id } = useParams();
  return (
    <AdminPage
      theme="amber"
      hero={
        <ListHero
          eyebrow="Học phí"
          title="Sao kê"
          highlight="học phí"
          description="Xem số dư, lịch sử giao dịch và ghi nhận thanh toán theo khoản thu."
          mascot={mascot}
        />
      }
    >
      <StatementLookup />
      {id && (
        <Card title="Chi tiết khoản thu" description={id}>
          <TuitionPage key={id} />
        </Card>
      )}
    </AdminPage>
  );
}
