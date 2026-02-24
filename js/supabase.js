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

/* ============================================
   Supabase News Feed Persistence
   ============================================ */

const SupabaseNews = {
  _headers() {
    return {
      'Content-Type': 'application/json',
      apikey: SupabaseEchoConfig.anonKey,
      Authorization: `Bearer ${SupabaseEchoConfig.anonKey}`,
    };
  },

  _url(table, query) {
    return `${SupabaseEchoConfig.url}/rest/v1/${table}${query || ''}`;
  },

  isConfigured() {
    return SupabaseEcho.isConfigured();
  },

  async getLikes(postId) {
    if (!this.isConfigured()) return 0;
    try {
      const res = await fetch(
        this._url('news_likes', `?post_id=eq.${encodeURIComponent(postId)}&select=id`),
        { headers: { ...this._headers(), Prefer: 'count=exact' } }
      );
      const range = res.headers.get('content-range');
      if (range) {
        const total = range.split('/')[1];
        return total === '*' ? 0 : parseInt(total);
      }
      const data = await res.json();
      return Array.isArray(data) ? data.length : 0;
    } catch (e) { return 0; }
  },

  async hasLiked(postId, visitorId) {
    if (!this.isConfigured()) return false;
    try {
      const res = await fetch(
        this._url('news_likes', `?post_id=eq.${encodeURIComponent(postId)}&visitor_id=eq.${encodeURIComponent(visitorId)}&select=id`),
        { headers: this._headers() }
      );
      const data = await res.json();
      return Array.isArray(data) && data.length > 0;
    } catch (e) { return false; }
  },

  async toggleLike(postId, visitorId) {
    if (!this.isConfigured()) return { liked: false, count: 0 };
    try {
      const liked = await this.hasLiked(postId, visitorId);
      if (liked) {
        await fetch(
          this._url('news_likes', `?post_id=eq.${encodeURIComponent(postId)}&visitor_id=eq.${encodeURIComponent(visitorId)}`),
          { method: 'DELETE', headers: this._headers() }
        );
      } else {
        await fetch(this._url('news_likes'), {
          method: 'POST',
          headers: { ...this._headers(), Prefer: 'return=minimal' },
          body: JSON.stringify([{ post_id: postId, visitor_id: visitorId }]),
        });
      }
      const count = await this.getLikes(postId);
      return { liked: !liked, count };
    } catch (e) { return { liked: false, count: 0 }; }
  },

  async getComments(postId) {
    if (!this.isConfigured()) return [];
    try {
      const res = await fetch(
        this._url('news_comments', `?post_id=eq.${encodeURIComponent(postId)}&order=created_at.asc&select=*`),
        { headers: this._headers() }
      );
      if (!res.ok) return [];
      return await res.json();
    } catch (e) { return []; }
  },

  async addComment(postId, username, text) {
    if (!this.isConfigured()) return null;
    try {
      const res = await fetch(this._url('news_comments'), {
        method: 'POST',
        headers: { ...this._headers(), Prefer: 'return=representation' },
        body: JSON.stringify([{ post_id: postId, username, body: text }]),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data[0] || null;
    } catch (e) { return null; }
  },
};

function getVisitorId() {
  let id = localStorage.getItem('echoplex_visitor_id');
  if (!id) {
    id = 'v_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('echoplex_visitor_id', id);
  }
  return id;
}

window.SupabaseNews = SupabaseNews;
window.getVisitorId = getVisitorId;
