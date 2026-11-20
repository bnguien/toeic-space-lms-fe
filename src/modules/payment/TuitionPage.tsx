import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { httpClient } from "@/services/http";

import { useCurrentUser } from "@/modules/auth";
import { TuitionEntryForm } from "./TuitionEntryForm";

interface Statement {
  order: {
    classId: string;
    paymentReference: string;
    amountOwed: number;
    amountPaid: number;
    amountWaived: number;
    remainingBalance: number;
  };
  bank: string | null;
  accountNumber: string | null;
  entries: { id: string; kind: string | number; amount: number; recordedAt: string }[];
}
const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
export function TuitionPage() {
  const user = useCurrentUser();
  const { id } = useParams();
  const statement = useQuery({
    queryKey: ["tuition", id],
    queryFn: async ({ signal }) =>
      (
        await httpClient.get<Statement>(
          `/payment/api/v1/tuition-orders/${encodeURIComponent(id!)}`,
          { signal },
        )
      ).data,
    retry: false,
  });
  if (statement.isPending) return <p role="status">Đang tải sao kê…</p>;
  if (statement.isError)
    return (
      <p role="alert">
        Không thể xem sao kê. <button onClick={() => void statement.refetch()}>Thử lại</button>
      </p>
    );
  const { order, bank, accountNumber, entries } = statement.data;
  return (
    <main className="tuition">
      <h1>Sao kê học phí</h1>
      <p>Mã lớp · {order.classId}</p>
      <dl>
        <dt>Học phí</dt>
        <dd>{money.format(order.amountOwed)}</dd>
        <dt>Đã trả</dt>
        <dd>{money.format(order.amountPaid)}</dd>
        <dt>Được miễn</dt>
        <dd>{money.format(order.amountWaived)}</dd>
        <dt>Còn lại</dt>
        <dd>{money.format(order.remainingBalance)}</dd>
      </dl>
      {order.remainingBalance > 0 && bank && accountNumber && (
        <p>
          {bank} · {accountNumber}
          <br />
          Nội dung chuyển khoản · {order.paymentReference}
        </p>
      )}
      <h2>Lịch sử ghi nhận</h2>
      {entries.length ? (
        <ul>
          {entries.map((e) => (
            <li key={e.id}>
              {new Date(e.recordedAt).toLocaleString("vi-VN")} ·{" "}
              {typeof e.kind === "number" ? ["SePay", "Cash", "Waiver"][e.kind] : e.kind} ·{" "}
              {money.format(e.amount)}
            </li>
          ))}
        </ul>
      ) : (
        <p>Chưa có giao dịch.</p>
      )}
      {user?.role === "Admin" && id && order.remainingBalance > 0 && (
        <TuitionEntryForm key={id} orderId={id} balance={order.remainingBalance} />
      )}
      <button onClick={() => void statement.refetch()}>Cập nhật sao kê</button>
    </main>
  );
}
