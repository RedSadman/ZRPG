// Small line icons drawn in currentColor, so they follow the text colour (and rank colours) in both themes.

const PATHS: Record<string, string> = {
  weapon: 'M5 19 L17 7 M14 4 L20 4 L20 10 M7 15 L9 17 M4 20 L6 18',
  robe: 'M8 3 L12 6 L16 3 L20 7 L17 10 L17 21 L7 21 L7 10 L4 7 Z',
  bracers: 'M6 5 H14 V19 H6 Z M14 8 H18 V16 H14 M6 10 H14 M6 14 H14',
  boots: 'M8 3 V14 L4 17 V21 H16 L19 18 L14 14 V3',
  pendant: 'M8 3 Q12 9 16 3 M12 8 V11 M12 11 L16 15 L12 20 L8 15 Z',
  ring: 'M12 21 A6 6 0 1 1 12.01 21 Z M9 6 L12 3 L15 6',
  qi: 'M12 3 A9 9 0 1 0 21 12 M12 7 A5 5 0 1 1 7 12 M12 11 A1 1 0 1 1 12.01 11',
  talent: 'M12 3 L14.6 9 L21 9.5 L16 13.6 L17.6 20 L12 16.5 L6.4 20 L8 13.6 L3 9.5 L9.4 9 Z',
  item: 'M3 9 H21 V20 H3 Z M3 9 L6 4 H18 L21 9 M10 13 H14',
  technique: 'M6 3 H17 A2 2 0 0 1 19 5 V21 H8 A2 2 0 0 1 6 19 Z M9 8 H16 M9 12 H16 M9 16 H13',
  cultivation: 'M12 20 C6 18 4 12 4 12 C8 12 11 14 12 20 C13 14 16 12 20 12 C20 12 18 18 12 20 Z M12 20 C10 14 10 9 12 4 C14 9 14 14 12 20 Z',
  stats: 'M7 21 V13 M12 21 V7 M17 21 V10 M4 21 H20',
  knowledge: 'M3 12 C6 6 18 6 21 12 C18 18 6 18 3 12 Z M12 9 A3 3 0 1 1 12.01 9',
  death: 'M12 3 A7 7 0 0 1 19 10 V14 L16 16 V20 H8 V16 L5 14 V10 A7 7 0 0 1 12 3 Z M9 10 H10 M14 10 H15 M11 20 V17 M13 20 V17',
  bolt: 'M13 2 L5 13 H11 L10 22 L19 10 H13 Z',
  secret: 'M7 11 V8 A5 5 0 0 1 17 8 V11 M5 11 H19 V21 H5 Z M12 15 V17',
  place: 'M12 21 C12 21 5 14 5 9 A7 7 0 0 1 19 9 C19 14 12 21 12 21 Z M12 7 A2 2 0 1 1 12.01 7',
};

export function Icon({ name, size = 16, title }: { name: string; size?: number; title?: string }) {
  const d = PATHS[name] ?? PATHS.item!;
  return (
    <svg
      class="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      <path d={d} />
    </svg>
  );
}
