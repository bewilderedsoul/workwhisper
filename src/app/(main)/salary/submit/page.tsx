// src/app/(main)/salary/submit/page.tsx
import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";
import { SalarySubmitForm } from "@/components/salary/SalarySubmitForm";

export const metadata: Metadata = {
  title: "Share Your Salary — Anonymous | WorkWhisper",
};

export default function SalarySubmitPage() {
  return (
    <MainLayout>
      <SalarySubmitForm />
    </MainLayout>
  );
}
