import bcrypt from 'bcryptjs';
import prisma from '../../../../lib/prisma';
export async function POST(req: Request) {
  const {name, email, password} = await req.json();

  if (!name || !email || !password) {
    return new Response(JSON.stringify({error: 'Missing required fields'}), {
      status: 400
    });
  }

  const existingUser = await prisma.user.findUnique({
    where: {email}
  });
  if (existingUser) {
    return new Response(JSON.stringify({error: 'User already exists'}), {
      status: 400
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword
    }
  });

  return new Response(JSON.stringify(newUser), {status: 201});
}
