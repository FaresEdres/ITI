'use client';

import {useEffect, useState} from 'react';

export default function Home() {
  const [posts, setPosts] = useState([]);

  const fetchPosts = async () => {
    const res = await fetch('/api/posts');
    const data = await res.json();
    setPosts(data);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (id: number) => {
    await fetch(`/api/posts/${id}`, {method: 'DELETE'});
    fetchPosts();
  };

  return (
    <main className='min-h-screen bg-gradient-to-tr from-gray-950 to-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-5xl mx-auto'>
        <div className='flex flex-col sm:flex-row justify-between items-center mb-12'>
          <h1 className='text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-blue-500 text-transparent bg-clip-text'>
            Explore Posts
          </h1>
          <a
            href='/posts/new'
            className='mt-6 sm:mt-0 inline-block px-6 py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-blue-600 to-emerald-500 hover:brightness-110 shadow-lg transition'
          >
            + Create Post
          </a>
        </div>

        {posts.length === 0 ? (
          <div className='text-center text-gray-400 text-lg mt-20'>
            No posts yet. Be the first to share something amazing!
          </div>
        ) : (
          <div className='grid gap-8 sm:grid-cols-2 lg:grid-cols-3'>
            {posts.map((post: any) => (
              <div
                key={post.id}
                className='bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 flex flex-col justify-between'
              >
                <div>
                  <h2 className='text-2xl font-semibold mb-2 text-white'>
                    {post.title}
                  </h2>
                  <p className='text-sm text-gray-300 mb-4 line-clamp-3'>
                    {post.content}
                  </p>
                  <p className='text-xs text-gray-500 italic mb-4'>
                    By {post.user?.name ?? 'Unknown'}
                  </p>
                </div>
                <div className='flex justify-between items-center mt-auto pt-4 border-t border-gray-700'>
                  <a
                    href={`/posts/${post.id}`}
                    className='text-emerald-400 hover:underline text-sm font-medium'
                  >
                    Edit
                  </a>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className='text-red-500 hover:underline text-sm font-medium'
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
