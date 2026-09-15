import { coreFetch } from "./client";
import { toSearchParams } from "@/utils/search-params";
import type { Customer, CustomerQuery } from "@/types/customers";
import type { Paginated } from "@/types/common";

export const customerApi = {
  getAllCustomers: (query: CustomerQuery = {}, token: string) =>
    coreFetch<Paginated<Customer>>(`/admin/customers${toSearchParams(query)}`, {}, token),
};
