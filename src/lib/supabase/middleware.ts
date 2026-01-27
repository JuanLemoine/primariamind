import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Public routes that don't require auth
  const publicRoutes = ['/', '/auth'];
  const isPublicRoute = publicRoutes.some(route =>
    path === route || path.startsWith('/auth')
  );

  // If not logged in and trying to access protected route
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth';
    return NextResponse.redirect(url);
  }

  // If logged in, check profile and consent
  if (user && !isPublicRoute && path !== '/consent' && path !== '/onboarding/emergency-contact') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('consent_accepted, role')
      .eq('id', user.id)
      .single();

    // Redirect to consent if not accepted
    if (profile && !profile.consent_accepted && path !== '/consent') {
      const url = request.nextUrl.clone();
      url.pathname = '/consent';
      return NextResponse.redirect(url);
    }

    // Check emergency contact for users (not therapists)
    if (profile && profile.consent_accepted && profile.role === 'user') {
      const { data: emergencyContact } = await supabase
        .from('emergency_contacts')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if ((!emergencyContact || emergencyContact.length === 0) &&
          path !== '/onboarding/emergency-contact') {
        const url = request.nextUrl.clone();
        url.pathname = '/onboarding/emergency-contact';
        return NextResponse.redirect(url);
      }
    }

    // Role-based routing
    if (profile) {
      // Therapists can't access user chat
      if (profile.role === 'therapist' && path.startsWith('/chat')) {
        const url = request.nextUrl.clone();
        url.pathname = '/therapist';
        return NextResponse.redirect(url);
      }

      // Users can't access therapist panel
      if (profile.role === 'user' && path.startsWith('/therapist')) {
        const url = request.nextUrl.clone();
        url.pathname = '/chat';
        return NextResponse.redirect(url);
      }
    }
  }

  // Redirect logged in users away from auth page
  if (user && path === '/auth') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const url = request.nextUrl.clone();
    url.pathname = profile?.role === 'therapist' ? '/therapist' : '/chat';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
