import { ProfileForm } from "@/components/account/ProfileForm";
import { PageHeader } from "@/components/admin/PageHeader";
import { requireAdmin } from "@/lib/dal";

export const metadata = { title: "My profile" };

export default async function AdminProfilePage() {
  const user = await requireAdmin();

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <PageHeader title="My profile" subtitle="Manage your account details and profile image" />
      <ProfileForm user={user} />
    </div>
  );
}
