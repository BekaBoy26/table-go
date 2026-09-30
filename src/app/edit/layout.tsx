import React from "react";
import AdminGuard from "@/components/shared/AdminGuard";

const EditLayout = ({ children }: { children: React.ReactNode }) => <AdminGuard>{children}</AdminGuard>;

export default EditLayout;
