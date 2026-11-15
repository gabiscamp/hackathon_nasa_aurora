/**
 * Official portraits of the crew astronauts, downloaded from Wikimedia Commons on 2026-11-15.
 * All are NASA photos in the public domain (license checked per file). Listed in the credits.
 */
export interface AstronautPhoto {
  src: string;
  author: string;
  license: string;
  sourceUrl: string;
}

export const ASTRONAUT_PHOTOS: Record<string, AstronautPhoto> = {
  mcclain: { src: '/astronauts/mcclain.jpg', author: "NASA Johnson Space Center / NASA/Bill Stafford/Helen Arase Vargas", license: "Public domain", sourceUrl: "https://commons.wikimedia.org/wiki/File:NASA_astronaut_Anne_McClain,_SpaceX_Crew-10_Commander_and_Expedition_73_Flight_Engineer_(jsc2024e066730_alt).jpg" },
  armstrong: { src: '/astronauts/armstrong.jpg', author: "NASA", license: "Public domain", sourceUrl: "https://commons.wikimedia.org/wiki/File:Neil_Armstrong_pose.jpg" },
  pontes: { src: '/astronauts/pontes.jpg', author: "NASA", license: "Public domain", sourceUrl: "https://commons.wikimedia.org/wiki/File:Marcos_Pontes.jpg" },
  schmitt: { src: '/astronauts/schmitt.jpg', author: "NASA", license: "Public domain", sourceUrl: "https://commons.wikimedia.org/wiki/File:Harrison_Schmitt_(4x5_cropped).jpg" },
  watkins: { src: '/astronauts/watkins.jpg', author: "Josh Valcarcel", license: "Public domain", sourceUrl: "https://commons.wikimedia.org/wiki/File:Jessica_Watkins_Official_NASA_Portrait_in_2021_(cropped).jpg" },
  wiseman: { src: '/astronauts/wiseman.jpg', author: "Josh Valcarcel", license: "Public domain", sourceUrl: "https://commons.wikimedia.org/wiki/File:Jsc2023e0016434_alt.jpg" },
  glover: { src: '/astronauts/glover.jpg', author: "Josh Valcarcel", license: "Public domain", sourceUrl: "https://commons.wikimedia.org/wiki/File:Jsc2023e0016433_alt.jpg" },
  moghbeli: { src: '/astronauts/moghbeli.jpg', author: "Bill Stafford", license: "Public domain", sourceUrl: "https://commons.wikimedia.org/wiki/File:Jasmin_Moghbeli_official_portrait.jpg" },
  koch: { src: '/astronauts/koch.jpg', author: "Josh Valcarcel", license: "Public domain", sourceUrl: "https://commons.wikimedia.org/wiki/File:Jsc2023e0016435_alt.jpg" },
  rubio: { src: '/astronauts/rubio.jpg', author: "NASA/Luna Posadas Nava", license: "Public domain", sourceUrl: "https://commons.wikimedia.org/wiki/File:Frank_Rubio_Artemis_III_(portrait_crop).jpg" },
  lindgren: { src: '/astronauts/lindgren.jpg', author: "Josh Valcarcel", license: "Public domain", sourceUrl: "https://commons.wikimedia.org/wiki/File:Kjell_Lindgren_Official_NASA_Portrait_in_2021_(cropped).jpg" },
  meir: { src: '/astronauts/meir.jpg', author: "Bill Ingalls", license: "Public domain", sourceUrl: "https://commons.wikimedia.org/wiki/File:Jessica_Meir_(portrait_crop).jpg" },
  maurer: { src: '/astronauts/maurer.jpg', author: "Robert Markowitz", license: "Public domain", sourceUrl: "https://commons.wikimedia.org/wiki/File:Matthias_Maurer,_official_portrait_(2020)_(cropped).jpg" },
  aunon: { src: '/astronauts/aunon.jpg', author: "Robert Markowitz", license: "Public domain", sourceUrl: "https://commons.wikimedia.org/wiki/File:Serena_M._Aunon,_NASA_astronaut_candidate_(cropped).jpg" },
};
