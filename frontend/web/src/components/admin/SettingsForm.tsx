"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";

const NOTIFICATION_ROWS = [
  { key: "lowStock", label: "Low stock alerts", description: "HIGH risk products dip below coverage threshold" },
  { key: "newOrders", label: "New orders", description: "Every time a customer places an order" },
  { key: "modelRetrain", label: "Model retrain complete", description: "Recommender / forecaster finished training" },
  { key: "zeroResult", label: "Search zero-result spikes", description: "Weekly digest of failed searches" },
] as const;

export function SettingsForm() {
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    lowStock: true,
    newOrders: true,
    modelRetrain: false,
    zeroResult: true,
  });
  const [saved, setSaved] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle>Store details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3.5">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-body">Store name</span>
            <Input defaultValue="ShopIQ" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-body">Support email</span>
            <Input type="email" defaultValue="support@shopiq.example" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-body">Currency</span>
            <Input defaultValue="PKR" className="max-w-[8rem]" />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-border p-0">
          {NOTIFICATION_ROWS.map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-4 px-5 py-3.5">
              <div>
                <div className="text-sm font-medium text-foreground">{row.label}</div>
                <p className="text-xs text-muted">{row.description}</p>
              </div>
              <Switch
                checked={notifications[row.key]}
                onChange={(v) => setNotifications((prev) => ({ ...prev, [row.key]: v }))}
                label={row.label}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit">Save changes</Button>
        {saved && <span className="text-sm font-medium text-success">Saved.</span>}
      </div>
    </form>
  );
}
