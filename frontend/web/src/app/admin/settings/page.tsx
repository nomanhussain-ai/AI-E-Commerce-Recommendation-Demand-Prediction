import { PageHeader } from "@/components/admin/PageHeader";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <PageHeader title="Settings" subtitle="Store details and notification preferences" />
      <SettingsForm />
    </div>
  );
}
