// Paid "featured shop" listings shown at the top of the Parts screen.
// Add a shop here when it pays for a listing; `country` limits it to users in that country,
// `makes` (optional, lower-case English) limits it to owners of those car makes.
export type FeaturedShop = { name: string; country: string; city?: string; makes?: string[]; phone?: string; maps?: string; note?: string };

export const FEATURED: FeaturedShop[] = [];

/** Where shop owners ask about advertising (a WhatsApp link, form or page). Empty hides the button. */
export const ADVERTISE_URL = "";
