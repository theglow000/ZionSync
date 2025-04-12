'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import SongDatabase from '@/components/ui/SongDatabase';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function SongManagementPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <Link href="/?tab=worship" className="flex items-center gap-2 text-purple-700 hover:text-purple-900">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Worship Team</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <img
              src="/church-logo.png"
              alt="Church Logo"
              className="h-10 object-contain"
            />
            <img
              src="/ZionSyncLogo.png"
              alt="ZionSync Logo"
              className="h-10 object-contain"
            />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-purple-700 mb-8">Worship Planning</h1>
        
        <Card className="bg-white p-5 shadow-lg">
          <SongDatabase />
        </Card>
      </div>
    </div>
  );
}
