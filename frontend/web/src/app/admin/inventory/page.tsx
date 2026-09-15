import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";

import { PageHeader } from "@/components/admin/PageHeader";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/ui/Table";
import { auth } from "@/lib/auth";
import { productApi } from "@/config/api";
import { cn } from "@/utils/cn";

export const metadata = { title: "Inventory" };

type Risk = "HIGH" | "MEDIUM" | "LOW";

const RISK_TONE: Record<Risk, BadgeTone> = { HIGH: "danger", MEDIUM: "warning", LOW: "success" };

// Simple stock-level threshold â€” a stand-in for the real M2 coverage/risk
// calculation, which needs the forecasting model (not built yet).
function riskFor(stock: number): Risk {
  if (stock === 0) return "HIGH";
  if (stock <= 15) return "MEDIUM";
  return "LOW";
}

export default async function InventoryPage() {
  const session = await auth();
  const { data: products } = await productApi.getAllProducts(
    { sort: "stock", page_size: 100 },
    session?.accessToken,
  );
  const rows = products.map((p) => ({ ...p, risk: riskFor(p.stock) }));
  const counts = { HIGH: 0, MEDIUM: 0, LOW: 0 } as Record<Risk, number>;
  for (const r of rows) counts[r.risk]++;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Inventory"
        subtitle="Stock levels by product. Coverage/reorder forecasting (M2) lands separately."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-3 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-danger-soft text-danger">
            <AlertTriangle size={18} />
          </span>
          <div>
            <div className="text-xl font-bold text-foreground">{counts.HIGH}</div>
            <div className="text-xs text-muted">Out of stock</div>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-warning-soft text-warning">
            <RefreshCw size={18} />
          </span>
          <div>
            <div className="text-xl font-bold text-foreground">{counts.MEDIUM}</div>
            <div className="text-xs text-muted">Low stock (â‰¤15)</div>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-success-soft text-success">
            <CheckCircle2 size={18} />
          </span>
          <div>
            <div className="text-xl font-bold text-foreground">{counts.LOW}</div>
            <div className="text-xs text-muted">Healthy stock</div>
          </div>
        </Card>
      </div>

      <Card className="p-0">
        {rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted">No products yet.</p>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Product</Th>
                <Th>Category</Th>
                <Th>Stock</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {rows.map((row) => (
                <Tr key={row.id}>
                  <Td>
                    <div className="font-medium text-foreground">{row.title}</div>
                    <div className="font-mono text-[0.7rem] text-muted">{row.sku}</div>
                  </Td>
                  <Td>{row.category_name ?? "â€”"}</Td>
                  <Td>
                    <span
                      className={cn(
                        "font-semibold",
                        row.risk === "HIGH" && "text-danger",
                        row.risk === "MEDIUM" && "text-warning",
                      )}
                    >
                      {row.stock}
                    </span>
                  </Td>
                  <Td>
                    <Badge tone={RISK_TONE[row.risk]}>
                      {row.risk === "HIGH" ? "Out of stock" : row.risk === "MEDIUM" ? "Low" : "Healthy"}
                    </Badge>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
