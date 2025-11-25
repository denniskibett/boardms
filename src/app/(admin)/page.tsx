// src/app/(admin)/page.tsx - UPDATED WITH CLEANER BOUNDARIES
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import React from "react";
import RecentMemos from "@/components/dashboard/RecentMemos";
import UpcomingMeetings from "@/components/meetings/UpcomingMeetings";
import ActionItems from "@/components/dashboard/ActionItems";
import WorkflowChart from "@/components/dashboard/WorkflowChart";
import WelcomeBanner from "@/components/users/WelcomeBanner";
import EcommerceMetrics from "@/components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
import MonthlyTarget from "@/components/ecommerce/MonthlyTarget";
import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import DemographicCard from "@/components/ecommerce/DemographicCard";
import RecentOrders from "@/components/ecommerce/RecentOrders";
import DashboardProvider from "@/components/providers/DashboardProvider";

export const metadata: Metadata = {
  title: "E-Cabinet Dashboard | Government Decision Management System",
  description: "E-Cabinet System Dashboard for Government Workflow Management",
};

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  // Fetch initial data for Redux preload
  const { supabaseServer } = await import('@/lib/supabase/server');
  const supabase = supabaseServer();

  // Fetch user data
  const { data: userData } = await supabase
    .from('users')
    .select(`
      id, auth_id, name, email, image, role, status, phone, 
      last_login, ministry_id, committees, created_at, updated_at
    `)
    .eq('email', session.user?.email)
    .single();

  // Fetch ministry data
  let ministryData = null;
  if (userData?.ministry_id) {
    const { data: ministry } = await supabase
      .from('ministries')
      .select('id, name, acronym, cluster_id')
      .eq('id', userData.ministry_id)
      .single();
    ministryData = ministry;
  }

  // Fetch initial dashboard data in parallel for better performance
  const [memosResponse, meetingsResponse, metricsResponse] = await Promise.all([
    supabase
      .from('memos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5),
    
    supabase
      .from('meetings')
      .select('*')
      .gte('scheduled_date', new Date().toISOString())
      .order('scheduled_date', { ascending: true })
      .limit(5),
    
    supabase
      .from('metrics')
      .select('*')
      .single()
  ]);

  const initialData = {
    user: userData || {
      id: session.user?.id || '',
      auth_id: session.user?.id || '',
      name: session.user?.name || session.user?.email?.split('@')[0] || 'User',
      email: session.user?.email || '',
      image: session.user?.image || '',
      role: session.user?.role || 'User',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    ministry: ministryData,
    memos: memosResponse.data || [],
    meetings: meetingsResponse.data || [],
    metrics: metricsResponse.data || {}
  };

  return (
    <div className="min-h-screen bg-gray-50/30 dark:bg-gray-900/20 py-6">
      <div className="space-y-6">
        {/* Dashboard Provider with initial data */}
        <DashboardProvider initialData={initialData}>
          
          {/* Welcome Banner */}
          <WelcomeBanner 
            user={initialData.user}
            ministry={initialData.ministry}
            showWelcomeMessage={true}
            size="lg"
          />

          {/* Optional: User Info Display - Remove if not needed */}
          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200/70 dark:bg-gray-800/50 dark:border-gray-700/50 backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              User Session Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
              <div className="space-y-2">
                <p><strong className="text-gray-700 dark:text-gray-200">Name:</strong> {session.user?.name || "Not set"}</p>
                <p><strong className="text-gray-700 dark:text-gray-200">Email:</strong> {session.user?.email}</p>
              </div>
              <div className="space-y-2">
                <p><strong className="text-gray-700 dark:text-gray-200">Role:</strong> {session.user?.role || "User"}</p>
                <p><strong className="text-gray-700 dark:text-gray-200">User ID:</strong> {session.user?.id}</p>
              </div>
            </div>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-12 gap-6">
            
            {/* Row 1: Full Width Components */}
            <div className="col-span-12">
              <UpcomingMeetings />
            </div>

            {/* Row 2: Metrics and Charts */}
            <div className="col-span-12 xl:col-span-7 space-y-6">
              <EcommerceMetrics />
              <MonthlySalesChart />
            </div>

            <div className="col-span-12 xl:col-span-5">
              <MonthlyTarget />
            </div>

            {/* Row 3: Full Width Chart */}
            <div className="col-span-12">
              <StatisticsChart />
            </div>

            {/* Row 4: Side by Side */}
            <div className="col-span-12 xl:col-span-5">
              <DemographicCard />
            </div>

            <div className="col-span-12 xl:col-span-7">
              <RecentOrders />
            </div>

            {/* Row 5: Full Width */}
            <div className="col-span-12">
              <WorkflowChart />
            </div>

            {/* Row 6: Memos and Actions */}
            <div className="col-span-12 lg:col-span-7">
              <RecentMemos />
            </div>

            <div className="col-span-12 lg:col-span-5">
              <ActionItems />
            </div>
          </div>
        </DashboardProvider>
      </div>
    </div>
  );
}