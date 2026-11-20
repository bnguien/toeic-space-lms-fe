import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/services/http";

export function TuitionEntryForm({ orderId, balance }: { orderId: string; balance: number }) {
  const client = useQueryClient();
  const [entryId, setEntryId] = useState(() => crypto.randomUUID());
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState("Cash");
  const record = useMutation({
    mutationFn: () =>
      httpClient.post(`/payment/api/v1/tuition-orders/${encodeURIComponent(orderId)}/entries`, {
        entryId,
        amount: Number(amount),
        kind,
      }),
    onSuccess: async () => {
      setAmount("");
      setEntryId(crypto.randomUUID());
      await client.invalidateQueries({ queryKey: ["tuition", orderId] });
    },
  });
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        record.mutate();
      }}
      onChange={() => {
        setEntryId(crypto.randomUUID());
        record.reset();
      }}
    >
      <fieldset disabled={record.isPending}>
        <legend>Ghi nhận học phí</legend>
        <label>
          Hình thức
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="Cash">Tiền mặt</option>
            <option value="Waiver">Miễn giảm</option>
          </select>
        </label>
        <label>
          Số tiền (VND)
          <input
            required
            type="number"
            min="1"
            step="1"
            max={balance}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        <button type="submit">Ghi nhận</button>
      </fieldset>
      {record.isError && <p role="alert">Không thể ghi nhận. Kiểm tra số dư và thử lại.</p>}
    </form>
  );
}
