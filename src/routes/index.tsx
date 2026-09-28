import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { LilaApp } from "@/components/leela/app";
import { useGame } from "@/lib/game-store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  useEffect(() => {
    void Promise.resolve(useGame.persist.rehydrate());
  }, []);

  return <LilaApp />;
}