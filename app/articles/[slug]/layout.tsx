import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

// Server layout wrapping the (client) article page to provide Open Graph /
// Twitter metadata for rich share previews. Renders children unchanged.
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("articles")
      .select("title, excerpt, body, image_url")
      .eq("slug", params.slug)
      .eq("status", "approved")
      .single();

    if (!data) {
      return { title: "A reflection · Yet, We Can Heal" };
    }

    const title = (data.title as string) || "A reflection";
    const description =
      (data.excerpt as string) ||
      (data.body as string)?.slice(0, 155).trim() + "…";

    return {
      title: `${title} · Yet, We Can Heal`,
      description,
      openGraph: {
        title,
        description,
        type: "article",
        images: data.image_url ? [{ url: data.image_url as string }] : undefined,
      },
      twitter: {
        card: data.image_url ? "summary_large_image" : "summary",
        title,
        description,
        images: data.image_url ? [data.image_url as string] : undefined,
      },
    };
  } catch {
    return { title: "A reflection · Yet, We Can Heal" };
  }
}

export default function ArticleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
