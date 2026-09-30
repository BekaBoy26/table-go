import React from "react";
import AdminGuard from "@/components/shared/AdminGuard";

const AdminLayout = ({ children }: { children: React.ReactNode }) => <AdminGuard>{children}</AdminGuard>;

export default AdminLayout;
