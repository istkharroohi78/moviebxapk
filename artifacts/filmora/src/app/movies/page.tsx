import Hero from "@/components/Hero";
import MovieRow from "@/components/MovieRow";
import { tmdb } from "@/lib/tmdb";
import InfiniteGenres from "@/components/InfiniteGenres";
import { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import IndexedMoviesPage from "@/components/IndexedMoviesPage";

export const metadata: Metadata = {
    title: `Stream the Best Movies Online Free in HD | ${siteConfig.name}`,
    description: `Stream the best movies online for free in HD. Discover trending blockbusters, movie classics, and the latest releases on ${siteConfig.name}.`,
    alternates: {
        canonical: `${siteConfig.url}/movies`,
    },
};

async function getIndexedOnly(): Promise<boolean> {
    try {
        const base = process.env.INTERNAL_API_URL ?? "http://localhost:80/api";
        const res = await fetch(`${base}/settings`, { cache: "no-store" });
        if (!res.ok) return false;
        const data = await res.json();
        return Boolean(data.indexedOnly);
    } catch {
        return false;
    }
}

export default async function MoviesPage() {
    const indexedOnly = await getIndexedOnly();

    if (indexedOnly) {
        return <IndexedMoviesPage botUsername={siteConfig.botUsername} />;
    }

    const [trending, popular, topRated, nowPlaying, upcoming, action, horror] = await Promise.all([
        tmdb.getTrending("movie"),
        tmdb.getPopular("movie"),
        tmdb.getTopRated("movie"),
        tmdb.getNowPlaying(),
        tmdb.getUpcoming(),
        tmdb.getDiscover("movie", { genreId: "28" }),
        tmdb.getDiscover("movie", { genreId: "27" }),
    ]);

    return (
        <main className="min-h-screen pb-20 overflow-x-hidden">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "ItemList",
                        "itemListElement": trending.slice(0, 10).map((movie, index) => ({
                            "@type": "ListItem",
                            "position": index + 1,
                            "item": {
                                "@type": "Movie",
                                "name": movie.title || movie.name,
                                "url": `${siteConfig.url}/watch/movie/${movie.id}`,
                                "image": `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
                                "datePublished": movie.release_date
                            }
                        }))
                    })
                }}
            />
            <h1 className="sr-only">Movies | Watch Best Movies Online Free</h1>
            {trending.length > 0 && <Hero movies={trending} />}

            <div className="relative z-40">
                <div className="mt-10 md:mt-4 space-y-6 md:space-y-12 transition-all duration-500">
                    <MovieRow title="Now Playing in Theaters" movies={nowPlaying} />
                    <MovieRow title="Upcoming Anticipated" movies={upcoming} />
                    <MovieRow title="Trending Movies" movies={trending} />
                    <MovieRow title="Popular Now" movies={popular} />
                    <MovieRow title="Top Rated" movies={topRated} />
                    <MovieRow title="Action Movies" movies={action} />
                    <MovieRow title="Horror Movies" movies={horror} />
                    <InfiniteGenres type="movie" />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 md:mt-32 space-y-16 border-t border-white/5 pt-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                    <div className="space-y-6">
                        <h2 className="text-3xl font-black text-white tracking-tight">
                            Discover the Best Movies Online
                        </h2>
                        <p className="text-gray-400 leading-relaxed text-lg">
                            Dive into a world of cinematic excellence with {siteConfig.name}&apos;s extensive movie collection.
                            From the latest Hollywood blockbusters and indie gems to timeless classics and international cinema, our platform offers a diverse range of genres to satisfy every movie buff&apos;s cravings.
                            With high-quality streaming and an intuitive interface, your next movie night is just a click away.
                        </p>
                        <p className="text-gray-400 leading-relaxed text-lg">
                            Our &quot;Movies&quot; section is meticulously curated to bring you trending titles, top-rated masterpieces, and upcoming highly anticipated releases.
                            Explore genres like Action, Horror, Comedy, Drama, and more, all optimized for a premium viewing experience without the clutter of traditional streaming sites.
                        </p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 space-y-8">
                        <h3 className="text-xl font-bold text-white border-b border-white/10 pb-4">
                            Movie Night Essentials
                        </h3>
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-white font-semibold mb-2">High-Definition Quality</h4>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Experience cinema in stunning HD. Our platform supports high-bitrate streaming to ensure you don&apos;t miss a single detail.
                                </p>
                            </div>
                            <div>
                                <h4 className="text-white font-semibold mb-2">Comprehensive Metadata</h4>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Get detailed information about casts, directors, release dates, and ratings powered by TMDB&apos;s extensive database.
                                </p>
                            </div>
                            <div>
                                <h4 className="text-white font-semibold mb-2">Ad-Free Aesthetic</h4>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Enjoy a clean, focused interface that puts the spotlight on the movies, not on intrusive advertisements.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
