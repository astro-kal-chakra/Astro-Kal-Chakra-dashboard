import { checkAccess } from "@/lib/session";
import { getUsers } from "@/services";
import { flatParams } from "@/lib/url";
import { formatCurrency, formatDate, formatNumber, maskPhone, timeAgo } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { DataTable, Pagination } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/Badge";
import { PersonCell } from "@/components/ui/Avatar";
import { FilterBar } from "@/components/common/FilterBar";
import { ExportButton } from "@/components/common/ExportButton";

export const metadata = { title: "Users" };

const FILTERS = [
  { name: "status", label: "All statuses", options: [{ value: "new", label: "New" }, { value: "active", label: "Active" }, { value: "blocked", label: "Blocked" }] },
  {
    name: "wallet",
    label: "Any wallet balance",
    options: [
      { value: "zero", label: "₹0" },
      { value: "low", label: "₹1 – ₹99" },
      { value: "mid", label: "₹100 – ₹999" },
      { value: "high", label: "₹1,000+" },
    ],
  },
  { name: "joined", label: "Joined any time", options: [{ value: "7d", label: "Last 7 days" }, { value: "30d", label: "Last 30 days" }, { value: "90d", label: "Last 90 days" }] },
];

export default async function UsersPage({ searchParams }) {
  const { denied } = await checkAccess("users");
  if (denied) return denied;

  const params = flatParams(await searchParams);
  const data = await getUsers(params);

  const columns = [
    { key: "name", label: "User", sortable: true, render: (u) => <PersonCell name={u.name} sub={u.id} /> },
    { key: "phone", label: "Phone", render: (u) => <span className="font-mono text-[13px]">{maskPhone(u.phone)}</span> },
    { key: "city", label: "City", hideOnMobile: true },
    { key: "status", label: "Status", render: (u) => <StatusBadge status={u.status} /> },
    { key: "wallet", label: "Wallet", align: "right", sortable: true, render: (u) => <span className="font-semibold text-text">{formatCurrency(u.wallet)}</span> },
    { key: "totalSpend", label: "Total spend", align: "right", sortable: true, hideOnMobile: true, render: (u) => formatCurrency(u.totalSpend) },
    { key: "sessionsCount", label: "Sessions", align: "right", sortable: true, hideOnMobile: true, render: (u) => formatNumber(u.sessionsCount) },
    { key: "joinedAt", label: "Joined", sortable: true, render: (u) => formatDate(u.joinedAt) },
    { key: "lastActiveAt", label: "Last active", hideOnMobile: true, render: (u) => timeAgo(u.lastActiveAt) },
  ];

  return (
    <>
      <PageHeader
        title="Users"
        description={`${formatNumber(data.total)} users match your filters`}
        actions={
          <ExportButton
            module="users"
            filename="users.csv"
            rows={data.rows.map((u) => ({ id: u.id, name: u.name, phone: maskPhone(u.phone), city: u.city, status: u.status, wallet: u.wallet, joined: formatDate(u.joinedAt) }))}
          />
        }
      />
      <Card>
        <FilterBar searchPlaceholder="Search name, phone or ID" filters={FILTERS} />
        <DataTable columns={columns} rows={data.rows} basePath="/users" params={params} rowHref={(u) => `/users/${u.id}`} />
        <Pagination {...data} basePath="/users" params={params} />
      </Card>
    </>
  );
}
