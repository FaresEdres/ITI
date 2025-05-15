import prisma from '../../../lib/prisma';
import {NextResponse} from 'next/server';

export async function GET() {
  try {
    console.log('Fetching posts...');
    const posts = await prisma.post.findMany({
      include: {user: true}
    });
    console.log('Posts fetched successfully:', posts);
    return NextResponse.json(posts, {status: 200});
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({error: 'Error fetching posts'}, {status: 500});
  }
}

export async function POST(req: Request) {
  try {
    const {title, content, userId} = await req.json();

    if (!title || !content || !userId) {
      return NextResponse.json({error: 'Missing fields'}, {status: 400});
    }

    const newPost = await prisma.post.create({
      data: {title, content, userId}
    });

    return NextResponse.json(newPost, {status: 201});
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({error: 'Error creating post'}, {status: 500});
  }
}
