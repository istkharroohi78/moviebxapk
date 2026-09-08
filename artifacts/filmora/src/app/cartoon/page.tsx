import MovieRow from "@/components/MovieRow";
import { tmdb } from "@/lib/tmdb";
import { Metadata } from "next";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
    title: `Cartoon & Animation — Watch Free in HD | ${siteConfig.name}`,
    description: `Cartoons, anime and animated movies for kids and families on ${siteConfig.name} ${siteConfig.brandBy}.`,
    alternates: { canonical: `${siteConfig.url}/cartoon` },
};

export default async function CartoonPage() {
    const [animatedMovies, animatedSeries, family, kidsTop, anime] = await Promise.all([
        tmdb.getDiscover("movie", { genreId: "16" }),
        tmdb.getDiscover("tv", { genreId: "16" }),
        tmdb.getDiscover("movie", { genreId: "10751" }),
        tmdb.getDiscover("tv", { genreId: "10762" }),
        tmdb.getDiscover("tv", { genreId: "16", sortBy: "vote_average.desc" }),
    ]);

    return (
        <main className="min-h-screen pb-20 overflow-x-hidden pt-28">
            <div className="px-4 sm:px-6 lg:px-10 mb-6">
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">Cartoon</h1>
                <p className="mt-2 text-sm text-gray-400">Animated movies, cartoon series and anime — all in one place.</p>
            </div>

            <div className="space-y-6 md:space-y-12">
                <MovieRow title="Cartoon Movies" movies={animatedMovies} />
                <MovieRow title="Cartoon Series" movies={animatedSeries} />
                <MovieRow title="Anime Picks" movies={anime} />
                <MovieRow title="Kids TV" movies={kidsTop} />
                <MovieRow title="Family Favourites" movies={family} />
            </div>
        </main>
    );
}
