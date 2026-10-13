import LegalLayout from './LegalLayout';

const LIBS = [
  ['React', 'MIT'], ['React Router', 'MIT'], ['Vite', 'MIT'], ['Tailwind CSS', 'MIT'],
  ['Radix UI', 'MIT'], ['shadcn/ui', 'MIT'], ['Lucide icons', 'ISC'], ['Leaflet', 'BSD-2-Clause'],
  ['React Leaflet', 'Hippocratic-2.1'], ['Recharts', 'MIT'], ['TanStack Query', 'MIT'],
  ['Supabase JS', 'MIT'], ['date-fns', 'MIT'], ['Zod', 'MIT'],
];

export default function Licenses() {
  return (
    <LegalLayout title="Open-source licenses">
      <p>Almien is built with open-source software. We are grateful to the people who maintain it.</p>
      <h2>Libraries</h2>
      <ul>{LIBS.map(([n, l]) => <li key={n}>{n} ({l})</li>)}</ul>
      <h2>Map data</h2>
      <p>Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>. Map tiles © <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>.</p>
    </LegalLayout>
  );
}
