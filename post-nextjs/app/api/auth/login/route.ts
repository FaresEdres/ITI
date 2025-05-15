import prisma from '../../../../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  const {email, password} = await req.json();

  if (!email || !password) {
    return new Response(JSON.stringify({error: 'Missing email or password'}), {
      status: 400
    });
  }

  const user = await prisma.user.findUnique({
    where: {email}
  });

  if (!user) {
    return new Response(JSON.stringify({error: 'User not found'}), {
      status: 404
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return new Response(JSON.stringify({error: 'Invalid credentials'}), {
      status: 401
    });
  }

  const token = jwt.sign({userId: user.id}, process.env.JWT_SECRET!, {
    expiresIn: '2h'
  });

  return new Response(JSON.stringify({token}), {status: 200});
}
