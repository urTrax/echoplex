/* ============================================
   Supabase Echo Chamber Signup Integration
   ============================================ */

const SupabaseEchoConfig = {
  // Example: https://YOUR_PROJECT_ID.supabase.co
  url: 'https://cmkcsnpywcskiduuvgzf.supabase.co',
  // Public anon key from Supabase project settings
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNta2NzbnB5d2Nza2lkdXV2Z3pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4Nzg2ODUsImV4cCI6MjA4NzQ1NDY4NX0.yY7q_S_ovrNMvuosvD-pyveM2Buewjt3Pw6DoG6UiWg',
  // Table to store signups
  signupsTable: 'echo_chamber_signups',
};

const SupabaseEcho = {
  isConfigured() {
    return Boolean(SupabaseEchoConfig.url && SupabaseEchoConfig.anonKey);
  },

  async addSignup(email) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      return { ok: false, message: 'Please enter a valid email address.' };
    }

    if (!this.isConfigured()) {
      return {
        ok: false,
        message: 'Echo Chamber signup is not configured yet.',
      };
    }

    try {
      const res = await fetch(
        `${SupabaseEchoConfig.url}/rest/v1/${encodeURIComponent(SupabaseEchoConfig.signupsTable)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SupabaseEchoConfig.anonKey,
            Authorization: `Bearer ${SupabaseEchoConfig.anonKey}`,
            Prefer: 'return=representation',
          },
          body: JSON.stringify([
            {
              email: normalizedEmail,
              source: 'echoplexmusic.com',
            },
          ]),
        }
      );

      if (res.ok) {
        return { ok: true, message: 'Welcome to the Echo Chamber.' };
      }

      let errorMessage = 'Something went wrong. Please try again.';
      let errorCode = '';

      try {
        const payload = await res.json();
        errorMessage = payload?.message || payload?.error || errorMessage;
        errorCode = payload?.code || '';
      } catch (parseError) {
        // Keep generic fallback if body is not JSON
      }

      // Unique constraint violation: treat as friendly success.
      if (res.status === 409 || errorCode === '23505') {
        return { ok: true, message: "You're already in the Echo Chamber." };
      }

      return { ok: false, message: errorMessage };
    } catch (error) {
      return {
        ok: false,
        message: 'Network error. Please try again in a moment.',
      };
    }
  },
};

window.SupabaseEcho = SupabaseEcho;
