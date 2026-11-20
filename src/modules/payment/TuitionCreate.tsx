import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { httpClient } from "@/services/http";

import mascot from "@/assets/mascot/oy2-focus.png";
import { AdminPage, Button, Card, ListHero } from "@/modules/admin";
import styles from "./Tuition.module.css";

export function TuitionCreate() {
  const navigate = useNavigate();
  const [paymentOrderId, setOrderId] = useState(() => crypto.randomUUID());
  const create = useMutation({
    mutationFn: (terms: {
      classId: string;
      studentId: string;
      classEnrollmentId: string | null;
      amountOwed: number;
    }) => httpClient.post("/payment/api/v1/tuition-orders", { ...terms, paymentOrderId }),
    onSuccess: () => navigate(`/admin/tuition/statements/${paymentOrderId}`),
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    create.mutate({
      classId: String(fields.get("classId")).trim(),
      studentId: String(fields.get("studentId")).trim(),
      classEnrollmentId: String(fields.get("classEnrollmentId")).trim() || null,
      amountOwed: Number(fields.get("amountOwed")),
    });
  }
  return (
    <AdminPage
      theme="amber"
      hero={<ListHero eyebrow="Học phí" title="Tạo" highlight="khoản thu" mascot={mascot} />}
    >
      <Card title="Thông tin khoản thu">
        <form
          className={styles.form}
          onSubmit={submit}
          onChange={() => {
            setOrderId(crypto.randomUUID());
            create.reset();
          }}
        >
          <fieldset disabled={create.isPending}>
            <label>
              Mã định danh lớp
              <input name="classId" required />
            </label>
            <label>
              Mã định danh học viên
              <input name="studentId" required />
            </label>
            <label>
              Mã ghi danh (nếu có)
              <input name="classEnrollmentId" />
            </label>
            <label>
              Học phí (VND)
              <input name="amountOwed" type="number" min="1" step="1" required />
            </label>
            <Button type="submit" variant="primary">
              Tạo khoản thu
            </Button>
          </fieldset>
          {create.isError && (
            <p role="alert">Không thể tạo khoản thu. Kiểm tra thông tin hoặc thử lại.</p>
          )}
        </form>
      </Card>
    </AdminPage>
  );
}
