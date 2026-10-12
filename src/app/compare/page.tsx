import { Metadata } from "next";
import { RepoCompare } from "@/components/compare/RepoCompare";

export const metadata: Metadata = {
  title: "Compare Repositories // gitreadme",
  description: "Benchmark architecture, git commit velocity, tech dependencies, and roast scores side-by-side.",
};

export default function ComparePage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-10 flex-1 flex flex-col">
      <RepoCompare />
    </div>
  );
}
