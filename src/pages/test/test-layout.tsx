import React from 'react';
import { NextPage } from 'next';
import Layout from '@/components/Layout';

const TestLayoutPage: NextPage = () => {
  return (
    <Layout>
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold mb-4">Layout Test Page</h1>
        <p className="mb-4">This is a test page to verify that the Layout component works correctly.</p>
        <div className="p-4 bg-gray-100 rounded">
          <p>Content area with some placeholder text. If you can see this inside a nice layout with a navigation bar at the top and a footer at the bottom, the Layout component is working correctly!</p>
        </div>
      </div>
    </Layout>
  );
};

export default TestLayoutPage;