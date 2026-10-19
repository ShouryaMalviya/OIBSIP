import React from 'react';
import { Link } from 'react-router-dom';
import { Pizza, ArrowLeft, Compass } from 'lucide-react';
import Button from '../components/common/Button';

export const NotFound = () => {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl p-10 border border-slate-200 shadow-xl space-y-6">
        
        {/* Large 404 with Pizza Graphic */}
        <div className="relative inline-block">
          <span className="text-8xl sm:text-9xl font-black font-display text-slate-100 select-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-[#001F3F] text-[#DBE64C] flex items-center justify-center shadow-lg transform -rotate-12">
              <Pizza className="w-10 h-10" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-[#001F3F] tracking-tight">
            Oops! Slice Not Found
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            The pizza recipe or page you are searching for might have been consumed or relocated to another oven.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/">
            <Button variant="primary" size="md" icon={ArrowLeft} className="w-full sm:w-auto">
              Return Home
            </Button>
          </Link>
          <Link to="/menu">
            <Button variant="outline" size="md" icon={Compass} className="w-full sm:w-auto">
              Explore Menu
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default NotFound;
