import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Layers, Flame, ArrowRight, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

export const BuilderPreview = () => {
  const upcomingFeatures = [
    {
      title: 'Interactive Sourdough Crust Selector',
      desc: 'Choose between 48h Traditional Neapolitan, Ancient Grain Spelt, and Charred Charcoal Sourdough bases.',
      step: 'Step 1',
    },
    {
      title: 'Sauce Canvas & Olive Oils',
      desc: 'Layer San Marzano DOP red sauce, Umbrian Black Truffle Cream, or Genovese Pine Nut Pesto.',
      step: 'Step 2',
    },
    {
      title: 'Gourmet Cheese & Dairy Foundation',
      desc: 'Fresh Campania Buffalo Mozzarella, Smoked Scamorza, Creamy Stracciatella, or Vegan Fior.',
      step: 'Step 3',
    },
    {
      title: 'Artisan Veg & Salumi Toppings',
      desc: 'Over 25 hand-curated toppings with dynamic live visual preview and real-time nutritional calculation.',
      step: 'Step 4',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      
      {/* Header Banner */}
      <div className="bg-[#001F3F] text-[#F6F7ED] rounded-3xl p-8 sm:p-14 relative overflow-hidden shadow-2xl border border-white/10 text-center space-y-4">
        <Badge variant="spring" size="sm" className="inline-flex">
          Arriving in Part 2
        </Badge>
        
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight font-display">
          The Bespoke Pizza Builder
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          In Part 2 of our 5-part architecture, you will be able to construct custom wood-fired pizzas ingredient by ingredient with interactive pricing and visual feedback.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/menu">
            <Button variant="accent" size="lg" icon={ArrowRight} iconPosition="right">
              Explore Available Menu
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="outlineWhite" size="lg">
              Create Connoisseur Account
            </Button>
          </Link>
        </div>
      </div>

      {/* Feature Teasers */}
      <div className="space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl font-black text-[#001F3F]">Builder Architectural Preview</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Engineered with modular state management ready for seamless integration into Part 2.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {upcomingFeatures.map((feat, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex items-start gap-4 card-hover-lift"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#F6F7ED] text-[#00804C] flex items-center justify-center font-black font-display shrink-0 border border-slate-200">
                0{idx + 1}
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#00804C] tracking-wider">{feat.step}</span>
                <h3 className="text-base font-bold text-[#001F3F]">{feat.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Continuation Notice */}
      <div className="bg-[#F6F7ED] p-6 rounded-2xl border border-slate-200 flex items-center gap-3 text-xs text-slate-600">
        <CheckCircle2 className="w-5 h-5 text-[#00804C] shrink-0" />
        <span>
          <strong>Architecture Ready:</strong> The User model, authentication sessions, API router, and design tokens created in Part 1 are preserved without modifications for Part 2.
        </span>
      </div>

    </div>
  );
};

export default BuilderPreview;
