import prisma from '../../../../lib/prisma';

export async function GET(req: Request, {params}: {params: {id: string}}) {
  const id = Number(params.id);
  if (!id) return new Response('Invalid post ID', {status: 400});

  try {
    const post = await prisma.post.findUnique({
      where: {id},
      include: {user: true}
    });

    if (!post) return new Response('Post not found', {status: 404});

    return new Response(JSON.stringify(post), {status: 200});
  } catch (error) {
    console.error('Error fetching post:', error);
    return new Response(JSON.stringify({error: 'Error fetching post'}), {
      status: 500
    });
  }
}

export async function PUT(req: Request, {params}: {params: {id: string}}) {
  const id = Number(params.id);
  const {title, content} = await req.json();

  try {
    const updatedPost = await prisma.post.update({
      where: {id},
      data: {title, content}
    });
    return new Response(JSON.stringify(updatedPost), {status: 200});
  } catch (error) {
    console.error('Error updating post:', error);
    return new Response(JSON.stringify({error: 'Error updating post'}), {
      status: 500
    });
  }
}

export async function DELETE(req: Request, {params}: {params: {id: string}}) {
  const id = Number(params.id);
  try {
    const deletedPost = await prisma.post.delete({
      where: {id}
    });
    return new Response(JSON.stringify(deletedPost), {status: 200});
  } catch (error) {
    console.error('Error deleting post:', error);
    return new Response(JSON.stringify({error: 'Error deleting post'}), {
      status: 500
    });
  }
}
