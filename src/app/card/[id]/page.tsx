import { notFound } from "next/navigation";
import { getRepoCard } from "@/lib/db";
import { Metadata } from "next";
import { CardViewer } from "./CardViewer";

interface CardPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CardPageProps): Promise<Metadata> {
  const { id } = await params;
  const card = getRepoCard(id);

  if (!card) {
    return { title: "Repo Card Not Found // gitreadme" };
  }

  const title = `${card.repoFullName} // Repo Card`;
  const desc = card.analysis.roast?.oneLinerRoast || `Architecture intelligence report for ${card.repoFullName}`;

  return {
    title: `${title} | gitreadme`,
    description: desc,
    openGraph: {
      title,
      description: desc,
      images: [{ url: `/api/og/${id}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [`/api/og/${id}`],
    },
  };
}

export default async function CardPage({ params }: CardPageProps) {
  const { id } = await params;
  const card = getRepoCard(id);

  if (!card) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-10 flex-1 flex flex-col">
      <CardViewer card={card} />
    </div>
  );
}
