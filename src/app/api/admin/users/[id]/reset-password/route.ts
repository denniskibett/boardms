import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { password } = await request.json();
    const supabase = supabaseServer();

    const { data, error } = await supabase.auth.admin.updateUserById(
      params.id,
      { password: password || 'NewPassword123!' }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ 
      message: 'Password reset successfully',
      user: data.user,
      note: password ? 'Password updated with provided value' : 'Password reset to default: NewPassword123!'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}