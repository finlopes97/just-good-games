/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

/*
  The Netlify Identity widget is injected at runtime (only when accepting a CMS invite —
  see Layout.astro), so it has no import and no types of its own. Declaring the handful of
  members actually used keeps `astro check` honest without pulling in a dependency for a
  script that ordinary page views never load.
*/
interface NetlifyIdentityUser {
  id: string;
  email: string;
}

interface NetlifyIdentityWidget {
  on(event: string, callback: (user?: NetlifyIdentityUser) => void): void;
  open(tab?: string): void;
  gotrue: {
    acceptInvite(token: string, remember: boolean): Promise<unknown>;
  };
}

interface Window {
  netlifyIdentity?: NetlifyIdentityWidget;
}
