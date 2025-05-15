'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setEmailError('');
    setPasswordError('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({email, password})
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('userName', data.user?.name || 'User');
      toast.success('Login successful! Redirecting...', {
        position: 'top-right'
      });
      setTimeout(() => router.push('/'), 1000);
    } else {
      if (data.error.includes('email')) {
        setEmailError('Incorrect email or email does not exist.');
      }
      if (data.error.includes('password')) {
        setPasswordError('Incorrect password.');
      }
      toast.error(data.error || 'Login failed', {
        position: 'top-right'
      });
    }
  };

  return (
    <>
      <ToastContainer />

      <section className='min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4'>
        <form
          onSubmit={handleLogin}
          className='w-full max-w-md bg-white dark:bg-gray-800 shadow-xl rounded-xl p-8'
        >
          <h1 className='text-3xl font-extrabold text-center mb-6 text-gray-900 dark:text-white'>
            Login to Your Account
          </h1>

          <div className='mb-4'>
            <label className='block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300'>
              Email
            </label>
            <input
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='example@email.com'
              className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
              required
            />
            {emailError && (
              <p className='text-sm text-red-500 mt-1'>{emailError}</p>
            )}
          </div>

          <div className='mb-6'>
            <label className='block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300'>
              Password
            </label>
            <input
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
              required
            />
            {passwordError && (
              <p className='text-sm text-red-500 mt-1'>{passwordError}</p>
            )}
          </div>

          <button
            type='submit'
            className='w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition'
          >
            Login
          </button>

          <p className='text-center mt-6 text-sm text-gray-600 dark:text-gray-300'>
            You don’t have an account?{' '}
            <Link
              href='/register'
              className='text-blue-600 hover:underline dark:text-blue-400'
            >
              Register
            </Link>
          </p>
        </form>
      </section>
    </>
  );
}
