import type { Metadata } from "next";
import React from "react";
import RecentMemos from "@/components/dashboard/RecentMemos";
import UpcomingMeetings from "@/components/meetings/UpcomingMeetings";
import ActionItems from "@/components/dashboard/ActionItems";
import WorkflowChart from "@/components/dashboard/WorkflowChart";
import WelcomeBanner from "@/components/users/WelcomeBanner";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: "E-Cabinet Dashboard | Government Decision Management System",
  description: "E-Cabinet System Dashboard for Government Workflow Management",
};

export default async function Dashboard() {
  // Get NextAuth session instead of Supabase auth
  const session = await getServerSession(authOptions);
  
  console.log('🏠 Dashboard session check:', {
    hasSession: !!session,
    user: session?.user
  });

  if (!session) {
    console.log('❌ No session found, redirecting to signin');
    redirect('/auth/signin');
  }

  console.log('✅ Session valid for user:', session.user.email);

  // Get system settings if you have a settings table
  const { supabaseServer } = await import('@/lib/supabase/server');
  const supabase = supabaseServer();
  
  let systemName = 'E-Cabinet System';
  const { data: systemSettings } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'system_name')
    .single();

  if (systemSettings) {
    systemName = systemSettings.value;
  }

  // Fetch user data for WelcomeBanner
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select(`
      id,
      auth_id,
      name,
      email,
      image,
      role,
      status,
      phone,
      last_login,
      ministry_id,
      committees,
      created_at,
      updated_at
    `)
    .eq('email', session.user.email)
    .single();

  // Fetch ministry data if user has a ministry_id
  let ministryData = null;
  if (userData?.ministry_id) {
    const { data: ministry } = await supabase
      .from('ministries')
      .select('id, name, acronym, cluster_id')
      .eq('id', userData.ministry_id)
      .single();
    ministryData = ministry;
  }

  // If user not found in users table, create a basic user object from session
  const user = userData || {
    id: session.user.id || '',
    auth_id: session.user.id || '',
    name: session.user.name || session.user.email?.split('@')[0] || 'User',
    email: session.user.email || '',
    image: session.user.image || '',
    role: session.user.role || 'User',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Banner */}
      <WelcomeBanner 
        user={user}
        ministry={ministryData}
        showWelcomeMessage={true}
        size="lg"
      />

      {/* Original Dashboard Content */}
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Upcoming Meetings */}
        <div className="col-span-12 xl:col-span-12">
          <UpcomingMeetings />
        </div>

        {/* Charts and Workflow */}
        <div className="col-span-12 xl:col-span-12">
          <WorkflowChart />
        </div>

        {/* Recent Memos and Action Items */}
        <div className="col-span-12 lg:col-span-7">
          <RecentMemos />
        </div>

        <div className="col-span-12 lg:col-span-5">
          <ActionItems />
        </div>
      </div>
    </div>
  );
}