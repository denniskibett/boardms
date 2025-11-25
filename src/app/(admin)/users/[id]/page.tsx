import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import UserProfile from "@/components/users/UserProfile";
import { supabaseServer } from '@/lib/supabase/server';

interface Props {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = supabaseServer();

  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", params.id)
      .single();

    if (error || !user) {
      console.error("Error fetching user for metadata:", error);
      return {
        title: "User Not Found | E-Cabinet System",
      };
    }

    return {
      title: `${user.name} | User Profile | E-Cabinet System`,
      description: `Profile page for ${user.name} - ${user.role}`,
    };
  } catch (error) {
    console.error("Unexpected error in generateMetadata:", error);
    return {
      title: "User Profile | E-Cabinet System",
    };
  }
}

export default async function UserProfilePage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const supabase = supabaseServer();

  try {
    // Fetch user from custom table using auth_id (UUID)
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", id)
      .single();

    if (userError || !user) {
      console.error("Error fetching user:", userError);
      notFound();
    }

    // Fetch ministry if available
    let ministry = null;
    if (user.ministry_id) {
      const { data: ministryData, error: ministryError } = await supabase
        .from("ministries")
        .select("*")
        .eq("id", user.ministry_id)
        .single();

      if (ministryError) {
        console.error("Error fetching ministry:", ministryError);
      } else {
        ministry = ministryData;
      }
    }

    return (
      
      <div className="space-y-6">
        
        <UserProfile
          user={user}
          ministry={ministry}
          currentUser={session.user}
        />
      </div>
    );
  } catch (error) {
    console.error("Unexpected error in user profile page:", error);
    notFound();
  }
}