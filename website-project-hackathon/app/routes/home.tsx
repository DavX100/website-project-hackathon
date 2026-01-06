import type { Route } from "./+types/home";
import { WebCalendar } from "~/components/WebCalendar";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return <WebCalendar />;
}
