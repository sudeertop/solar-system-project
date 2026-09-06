/**
 * Hand-written mirrors of the Pydantic v2 models in backend/models/bodies.py.
 * Keep this file and that one in sync in the same edit.
 */

export interface BodyStat {
  label: string;
  value: string;
}

export interface BodySection {
  heading: string;
  body: string;
}

export interface Body {
  id: string;
  name: string;
  kicker: string;
  body_type: string;
  /** "page" -> click navigates to href; "panel" -> click only swaps the left panel */
  mode: "page" | "panel";
  href: string | null;
  lead: string;
  stats: BodyStat[];
  sections: BodySection[];
  color: string;
  radius: number;
  orbit_radius: number;
  orbit_period_days: number | null;
}

export interface Overview {
  kicker: string;
  title: string;
  lead: string;
  sections: BodySection[];
  hint: string;
}
