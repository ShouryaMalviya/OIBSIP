import React from 'react';
import { Link } from 'react-router-dom';
import { Pizza, Phone, Mail, MapPin, Clock, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-[#001F3F] text-[#F6F7ED] pt-16 pb-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* Brand & Story */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#00804C] flex items-center justify-center text-[#DBE64C]">
                <Pizza className="w-5 h-5 -rotate-12" />
              </div>
              <span className="text-xl font-extrabold tracking-tight font-display">
                PIZZA<span className="text-[#DBE64C]">VERSE</span>
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Elevating pizza craftsmanship to an art form. Naturally fermented sourdough, imported Italian DOP ingredients, and wood-fired mastery delivered to your dining table.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="h-2 w-2 rounded-full bg-[#74C365] animate-ping" />
              <span className="text-xs text-[#74C365] font-semibold">Kitchen Active & Wood Ovens Fired</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#DBE64C] mb-4">
              Explore PizzaVerse
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-300">
              <li>
                <Link to="/" className="hover:text-[#DBE64C] transition-colors">Home & Heritage</Link>
              </li>
              <li>
                <Link to="/menu" className="hover:text-[#DBE64C] transition-colors">Signature Pizzas</Link>
              </li>
              <li>
                <Link to="/builder" className="hover:text-[#DBE64C] transition-colors">Custom Crust Builder (Part 2)</Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-[#DBE64C] transition-colors">Connoisseur Club Membership</Link>
              </li>
            </ul>
          </div>

          {/* Operating Hours & Ovens */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#DBE64C] mb-4">
              Wood-Fired Hours
            </h4>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#74C365] shrink-0 mt-0.5" />
                <div>
                  <span className="block font-medium text-white">Monday – Thursday</span>
                  <span className="text-xs text-slate-400">11:30 AM – 11:00 PM</span>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#74C365] shrink-0 mt-0.5" />
                <div>
                  <span className="block font-medium text-white">Friday – Sunday</span>
                  <span className="text-xs text-slate-400">11:30 AM – 01:00 AM (Late Bake)</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Contact & Location */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#DBE64C] mb-4">
              Artisan Kitchen
            </h4>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[#74C365] shrink-0" />
                <span>42 Via Forno, Gourmet District</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#74C365] shrink-0" />
                <span>+1 (800) 749-9283 (PIZZA)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#74C365] shrink-0" />
                <span>concierge@pizzaverse.local</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 mt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>
            &copy; {new Date().getFullYear()} PizzaVerse Artisanal. All rights reserved. Part 1 Architecture.
          </p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1">
              Hand-stretched with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" /> in pure sourdough
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
