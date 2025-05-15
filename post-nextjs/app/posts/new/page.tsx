'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function CreatePost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You must be logged in to create a post.', {
        position: 'top-center'
      });
      return;
    }

    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({title, content})
    });

    if (res.ok) {
      toast.success('Post created successfully!', {position: 'top-center'});
      setTimeout(() => router.push('/'), 1000);
    } else {
      toast.error('Failed to create post.', {position: 'top-center'});
    }
  };

  return (
    <>
      <ToastContainer />
      <div className='min-h-screen bg-slate-900 text-white flex items-center justify-center px-4 py-12'>
        <div className='w-full max-w-2xl bg-slate-800 rounded-xl shadow-lg p-8 space-y-6'>
          <h1 className='text-3xl font-bold text-emerald-400 text-center'>
            Create New Post
          </h1>
          <form onSubmit={handleSubmit} className='space-y-5'>
            <div>
              <label className='block mb-1 font-medium'>Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className='w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500'
                required
              />
            </div>
            <div>
              <label className='block mb-1 font-medium'>Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className='w-full px-4 py-2 h-32 resize-none bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500'
                required
              />
            </div>
            <button
              type='submit'
              className='w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md transition'
            >
              Create Post
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
