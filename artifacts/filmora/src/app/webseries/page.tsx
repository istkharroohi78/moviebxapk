import MovieRow from "@/components/MovieRow";
import { tmdb } from "@/lib/tmdb";
import { Metadata } from "next";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
    title: `Web Series — Watch Online Free in HD | ${siteConfig.name}`,
    description: `Binge the best web series and TV shows in 480p, 720p, 1080p and 4K on ${siteConfig.name} ${siteConfig.brandBy}.`,
    alternates: { canonical: `${siteConfig.url}/webseries` },
};

export default async function WebSeriesPage() {
    const [trending, popular, topRated, drama, crime, sciFi] = await Promise.all([
        tmdb.getTrending("tv"),
        tmdb.getPopular("tv"),
        tmdb.getTopRated("tv"),
        tmdb.getDiscover("tv", { genreId: "18" }),
        tmdb.getDiscover("tv", { genreId: "80" }),
        tmdb.getDiscover("tv", { genreId: "10765" }),
    ]);

    return (
        <main className="min-h-screen pb-20 overflow-x-hidden pt-28">
            <div className="px-4 sm:px-6 lg:px-10 mb-6">
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">Web Series</h1>
                <p className="mt-2 text-sm text-gray-400">Every episode, every season — streaming free on {siteConfig.name}.</p>
            </div>

            <div className="space-y-6 md:space-y-12">
                <MovieRow title="Trending Series" movies={trending} />
                <MovieRow title="Popular Web Series" movies={popular} />
                <MovieRow title="Top Rated Series" movies={topRated} />
                <MovieRow title="Drama Series" movies={drama} />
                <MovieRow title="Crime & Thriller" movies={crime} />
                <MovieRow title="Sci-Fi & Fantasy" movies={sciFi} />
            </div>
        </main>
    );
}
