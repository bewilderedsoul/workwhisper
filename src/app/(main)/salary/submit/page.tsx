// src/app/(main)/salary/submit/page.tsx
import { Suspense } from "react";
import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";
import { SalarySubmitForm } from "@/components/salary/SalarySubmitForm";

export const metadata: Metadata = {
  title: "Share Your Salary — Anonymous | WorkWhisper",
};

export const dynamic = "force-dynamic";

export default function SalarySubmitPage() {
  return (
    <MainLayout>
      <Suspense fallback={null}>
        <SalarySubmitForm />
      </Suspense>
    </MainLayout>
  );
}
