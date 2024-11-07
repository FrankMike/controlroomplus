import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { cookies } from 'next/headers';

const JWT_SECRET = 'your-secret-key';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    await connectToDatabase();
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      _id: user._id,
      username: user.username,
      name: user.name,
      surname: user.surname,
      birthday: user.birthday,
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
}

export async function PUT(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const data = await req.json();

    await connectToDatabase();
    
    // Validate the data
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.surname !== undefined) updateData.surname = data.surname;
    if (data.birthday !== undefined) updateData.birthday = data.birthday;

    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      { $set: updateData },
      { 
        new: true,
        runValidators: true 
      }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      name: updatedUser.name,
      surname: updatedUser.surname,
      birthday: updatedUser.birthday,
    });
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json(
      { 
        error: 'Update failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    await connectToDatabase();
    const deletedUser = await User.findByIdAndDelete(decoded.userId);

    if (!deletedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create response and clear the auth cookie
    const response = NextResponse.json({ message: 'Account deleted successfully' });
    response.cookies.delete({
      name: 'token',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
} 