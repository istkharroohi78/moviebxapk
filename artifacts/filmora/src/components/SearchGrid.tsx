"use client";

import React from "react";
import { motion } from "framer-motion";
import MovieCard from "./MovieCard";
import { Movie } from "@/lib/tmdb";

interface SearchGridProps {
    results: Movie[];
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
};

const item = {
    hidden: { opacity: 0, scale: 0.9 },
    show: { opacity: 1, scale: 1 }
};

const SearchGrid = ({ results }: SearchGridProps) => {
    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4"
        >
            {results.map((movie) => (
                <motion.div key={`${movie.id}-${movie.media_type}`} variants={item}>
                    <MovieCard movie={movie} isFluid={true} posterMode={true} />
                </motion.div>
            ))}
        </motion.div>
    );
};

export default SearchGrid;
